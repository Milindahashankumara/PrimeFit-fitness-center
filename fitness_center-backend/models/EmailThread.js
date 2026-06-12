const mongoose = require("mongoose");

const emailThreadSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

emailThreadSchema.index({ participants: 1, lastMessageAt: -1 });
emailThreadSchema.index({ subject: 1 });

const EmailThread = mongoose.model("EmailThread", emailThreadSchema);

module.exports = EmailThread;