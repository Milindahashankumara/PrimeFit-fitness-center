const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annually"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "LKR",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "cancelled"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    activationDate: {
      type: Date,
      default: Date.now,
    },
    nextBillingDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "manual"],
      default: "cash",
    },
    suspendedReason: {
      type: String,
    },
    notes: {
      type: String,
    },
    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
