const User = require("../models/User");
const Subscription = require("../models/Subscription");
const Bill = require("../models/Bill");
const Booking = require("../models/Booking");

const getNextBillingDate = (billingCycle) => {
  const nextDate = new Date();
  if (billingCycle === "annually") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  return nextDate;
};

const createInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  return `INV-${timestamp}`;
};

const buildCustomerSummary = async (customer) => {
  const subscriptions = await Subscription.find({ customer: customer._id })
    .sort({ createdAt: -1 })
    .lean();
  const bills = await Bill.find({ customer: customer._id })
    .sort({ createdAt: -1 })
    .lean();

  const currentSubscription = subscriptions[0] || null;
  const activeSubscription =
    subscriptions.find((subscription) => subscription.status === "active") ||
    null;

  return {
    customer: {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      createdAt: customer.createdAt,
    },
    currentSubscription,
    activeSubscription,
    subscriptions,
    bills,
    pendingBills: bills.filter((bill) => bill.status === "pending"),
    paidBills: bills.filter((bill) => bill.status === "paid"),
  };
};

exports.getMySubscription = async (req, res) => {
  try {
    const customer = await User.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const summary = await buildCustomerSummary(customer);

    res.status(200).json({
      success: true,
      message: "Subscription details loaded successfully",
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.activateSubscription = async (req, res) => {
  try {
    const {
      planName,
      billingCycle,
      amount,
      paymentMethod = "cash",
      notes,
    } = req.body;

    if (!planName || !billingCycle || !amount) {
      return res.status(400).json({
        success: false,
        message: "Plan name, billing cycle, and amount are required",
      });
    }

    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const existingActiveSubscription = await Subscription.findOne({
      customer: customer._id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (
      existingActiveSubscription &&
      existingActiveSubscription.planName === planName &&
      existingActiveSubscription.billingCycle === billingCycle
    ) {
      const summary = await buildCustomerSummary(customer);

      return res.status(200).json({
        success: true,
        message: "This plan is already active on your account.",
        data: {
          subscription: existingActiveSubscription,
          bill: null,
          summary,
        },
      });
    }

    await Subscription.updateMany(
      { customer: customer._id, status: "active" },
      { $set: { status: "inactive", updatedBy: req.user.id } },
    );

    await Bill.updateMany(
      { customer: customer._id, status: "pending" },
      {
        $set: {
          status: "cancelled",
          notes: notes || "Replaced by a new subscription",
        },
      },
    );

    const subscription = await Subscription.create({
      customer: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      planName,
      billingCycle,
      amount,
      currency: "LKR",
      status: "active",
      paymentStatus: "pending",
      activationDate: new Date(),
      nextBillingDate: getNextBillingDate(billingCycle),
      paymentMethod,
      notes,
      activatedBy: req.user.id,
      updatedBy: req.user.id,
    });

    const bill = await Bill.create({
      customer: customer._id,
      subscription: subscription._id,
      invoiceNumber: createInvoiceNumber(),
      customerName: customer.name,
      customerEmail: customer.email,
      planName,
      billingCycle,
      amount,
      currency: "LKR",
      status: "pending",
      dueDate: getNextBillingDate(billingCycle),
      paymentMethod,
      notes: notes || "Subscription activation invoice",
    });

    res.status(201).json({
      success: true,
      message:
        "Subscription activated. Pending payment invoice added to your account.",
      data: {
        subscription,
        bill,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAdminOverview = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const customers = await User.find({ role: "customer" }).sort({
      createdAt: -1,
    });
    const activeCoaches = await User.countDocuments({
      role: "coach",
      coachStatus: "approved",
    });
    const subscriptions = await Subscription.find({})
      .sort({ createdAt: -1 })
      .lean();
    const bills = await Bill.find({}).sort({ createdAt: -1 }).lean();
    const bookingsThisMonth = await Booking.countDocuments({
      createdAt: { $gte: monthStart, $lt: nextMonth },
    });
    const paidBillsThisMonth = await Bill.find({
      status: "paid",
      paidAt: { $gte: monthStart, $lt: nextMonth },
    }).lean();

    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "active",
    );
    const pendingBills = bills.filter((bill) => bill.status === "pending");

    const customerSummaries = [];
    for (const customer of customers) {
      customerSummaries.push(await buildCustomerSummary(customer));
    }

    res.status(200).json({
      success: true,
      message: "Subscription overview loaded successfully",
      data: {
        totals: {
          totalCustomers: customers.length,
          totalMembers: customers.length,
          activeCoaches,
          activeSubscriptions: activeSubscriptions.length,
          pendingPayments: pendingBills.length,
          monthlySubscribers: activeSubscriptions.filter(
            (subscription) => subscription.billingCycle === "monthly",
          ).length,
          annualSubscribers: activeSubscriptions.filter(
            (subscription) => subscription.billingCycle === "annually",
          ).length,
          monthlyRevenue: paidBillsThisMonth.reduce(
            (sum, bill) => sum + (bill.amount || 0),
            0,
          ),
          sessionsThisMonth: bookingsThisMonth,
        },
        customers: customerSummaries,
        subscriptions,
        bills,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerSubscription = async (req, res) => {
  try {
    const customer = await User.findById(req.params.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const summary = await buildCustomerSummary(customer);

    res.status(200).json({
      success: true,
      message: "Customer subscription loaded successfully",
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateBillStatus = async (req, res) => {
  try {
    const { paymentMethod = "cash", paymentReference, notes } = req.body;
    const bill = await Bill.findById(req.params.billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    if (bill.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled bills cannot be marked as paid",
      });
    }

    bill.status = "paid";
    bill.paidAt = new Date();
    bill.paymentMethod = paymentMethod;
    bill.paymentReference = paymentReference;
    bill.notes = notes || bill.notes;
    bill.markedPaidBy = req.user.id;

    await bill.save();

    const subscription = await Subscription.findById(bill.subscription);
    if (subscription) {
      subscription.paymentStatus = "paid";
      subscription.status = "active";
      subscription.updatedBy = req.user.id;
      await subscription.save();
    }

    res.status(200).json({
      success: true,
      message: "Bill marked as paid successfully",
      data: {
        bill,
        subscription,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { status, suspendedReason, paymentStatus } = req.body;
    const subscription = await Subscription.findById(req.params.subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (status) {
      subscription.status = status;
    }

    if (suspendedReason !== undefined) {
      subscription.suspendedReason = suspendedReason;
    }

    if (paymentStatus) {
      subscription.paymentStatus = paymentStatus;
    }

    subscription.updatedBy = req.user.id;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
