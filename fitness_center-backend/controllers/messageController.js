const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");
const Booking = require("../models/Booking");
const EmailThread = require("../models/EmailThread");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const {
  sendEmail,
  buildMessageEmail,
  buildAnnouncementEmail,
} = require("../services/emailService");
const { emitToUser } = require("../services/socket");

const allowedRecipientRoles = {
  customer: ["coach", "admin"],
  coach: ["customer", "admin"],
  admin: ["customer", "coach"],
};

const getAppUrl = () =>
  process.env.CLIENT_URL?.split(",")[0]?.trim() || "http://localhost:3000";

const buildAttachmentPayload = (req, files = []) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return files.map((file) => ({
    fileName: file.originalname,
    fileUrl: `${baseUrl}/uploads/messages/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
  }));
};

const getThreadParticipants = (senderId, receiverId) =>
  [String(senderId), String(receiverId)].sort();

const toValidObjectIds = (values = []) =>
  values.filter((value) => mongoose.Types.ObjectId.isValid(String(value)));

const findOrCreateThread = async ({ senderId, receiverId, subject }) => {
  const participants = getThreadParticipants(senderId, receiverId);

  let thread = await EmailThread.findOne({
    participants: { $all: participants },
    $expr: { $eq: [{ $size: "$participants" }, 2] },
    subject,
  });

  if (!thread) {
    thread = await EmailThread.create({
      subject,
      participants,
      messageCount: 0,
      lastMessageAt: new Date(),
    });
  }

  return thread;
};

const createNotification = async ({
  userId,
  title,
  body,
  relatedMessage,
  relatedThread,
  actionUrl,
}) => {
  const notification = await Notification.create({
    user: userId,
    type: "message",
    title,
    body,
    relatedMessage,
    relatedThread,
    actionUrl,
  });

  emitToUser(userId, "notification:received", notification);
  return notification;
};

const hasCoachCustomerRelationship = async (customerId, coachId) => {
  const booking = await Booking.findOne({ customerId, coachId }).select("_id");
  return Boolean(booking);
};

const getAllowedRecipients = async (user) => {
  if (user.role === "admin") {
    return User.find({ role: { $in: ["customer", "coach"] } })
      .select("name email role coachStatus")
      .sort({ role: 1, name: 1 });
  }

  if (user.role === "customer") {
    const bookingCoaches = await Booking.distinct("coachId", {
      customerId: user.id,
    });
    const validCoachIds = toValidObjectIds(bookingCoaches);

    const coaches =
      validCoachIds.length > 0
        ? await User.find({
            _id: { $in: validCoachIds },
            role: "coach",
            coachStatus: "approved",
          })
            .select("name email role coachStatus")
            .sort({ name: 1 })
        : [];

    const admins = await User.find({ role: "admin" })
      .select("name email role coachStatus")
      .sort({ name: 1 });

    return [...coaches, ...admins];
  }

  const bookingCustomers = await Booking.distinct("customerId", {
    coachId: user.id,
  });
  const validCustomerIds = toValidObjectIds(bookingCustomers);

  const customers =
    validCustomerIds.length > 0
      ? await User.find({
          _id: { $in: validCustomerIds },
          role: "customer",
        })
          .select("name email role coachStatus")
          .sort({ name: 1 })
      : [];

  const admins = await User.find({ role: "admin" })
    .select("name email role coachStatus")
    .sort({ name: 1 });

  return [...customers, ...admins];
};

const deliverMessage = async ({
  sender,
  receiver,
  subject,
  content,
  attachments = [],
  threadId,
  isAnnouncement = false,
}) => {
  const thread = threadId
    ? await EmailThread.findById(threadId)
    : await findOrCreateThread({
        senderId: sender._id,
        receiverId: receiver._id,
        subject,
      });

  if (!thread) {
    throw new Error("Conversation thread not found");
  }

  const threadParticipantIds = thread.participants.map((participant) =>
    String(participant),
  );

  if (
    !threadParticipantIds.includes(String(sender._id)) ||
    !threadParticipantIds.includes(String(receiver._id))
  ) {
    throw new Error("Receiver is not part of this conversation");
  }

  const storedMessage = await Message.create({
    thread: thread._id,
    sender: sender._id,
    receiver: receiver._id,
    subject,
    content,
    attachments: attachments.map(({ fileName, fileUrl, mimeType, size }) => ({
      fileName,
      fileUrl,
      mimeType,
      size,
    })),
    deliveryStatus: "pending",
  });

  thread.lastMessage = storedMessage._id;
  thread.lastMessageAt = new Date();
  thread.messageCount += 1;
  thread.subject = subject;
  await thread.save();

  const emailAttachments = attachments
    .filter((attachment) => attachment.path)
    .map((attachment) => ({
      filename: attachment.fileName,
      path: attachment.path,
      contentType: attachment.mimeType,
    }));

  const emailSubject = `PrimeFit: ${subject}`;
  const html = isAnnouncement
    ? buildAnnouncementEmail({
        senderName: sender.name,
        subject,
        content,
        appUrl: getAppUrl(),
      })
    : buildMessageEmail({
        senderName: sender.name,
        subject,
        content,
        appUrl: getAppUrl(),
      });

  try {
    const mailResult = await sendEmail({
      to: receiver.email,
      subject: emailSubject,
      html,
      text: `${sender.name}: ${subject}\n\n${content}`,
      attachments: emailAttachments,
    });

    storedMessage.deliveryStatus = mailResult?.skipped ? "pending" : "sent";
    storedMessage.emailMessageId = mailResult?.messageId;
  } catch (error) {
    storedMessage.deliveryStatus = "failed";
  }

  await storedMessage.save();

  const notification = await createNotification({
    userId: receiver._id,
    title: `New message from ${sender.name}`,
    body: subject,
    relatedMessage: storedMessage._id,
    relatedThread: thread._id,
    actionUrl: `/dashboard`,
  });

  emitToUser(receiver._id, "message:received", {
    message: storedMessage,
    thread,
  });

  return { message: storedMessage, thread, notification };
};

const buildThreadQuery = async (req) => {
  const folder = (req.query.folder || "inbox").toLowerCase();
  const search = (req.query.search || "").trim();
  const userId = req.user.id;

  const messageFilter =
    folder === "sent"
      ? { sender: userId }
      : folder === "all"
        ? { $or: [{ sender: userId }, { receiver: userId }] }
        : { receiver: userId };

  const threadIds = await Message.distinct("thread", messageFilter);

  if (threadIds.length === 0) {
    return [];
  }

  const threads = await EmailThread.find({ _id: { $in: threadIds } })
    .populate("participants", "name email role coachStatus")
    .populate({
      path: "lastMessage",
      populate: [
        { path: "sender", select: "name email role" },
        { path: "receiver", select: "name email role" },
      ],
    })
    .sort({ lastMessageAt: -1 });

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        thread: { $in: threadIds },
        receiver: req.user._id,
        readAt: null,
      },
    },
    {
      $group: {
        _id: "$thread",
        unreadCount: { $sum: 1 },
      },
    },
  ]);

  const unreadMap = unreadCounts.reduce((map, item) => {
    map[String(item._id)] = item.unreadCount;
    return map;
  }, {});

  const filteredThreads = search
    ? threads.filter((thread) => {
        const lastMessageContent = thread.lastMessage?.content || "";
        return (
          thread.subject.toLowerCase().includes(search.toLowerCase()) ||
          lastMessageContent.toLowerCase().includes(search.toLowerCase()) ||
          thread.participants.some((participant) =>
            participant.name.toLowerCase().includes(search.toLowerCase()),
          )
        );
      })
    : threads;

  return filteredThreads.map((thread) => ({
    ...thread.toObject(),
    unreadCount: unreadMap[String(thread._id)] || 0,
  }));
};

exports.getRecipients = async (req, res) => {
  try {
    const recipients = await getAllowedRecipients(req.user);

    res.status(200).json({
      success: true,
      count: recipients.length,
      data: recipients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getThreads = async (req, res) => {
  try {
    const threads = await buildThreadQuery(req);

    res.status(200).json({
      success: true,
      count: threads.length,
      data: threads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getInbox = async (req, res) => {
  req.query.folder = "inbox";
  return exports.getThreads(req, res);
};

exports.getSent = async (req, res) => {
  req.query.folder = "sent";
  return exports.getThreads(req, res);
};

exports.getThreadMessages = async (req, res) => {
  try {
    const thread = await EmailThread.findById(req.params.threadId)
      .populate("participants", "name email role coachStatus")
      .populate({
        path: "lastMessage",
        populate: [
          { path: "sender", select: "name email role" },
          { path: "receiver", select: "name email role" },
        ],
      });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const participantIds = thread.participants.map((participant) =>
      String(participant._id),
    );

    if (req.user.role !== "admin" && !participantIds.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this conversation",
      });
    }

    const messages = await Message.find({ thread: thread._id })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        thread,
        messages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate("thread")
      .populate("sender", "name email role")
      .populate("receiver", "name email role");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const thread = await EmailThread.findById(message.thread);
    const participantIds = thread.participants.map((participant) =>
      String(participant),
    );

    if (
      req.user.role !== "admin" &&
      !participantIds.includes(req.user.id) &&
      String(message.receiver._id) !== req.user.id &&
      String(message.sender._id) !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this message",
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const receiverId =
      req.body.receiverId?._id || req.body.receiverId?.id || req.body.receiverId;
    const { subject, content, threadId } = req.body;

    if (!receiverId || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Receiver, subject, and content are required",
      });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver not found",
      });
    }

    const allowedRoles = allowedRecipientRoles[sender.role] || [];

    if (!allowedRoles.includes(receiver.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to message this user",
      });
    }

    if (sender.role === "customer" && receiver.role === "coach") {
      const hasRelationship = await hasCoachCustomerRelationship(
        sender._id,
        receiver._id,
      );

      if (!hasRelationship) {
        return res.status(403).json({
          success: false,
          message: "You can only message coaches you have booked with",
        });
      }
    }

    if (sender.role === "coach" && receiver.role === "customer") {
      const hasRelationship = await hasCoachCustomerRelationship(
        receiver._id,
        sender._id,
      );

      if (!hasRelationship) {
        return res.status(403).json({
          success: false,
          message: "You can only message customers you have coached",
        });
      }
    }

    const attachments = buildAttachmentPayload(req, req.files || []);
    const result = await deliverMessage({
      sender,
      receiver,
      subject,
      content,
      attachments,
      threadId,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.sendAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can send bulk announcements",
      });
    }

    const { audience = "all", subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Subject and content are required",
      });
    }

    const query =
      audience === "coaches"
        ? { role: "coach", coachStatus: "approved" }
        : audience === "customers"
          ? { role: "customer" }
          : { role: { $in: ["customer", "coach"] } };

    const recipients = await User.find(query).select("name email role coachStatus");
    const sender = await User.findById(req.user.id);
    const attachments = buildAttachmentPayload(req, req.files || []);

    const deliveryResults = [];
    for (const recipient of recipients) {
      deliveryResults.push(
        await deliverMessage({
          sender,
          receiver: recipient,
          subject,
          content,
          attachments,
          isAnnouncement: true,
        }),
      );
    }

    res.status(201).json({
      success: true,
      message: "Announcement sent successfully",
      data: {
        sentCount: deliveryResults.length,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.markMessageRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (req.user.role !== "admin" && String(message.receiver) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this message",
      });
    }

    message.readAt = new Date();
    message.readBy = req.user.id;
    message.deliveryStatus = "sent";
    await message.save();

    await Notification.updateMany(
      { relatedMessage: message._id, user: req.user.id },
      { $set: { read: true, readAt: new Date() } },
    );

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadMessages = await Message.countDocuments({
      receiver: req.user.id,
      readAt: null,
    });

    const unreadNotifications = await Notification.countDocuments({
      user: req.user.id,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: {
        unreadMessages,
        unreadNotifications,
        total: unreadMessages + unreadNotifications,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};