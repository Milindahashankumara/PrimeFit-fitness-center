"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Bell,
  FileText,
  Inbox,
  Mail,
  Paperclip,
  Search,
  Send,
  Users,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import {
  CommunicationMessage,
  CommunicationNotification,
  CommunicationRecipient,
  CommunicationThread,
  MessagesAPI,
  NotificationsAPI,
} from "@/app/lib/api";

type Mode = "customer" | "coach" | "admin";
type ComposeMode = "direct" | "broadcast";

type Props = {
  mode: Mode;
  title: string;
  description: string;
  allowBroadcast?: boolean;
};

type UserData = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
};

const socketBaseUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const formatTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getParticipantLabel = (
  thread: CommunicationThread | null,
  currentUserId?: string,
) => {
  if (!thread) return "Conversation";
  const others = thread.participants?.filter(
    (participant) => participant._id !== currentUserId,
  );
  return (
    others?.map((participant) => participant.name).join(", ") || thread.subject
  );
};

const CommunicationCenter = ({
  mode,
  title,
  description,
  allowBroadcast,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socketRef = useRef<Socket | null>(null);

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [recipients, setRecipients] = useState<CommunicationRecipient[]>([]);
  const [notifications, setNotifications] = useState<
    CommunicationNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [folder, setFolder] = useState<"inbox" | "sent" | "all">("inbox");
  const [search, setSearch] = useState("");
  const [composeMode, setComposeMode] = useState<ComposeMode>("direct");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] =
    useState<CommunicationThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<CommunicationMessage[]>(
    [],
  );
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<
    "all" | "customers" | "coaches"
  >("all");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUserId = user?._id || user?.id || "";
  const threadReplyRecipientId = useMemo(() => {
    if (!selectedThread) return "";
    return (
      selectedThread.participants?.find(
        (participant) => participant._id !== currentUserId,
      )?._id || ""
    );
  }, [currentUserId, selectedThread]);

  const loadOverview = React.useCallback(async () => {
    const [threadData, recipientData, notificationData, unreadData] =
      await Promise.all([
        MessagesAPI.getThreads({ folder, search }),
        MessagesAPI.getRecipients(),
        NotificationsAPI.getAll(),
        MessagesAPI.getUnreadCount(),
      ]);

    setThreads(threadData);
    setRecipients(recipientData);
    setNotifications(notificationData);
    setUnreadCount(unreadData.total);

    if (!selectedThreadId && threadData.length > 0) {
      setSelectedThreadId(threadData[0]._id);
    }
  }, [folder, search, selectedThreadId]);

  const loadThread = React.useCallback(
    async (threadId: string) => {
      setLoadingThread(true);
      try {
        const data = await MessagesAPI.getThread(threadId);
        if (!data) return;

        setSelectedThread(data.thread);
        setThreadMessages(data.messages);

        const replyRecipient = data.thread.participants?.find(
          (participant) => participant._id !== currentUserId,
        );
        if (replyRecipient?._id) {
          setSelectedRecipientId(replyRecipient._id);
        }

        const unreadMessages = data.messages.filter(
          (message) =>
            String(
              typeof message.receiver === "string"
                ? message.receiver
                : message.receiver._id,
            ) === currentUserId && !message.readAt,
        );

        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map((message) => MessagesAPI.markRead(message._id)),
          );
          await loadOverview();
        }
      } finally {
        setLoadingThread(false);
      }
    },
    [currentUserId, loadOverview],
  );

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      router.push("/auth/login");
      return;
    }

    const parsed = JSON.parse(rawUser) as UserData;
    if (
      parsed.role !== mode &&
      !(mode === "admin" && parsed.role === "admin")
    ) {
      router.push("/auth/login");
      return;
    }

    setUser(parsed);
    setLoading(false);
  }, [mode, router]);

  useEffect(() => {
    if (!currentUserId) return;

    loadOverview().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load communications",
      );
    });
  }, [currentUserId, loadOverview]);

  useEffect(() => {
    if (!selectedThreadId) return;

    loadThread(selectedThreadId).catch((loadError) => {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load conversation",
      );
    });
  }, [selectedThreadId, loadThread]);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.emit("register", currentUserId);
    socket.on("message:received", () => {
      loadOverview().catch(() => undefined);
      if (selectedThreadId) {
        loadThread(selectedThreadId).catch(() => undefined);
      }
    });
    socket.on("notification:received", () => {
      loadOverview().catch(() => undefined);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, loadOverview, loadThread, selectedThreadId]);

  const filteredRecipients = useMemo(() => {
    const matchesMode = (recipient: CommunicationRecipient) => {
      if (mode === "admin") {
        return recipient.role === "customer" || recipient.role === "coach";
      }
      if (mode === "customer") {
        return recipient.role === "coach" || recipient.role === "admin";
      }
      return recipient.role === "customer" || recipient.role === "admin";
    };

    return recipients
      .filter(matchesMode)
      .sort((a, b) => {
        if (mode === "customer" && a.role !== b.role) {
          return a.role === "admin" ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [mode, recipients]);

  const adminRecipient = useMemo(
    () => filteredRecipients.find((recipient) => recipient.role === "admin"),
    [filteredRecipients],
  );

  const selectedRecipient = useMemo(
    () =>
      filteredRecipients.find(
        (recipient) => recipient._id === selectedRecipientId,
      ) || null,
    [filteredRecipients, selectedRecipientId],
  );

  const isThreadReply = useMemo(() => {
    if (!selectedThreadId || !threadReplyRecipientId || !selectedRecipientId) {
      return false;
    }

    return selectedRecipientId === threadReplyRecipientId;
  }, [selectedRecipientId, selectedThreadId, threadReplyRecipientId]);

  const startAdminMessage = () => {
    if (!adminRecipient) {
      setError("No admin recipient is available.");
      return;
    }

    setSelectedThreadId(null);
    setSelectedThread(null);
    setThreadMessages([]);
    setSelectedRecipientId(adminRecipient._id);
    setComposeMode("direct");
    setSubject("");
    setContent("");
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    if (
      !selectedRecipientId &&
      filteredRecipients.length > 0 &&
      composeMode === "direct"
    ) {
      const defaultRecipient =
        mode === "customer"
          ? adminRecipient || filteredRecipients[0]
          : filteredRecipients[0];

      if (defaultRecipient) {
        setSelectedRecipientId(defaultRecipient._id);
      }
    }
  }, [
    adminRecipient,
    composeMode,
    filteredRecipients,
    mode,
    selectedRecipientId,
  ]);

  useEffect(() => {
    if (mode !== "customer" || recipients.length === 0) return;
    if (searchParams.get("recipient") !== "admin") return;

    const admin = recipients.find((recipient) => recipient.role === "admin");
    if (!admin) return;

    setSelectedThreadId(null);
    setSelectedThread(null);
    setThreadMessages([]);
    setSelectedRecipientId(admin._id);
    setComposeMode("direct");
  }, [mode, recipients, searchParams]);

  const handleSend = async () => {
    try {
      setSending(true);
      setError("");
      setSuccess("");

      if (composeMode === "broadcast") {
        const result = await MessagesAPI.broadcast({
          audience: broadcastAudience,
          subject,
          content,
          attachments,
        });
        setSuccess(`Broadcast sent to ${result.sentCount} users.`);
      } else {
        if (!selectedRecipientId) {
          throw new Error("Please select a recipient");
        }

        const result = await MessagesAPI.send({
          receiverId: selectedRecipientId,
          receiverRole: selectedRecipient?.role,
          subject,
          content,
          attachments,
          threadId: isThreadReply ? selectedThreadId || undefined : undefined,
        });

        setSelectedThreadId(result.thread._id);
        setSuccess("Message sent successfully.");
      }

      setSubject("");
      setContent("");
      setAttachments([]);
      setComposeMode("direct");
      await loadOverview();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send message",
      );
    } finally {
      setSending(false);
    }
  };

  const handleNotificationRead = async (notificationId: string) => {
    await NotificationsAPI.markRead(notificationId);
    await loadOverview();
  };

  const selectedThreadLabel = getParticipantLabel(
    selectedThread,
    currentUserId,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="bg-brand-gray border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="hover:text-brand-red transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-full bg-brand-red/20 text-brand-red text-sm font-semibold flex items-center gap-2">
              <Bell size={16} />
              {unreadCount} unread
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {(error || success) && (
          <div
            className={`rounded-2xl border p-4 ${error ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-green-500/40 bg-green-500/10 text-green-200"}`}
          >
            {error || success}
          </div>
        )}

        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-brand-gray rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <Inbox size={18} />
              Inbox Threads
            </div>
            <p className="text-3xl font-bold">{threads.length}</p>
          </div>
          <div className="bg-brand-gray rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <MessageSquare size={18} />
              Notifications
            </div>
            <p className="text-3xl font-bold">{notifications.length}</p>
          </div>
          <div className="bg-brand-gray rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <Users size={18} />
              Available Recipients
            </div>
            <p className="text-3xl font-bold">{filteredRecipients.length}</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-brand-gray rounded-3xl border border-white/10 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 border border-white/10">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages"
                className="w-full bg-transparent outline-none text-sm"
              />
              <button
                onClick={() => loadOverview().catch(() => undefined)}
                className="text-gray-400 hover:text-white"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(["inbox", "sent", "all"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFolder(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${folder === tab ? "bg-brand-red text-white" : "bg-black/20 text-gray-300 hover:text-white"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-3 overflow-y-auto max-h-136 pr-1">
              {threads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-gray-400">
                  No conversations yet.
                </div>
              ) : (
                threads.map((thread) => {
                  const active = thread._id === selectedThreadId;
                  return (
                    <button
                      key={thread._id}
                      onClick={() => setSelectedThreadId(thread._id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${active ? "border-brand-red bg-brand-red/10" : "border-white/10 bg-black/20 hover:border-white/20"}`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-semibold line-clamp-1">
                          {selectedThreadId === thread._id
                            ? selectedThreadLabel
                            : thread.subject}
                        </p>
                        {thread.unreadCount ? (
                          <span className="text-xs bg-brand-red text-white px-2 py-1 rounded-full">
                            {thread.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {thread.lastMessage?.content || "No messages yet"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTime(thread.lastMessageAt)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-brand-gray rounded-3xl border border-white/10 p-5">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Mail className="text-brand-red" size={20} />
                    {selectedThread
                      ? selectedThread.subject
                      : "Compose message"}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedThread
                      ? selectedThreadLabel
                      : "Send a secure message or email from inside PrimeFit."}
                  </p>
                </div>
                {allowBroadcast && (
                  <div className="flex items-center gap-2 bg-black/20 rounded-full p-1 border border-white/10">
                    <button
                      onClick={() => setComposeMode("direct")}
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${composeMode === "direct" ? "bg-brand-red text-white" : "text-gray-400"}`}
                    >
                      Direct
                    </button>
                    <button
                      onClick={() => setComposeMode("broadcast")}
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${composeMode === "broadcast" ? "bg-yellow-500 text-black" : "text-gray-400"}`}
                    >
                      Broadcast
                    </button>
                  </div>
                )}
                {mode === "customer" && adminRecipient && (
                  <button
                    onClick={startAdminMessage}
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                  >
                    Send Message to Admin
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {composeMode === "broadcast" && allowBroadcast ? (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Audience
                    </label>
                    <select
                      value={broadcastAudience}
                      onChange={(e) =>
                        setBroadcastAudience(
                          e.target.value as "all" | "customers" | "coaches",
                        )
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="all">Customers and Coaches</option>
                      <option value="customers">Customers</option>
                      <option value="coaches">Coaches</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Recipient
                    </label>
                    <select
                      value={selectedRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none"
                    >
                      {filteredRecipients.length === 0 ? (
                        <option value="">No available recipients</option>
                      ) : (
                        filteredRecipients.map((recipient) => (
                          <option key={recipient._id} value={recipient._id}>
                            {recipient.name} - {recipient.role}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none"
                    placeholder="Enter subject"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Message
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={7}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none resize-none"
                    placeholder="Write your message"
                  />
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <Paperclip size={16} />
                    Attach files
                    <input
                      type="file"
                      multiple
                      onChange={(e) =>
                        setAttachments(Array.from(e.target.files || []))
                      }
                      className="hidden"
                    />
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {attachments.length > 0
                        ? `${attachments.length} file(s) selected`
                        : "No attachments"}
                    </span>
                    <button
                      onClick={handleSend}
                      disabled={sending || !subject || !content}
                      className="bg-brand-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >
                      <Send size={16} />
                      {sending
                        ? "Sending..."
                        : composeMode === "broadcast"
                          ? "Send Broadcast"
                          : "Send Message"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-brand-gray rounded-3xl border border-white/10 p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="text-brand-red" size={18} />
                  Messages
                </h3>
                {loadingThread ? (
                  <div className="text-sm text-gray-400">
                    Loading conversation...
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="text-sm text-gray-400">
                    Select a conversation to see the full message history.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-112 overflow-y-auto pr-1">
                    {threadMessages.map((message) => {
                      const isMine =
                        (typeof message.sender === "object"
                          ? message.sender._id
                          : message.sender) === currentUserId;
                      return (
                        <div
                          key={message._id}
                          className={`rounded-2xl p-4 border ${isMine ? "border-brand-red/30 bg-brand-red/10 ml-6" : "border-white/10 bg-black/20 mr-6"}`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-sm font-semibold">
                              {isMine
                                ? "You"
                                : (message.sender as CommunicationRecipient)
                                  ?.name || "Sender"}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          <p className="font-semibold mb-2">
                            {message.subject}
                          </p>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-6">
                            {message.content}
                          </p>
                          {message.attachments?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={
                                    attachment.fileUrl || attachment.fileName
                                  }
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs bg-white/10 px-3 py-1 rounded-full inline-flex items-center gap-1 hover:bg-white/20"
                                >
                                  <Paperclip size={12} />
                                  {attachment.fileName}
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-brand-gray rounded-3xl border border-white/10 p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Bell className="text-brand-red" size={18} />
                  Notifications
                </h3>
                <div className="space-y-3 max-h-112 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-sm text-gray-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        onClick={() => handleNotificationRead(notification._id)}
                        className={`w-full text-left rounded-2xl border p-4 transition-colors ${notification.read ? "border-white/10 bg-black/20" : "border-brand-red/30 bg-brand-red/10"}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="font-semibold line-clamp-1">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="text-xs bg-brand-red text-white px-2 py-1 rounded-full">
                              new
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CommunicationCenter;
