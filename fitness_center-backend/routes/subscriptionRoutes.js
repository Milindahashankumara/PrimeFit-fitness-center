const express = require("express");
const router = express.Router();
const {
  getMySubscription,
  activateSubscription,
  getAdminOverview,
  getCustomerSubscription,
  updateBillStatus,
  updateSubscriptionStatus,
} = require("../controllers/subscriptionController");
const { protect, authorize } = require("../middlewares/auth");

router.get("/me", protect, authorize("customer", "admin"), getMySubscription);
router.post(
  "/activate",
  protect,
  authorize("customer", "admin"),
  activateSubscription,
);
router.get("/admin/overview", protect, authorize("admin"), getAdminOverview);
router.get(
  "/admin/customers/:customerId",
  protect,
  authorize("admin"),
  getCustomerSubscription,
);
router.put(
  "/admin/bills/:billId/pay",
  protect,
  authorize("admin"),
  updateBillStatus,
);
router.put(
  "/admin/subscriptions/:subscriptionId/status",
  protect,
  authorize("admin"),
  updateSubscriptionStatus,
);

module.exports = router;
