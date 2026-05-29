"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  Briefcase,
  CircleDollarSign,
  Clock3,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  SubscriptionAPI,
  SubscriptionOverview,
  SubscriptionSummary,
} from "@/app/lib/api";

const AdminSubscriptionsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<SubscriptionSummary | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/auth/login");
      return;
    }

    const loadOverview = async () => {
      try {
        const data = await SubscriptionAPI.getAdminOverview();
        setOverview(data);
        setSelectedCustomer(data?.customers?.[0] || null);
      } catch (loadError: any) {
        setError(loadError.message || "Failed to load subscription overview");
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [router]);

  const customers = useMemo(() => overview?.customers || [], [overview]);

  const selectedSubscription =
    selectedCustomer?.currentSubscription ||
    selectedCustomer?.activeSubscription ||
    null;

  const refreshOverview = async () => {
    const data = await SubscriptionAPI.getAdminOverview();
    setOverview(data);
    if (selectedCustomer && data) {
      const refreshedCustomer = data.customers.find(
        (customer) => customer.customer._id === selectedCustomer.customer._id,
      );
      setSelectedCustomer(refreshedCustomer || data.customers[0] || null);
    }
  };

  const handleMarkPaid = async (billId: string) => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await SubscriptionAPI.markBillPaid(billId, {
        paymentMethod: "cash",
        notes: "Marked paid by admin after offline payment",
      });
      setMessage("Bill marked as paid successfully.");
      await refreshOverview();
    } catch (markError: any) {
      setError(markError.message || "Failed to update bill status");
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionStatus = async (
    subscriptionId: string,
    status: "active" | "inactive" | "suspended" | "cancelled",
  ) => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await SubscriptionAPI.updateStatus(subscriptionId, { status });
      setMessage(`Subscription updated to ${status}.`);
      await refreshOverview();
    } catch (statusError: any) {
      setError(statusError.message || "Failed to update subscription");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white text-2xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="bg-brand-gray border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscription Admin</h1>
            <p className="text-sm text-gray-400">
              Manage customer plans, bills, and payment updates
            </p>
          </div>
          <Link
            href="/dashboard/admin"
            className="text-brand-red hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {(message || error) && (
          <div
            className={`rounded-2xl border p-4 ${message ? "bg-green-500/10 border-green-500/30 text-green-200" : "bg-red-500/10 border-red-500/30 text-red-200"}`}
          >
            {message || error}
          </div>
        )}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-brand-gray rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-brand-red" size={30} />
              <span className="text-xs bg-brand-red/20 text-brand-red px-2 py-1 rounded-full">
                Customers
              </span>
            </div>
            <p className="text-3xl font-bold">
              {overview?.totals.totalCustomers || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Total customers</p>
          </div>
          <div className="bg-brand-gray rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <BadgeCheck className="text-green-400" size={30} />
              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-3xl font-bold">
              {overview?.totals.activeSubscriptions || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Active subscriptions</p>
          </div>
          <div className="bg-brand-gray rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Clock3 className="text-yellow-400" size={30} />
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <p className="text-3xl font-bold">
              {overview?.totals.pendingPayments || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Pending payments</p>
          </div>
          <div className="bg-brand-gray rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <CircleDollarSign className="text-blue-400" size={30} />
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                Cycle
              </span>
            </div>
            <p className="text-3xl font-bold">
              {overview?.totals.monthlySubscribers || 0} /{" "}
              {overview?.totals.annualSubscribers || 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Monthly / Annual subscribers
            </p>
          </div>
        </section>

        <section className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-brand-gray rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Customer subscriptions</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Customer details, current plan, payment state, and
                  subscription status
                </p>
              </div>
              <ShieldAlert className="text-brand-red" size={26} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 text-left font-medium">Customer</th>
                    <th className="py-3 text-left font-medium">Plan</th>
                    <th className="py-3 text-left font-medium">Status</th>
                    <th className="py-3 text-left font-medium">Payment</th>
                    <th className="py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((entry) => (
                    <tr
                      key={entry.customer._id}
                      className={`border-b border-white/5 last:border-0 cursor-pointer ${selectedCustomer?.customer._id === entry.customer._id ? "bg-white/5" : "hover:bg-white/5"}`}
                      onClick={() => setSelectedCustomer(entry)}
                    >
                      <td className="py-4 pr-4">
                        <p className="font-semibold">{entry.customer.name}</p>
                        <p className="text-gray-400 text-xs">
                          {entry.customer.email}
                        </p>
                      </td>
                      <td className="py-4 pr-4">
                        <p>
                          {entry.currentSubscription?.planName ||
                            entry.activeSubscription?.planName ||
                            "No subscription"}
                        </p>
                        <p className="text-gray-400 text-xs capitalize">
                          {entry.currentSubscription?.billingCycle ||
                            entry.activeSubscription?.billingCycle ||
                            "-"}
                        </p>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${entry.currentSubscription?.status === "active" ? "bg-green-500/20 text-green-300" : entry.currentSubscription?.status === "suspended" ? "bg-yellow-500/20 text-yellow-300" : entry.currentSubscription?.status === "cancelled" ? "bg-red-500/20 text-red-300" : entry.activeSubscription?.status === "active" ? "bg-green-500/20 text-green-300" : entry.activeSubscription?.status === "suspended" ? "bg-yellow-500/20 text-yellow-300" : "bg-gray-500/20 text-gray-300"}`}
                        >
                          {entry.currentSubscription?.status ||
                            entry.activeSubscription?.status ||
                            "inactive"}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${(entry.currentSubscription?.paymentStatus || entry.activeSubscription?.paymentStatus) === "paid" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}
                        >
                          {entry.currentSubscription?.paymentStatus ||
                            entry.activeSubscription?.paymentStatus ||
                            "pending"}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedCustomer(entry);
                          }}
                          className="text-brand-red hover:underline"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-brand-gray rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-brand-red" />
                <div>
                  <h3 className="text-xl font-bold">Selected customer</h3>
                  <p className="text-sm text-gray-400">
                    Subscription and billing controls
                  </p>
                </div>
              </div>

              {selectedCustomer ? (
                <div className="space-y-4 text-sm">
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                    <p className="text-gray-400">Customer</p>
                    <p className="text-lg font-bold">
                      {selectedCustomer.customer.name}
                    </p>
                    <p className="text-gray-400">
                      {selectedCustomer.customer.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                      <p className="text-gray-400">Selected plan</p>
                      <p className="font-semibold mt-1">
                        {selectedCustomer.currentSubscription?.planName ||
                          selectedCustomer.activeSubscription?.planName ||
                          "None"}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                      <p className="text-gray-400">Billing cycle</p>
                      <p className="font-semibold mt-1 capitalize">
                        {selectedCustomer.currentSubscription?.billingCycle ||
                          selectedCustomer.activeSubscription?.billingCycle ||
                          "None"}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                      <p className="text-gray-400">Subscription status</p>
                      <p className="font-semibold mt-1 capitalize">
                        {selectedCustomer.currentSubscription?.status ||
                          selectedCustomer.activeSubscription?.status ||
                          "inactive"}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                      <p className="text-gray-400">Payment status</p>
                      <p className="font-semibold mt-1 capitalize">
                        {selectedCustomer.currentSubscription?.paymentStatus ||
                          selectedCustomer.activeSubscription?.paymentStatus ||
                          "pending"}
                      </p>
                    </div>
                  </div>

                  {selectedSubscription && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          handleSubscriptionStatus(
                            selectedSubscription._id!,
                            "active",
                          )
                        }
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
                      >
                        <PlayCircle size={16} />
                        Activate
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          handleSubscriptionStatus(
                            selectedSubscription._id!,
                            "suspended",
                          )
                        }
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
                      >
                        <PauseCircle size={16} />
                        Suspend
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          handleSubscriptionStatus(
                            selectedSubscription._id!,
                            "cancelled",
                          )
                        }
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
                      >
                        <AlertCircle size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No customer selected.</p>
              )}
            </div>

            <div className="bg-brand-gray rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Banknote className="text-brand-red" />
                <h3 className="text-xl font-bold">Pending bills</h3>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {(selectedCustomer?.pendingBills || []).length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No pending bills for this customer.
                  </p>
                ) : (
                  selectedCustomer?.pendingBills.map((bill) => (
                    <div
                      key={bill._id || bill.invoiceNumber}
                      className="bg-black/20 rounded-2xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold">{bill.invoiceNumber}</p>
                          <p className="text-xs text-gray-400">
                            {bill.planName} - {bill.billingCycle}
                          </p>
                        </div>
                        <p className="font-bold">LKR {bill.amount}</p>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleMarkPaid(bill._id || "")}
                        className="w-full bg-brand-red hover:bg-red-700 py-2 rounded-xl font-semibold disabled:opacity-50"
                      >
                        Mark as Paid
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-brand-gray rounded-3xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <CircleDollarSign className="text-brand-red" />
            <h3 className="text-xl font-bold">Billing history</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-3 text-left font-medium">Invoice</th>
                  <th className="py-3 text-left font-medium">Customer</th>
                  <th className="py-3 text-left font-medium">Plan</th>
                  <th className="py-3 text-left font-medium">Amount</th>
                  <th className="py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.bills || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-gray-400">
                      No billing records available.
                    </td>
                  </tr>
                ) : (
                  overview?.bills.map((bill) => (
                    <tr
                      key={bill._id || bill.invoiceNumber}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-3">{bill.invoiceNumber}</td>
                      <td className="py-3 text-gray-300">
                        {bill.customerName}
                      </td>
                      <td className="py-3 text-gray-300">{bill.planName}</td>
                      <td className="py-3">LKR {bill.amount}</td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${bill.status === "paid" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}
                        >
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminSubscriptionsPage;
