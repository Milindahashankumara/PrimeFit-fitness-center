"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Layers3,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { SubscriptionAPI, SubscriptionSummary } from "@/app/lib/api";

type BillingCycle = "monthly" | "annually";

type PlanCard = {
  name: string;
  description: string;
  billingCycle: BillingCycle;
  amount: number;
  badge: string;
  features: string[];
};

const plans: PlanCard[] = [
  {
    name: "Starter Monthly",
    description:
      "Flexible monthly access for customers who want to try the membership first.",
    billingCycle: "monthly",
    amount: 499,
    badge: "Monthly Plan",
    features: [
      "1 month access",
      "Pending invoice on activation",
      "Offline payment support",
    ],
  },
  {
    name: "Growth Monthly",
    description:
      "A balanced monthly plan for customers who want ongoing access and support.",
    billingCycle: "monthly",
    amount: 999,
    badge: "Monthly Plan",
    features: [
      "1 month access",
      "Billing history tracking",
      "Manual payment confirmation",
    ],
  },
  {
    name: "Annual Value",
    description:
      "Best value yearly subscription with a single upfront invoice and long-term access.",
    billingCycle: "annually",
    amount: 4999,
    badge: "Annual Plan",
    features: [
      "12 month access",
      "One yearly invoice",
      "Offline payment and admin approval",
    ],
  },
  {
    name: "Annual Premium",
    description:
      "A premium annual membership for customers who want consistent training access.",
    billingCycle: "annually",
    amount: 7999,
    badge: "Annual Plan",
    features: [
      "12 month access",
      "Priority account handling",
      "Invoice history retained in account",
    ],
  },
];

const CustomerSubscriptionsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlanName, setSelectedPlanName] = useState(plans[0].name);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "customer") {
      router.push("/auth/login");
      return;
    }

    const loadSubscription = async () => {
      try {
        const data = await SubscriptionAPI.getMine();
        setSummary(data);
      } catch (loadError: any) {
        setError(loadError.message || "Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [router]);

  const availablePlans = useMemo(
    () => plans.filter((plan) => plan.billingCycle === billingCycle),
    [billingCycle],
  );

  const currentSubscription =
    summary?.currentSubscription || summary?.activeSubscription || null;

  useEffect(() => {
    if (
      currentSubscription &&
      currentSubscription.billingCycle === billingCycle
    ) {
      setSelectedPlanName(currentSubscription.planName);
      return;
    }

    if (
      availablePlans.length > 0 &&
      !availablePlans.some((plan) => plan.name === selectedPlanName)
    ) {
      setSelectedPlanName(availablePlans[0].name);
    }
  }, [availablePlans, billingCycle, selectedPlanName, currentSubscription]);

  const selectedPlan =
    availablePlans.find((plan) => plan.name === selectedPlanName) ||
    availablePlans[0];

  const isCurrentSelected =
    !!currentSubscription &&
    currentSubscription.planName === selectedPlan?.name &&
    currentSubscription.billingCycle === selectedPlan?.billingCycle;

  const activatePlan = async () => {
    if (!selectedPlan) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await SubscriptionAPI.activate({
        planName: selectedPlan.name,
        billingCycle: selectedPlan.billingCycle,
        amount: selectedPlan.amount,
        paymentMethod: "cash",
        notes: "Activated from customer subscription panel",
      });

      setMessage(
        result.bill
          ? "Subscription activated. Pending payment invoice created."
          : "Subscription activated successfully.",
      );
      const refreshed = await SubscriptionAPI.getMine();
      setSummary(refreshed);
    } catch (activateError: any) {
      setError(activateError.message || "Failed to activate subscription");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="bg-brand-gray border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscription Management</h1>
            <p className="text-sm text-gray-400">
              Customer panel for plan activation and billing
            </p>
          </div>
          <Link
            href="/dashboard/customer"
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

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-brand-gray rounded-3xl p-6 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold">Choose a plan</h2>
                <p className="text-gray-400 mt-2">
                  Activate a monthly or annual plan without online payment.
                </p>
              </div>
              <div className="bg-black/30 rounded-full p-1 flex w-fit">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${billingCycle === "monthly" ? "bg-brand-red text-white" : "text-gray-400 hover:text-white"}`}
                >
                  Monthly Plan
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annually")}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${billingCycle === "annually" ? "bg-brand-red text-white" : "text-gray-400 hover:text-white"}`}
                >
                  Annual Plan
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {availablePlans.map((plan) => {
                const active = plan.name === selectedPlanName;
                return (
                  <button
                    key={plan.name}
                    type="button"
                    onClick={() => setSelectedPlanName(plan.name)}
                    className={`text-left rounded-2xl border p-5 transition-all ${active ? "border-brand-red bg-brand-red/10 shadow-lg shadow-brand-red/10" : "border-white/10 bg-black/20 hover:border-white/20"}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                          {plan.badge}
                        </p>
                        <h3 className="text-xl font-bold mt-1">{plan.name}</h3>
                      </div>
                      {active && (
                        <BadgeCheck className="text-brand-red" size={24} />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      {plan.description}
                    </p>
                    <div className="text-3xl font-bold mb-4">
                      LKR {plan.amount}
                      <span className="text-sm text-gray-400 ml-2">
                        {plan.billingCycle === "monthly" ? "/mo" : "/yr"}
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Sparkles size={14} className="text-brand-red" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-black/20 rounded-2xl p-5 border border-white/10">
              <div>
                <p className="text-sm text-gray-400">Selected plan</p>
                <p className="text-xl font-bold">{selectedPlan?.name}</p>
                <p className="text-sm text-gray-400">
                  {currentSubscription?.status === "active"
                    ? "Activating a new plan will replace your current active plan."
                    : "Payment will be marked as pending until received offline."}
                </p>
              </div>
              <button
                type="button"
                onClick={activatePlan}
                disabled={saving || isCurrentSelected}
                className="bg-brand-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
              >
                <ShieldCheck size={18} />
                {saving
                  ? "Activating..."
                  : isCurrentSelected
                    ? "Current Plan"
                    : "Activate Plan"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-brand-gray rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold">Subscription status</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Activation</span>
                  <span className="font-semibold">
                    {currentSubscription?.status || "inactive"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Payment status</span>
                  <span className="font-semibold">
                    {currentSubscription?.paymentStatus || "Pending"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Current plan</span>
                  <span className="font-semibold">
                    {currentSubscription?.planName || "None"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Billing cycle</span>
                  <span className="font-semibold capitalize">
                    {currentSubscription?.billingCycle || "None"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-brand-gray rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold">Billing summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400">Pending bills</p>
                  <p className="text-2xl font-bold mt-2">
                    {summary?.pendingBills.length || 0}
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400">Paid bills</p>
                  <p className="text-2xl font-bold mt-2">
                    {summary?.paidBills.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-brand-gray rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-xl font-bold">Pending bills</h3>
            </div>
            <div className="space-y-3">
              {(summary?.pendingBills || []).length === 0 ? (
                <p className="text-gray-400 text-sm">No pending bills yet.</p>
              ) : (
                summary?.pendingBills.map((bill) => (
                  <div
                    key={bill._id || bill.invoiceNumber}
                    className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold">{bill.invoiceNumber}</p>
                      <p className="text-sm text-gray-400">
                        {bill.planName} - {bill.billingCycle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">LKR {bill.amount}</p>
                      <p className="text-sm text-yellow-400">Pending Payment</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-brand-gray rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-xl font-bold">Billing history</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 text-left font-medium">Invoice</th>
                    <th className="py-3 text-left font-medium">Plan</th>
                    <th className="py-3 text-left font-medium">Amount</th>
                    <th className="py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.bills || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-gray-400">
                        No billing records available.
                      </td>
                    </tr>
                  ) : (
                    summary?.bills.map((bill) => (
                      <tr
                        key={bill._id || bill.invoiceNumber}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="py-3">{bill.invoiceNumber}</td>
                        <td className="py-3 text-gray-300">{bill.planName}</td>
                        <td className="py-3">LKR {bill.amount}</td>
                        <td className="py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${bill.status === "paid" ? "bg-green-500/20 text-green-300" : bill.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"}`}
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
          </div>
        </section>
      </main>
    </div>
  );
};

export default CustomerSubscriptionsPage;
