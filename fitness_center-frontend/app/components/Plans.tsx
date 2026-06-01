"use client";

import React, { useState } from "react";

type BillingCycle = "monthly" | "annually";

type Plan = {
  name: string;
  price: string;
  billingSuffix: string;
  description: string;
  features: string[];
  active: boolean;
};

const Plans = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const plansByCycle: Record<BillingCycle, Plan[]> = {
    monthly: [
      {
        name: "PRO PLAN",
        price: "99",
        billingSuffix: "/mo",
        description:
          "Great for starting your journey with guided workouts and steady progress.",
        features: [
          "Access To All Videos",
          "Progress Tracking",
          "Supportive Community",
          "Advanced Workout Plans",
        ],
        active: false,
      },
      {
        name: "CUSTOM PLAN",
        price: "149",
        billingSuffix: "/mo",
        description:
          "Experience a fully tailored fitness experience with our custom plan.",
        features: [
          "Access To All Videos",
          "Progress Tracking",
          "Supportive Community",
          "Fully Customized Plan",
          "Weekly Check-Ins",
        ],
        active: true,
      },
      {
        name: "BEGINNER PLAN",
        price: "49",
        billingSuffix: "/mo",
        description:
          "A simple starting point with essential workouts and support.",
        features: [
          "Access To All Videos",
          "Progress Tracking",
          "Supportive Community",
          "Basic Nutrition Guide",
        ],
        active: false,
      },
    ],
    annually: [
      {
        name: "PRO PLAN",
        price: "999",
        billingSuffix: "/yr",
        description:
          "Save more with a year of structured training and advanced progress support.",
        features: [
          "Access To All Videos",
          "Progress Tracking",
          "Supportive Community",
          "Advanced Workout Plans",
          "Annual Fitness Review",
        ],
        active: false,
      },
      {
        name: "CUSTOM PLAN",
        price: "1499",
        billingSuffix: "/yr",
        description:
          "A premium yearly plan built around your goals, habits, and long-term results.",
        features: [
          "Access To All Videos",
          "Progress Tracking",
          "Supportive Community",
          "Fully Customized Plan",
          "Weekly Check-Ins",
          "Priority Coaching Support",
        ],
        active: true,
      },
      {
        name: "BEGINNER PLAN",
        price: "499",
        billingSuffix: "/yr",
        description:
          "Best for new members who want an affordable yearly starting package.",
        features: [
          "Access To All Videos",
          "Progress Tracking",
          "Supportive Community",
          "Basic Nutrition Guide",
          "Monthly Progress Check",
        ],
        active: false,
      },
    ],
  };

  const plans = plansByCycle[billingCycle];

  return (
    <div id="membership" className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Our <span className="text-brand-red">Plans</span>
        </h2>
        <p className="text-gray-400 mb-12">
          Select the plan that suits your fitness goals.
        </p>

        <div className="flex justify-center mb-12">
          <div className="bg-brand-gray p-1 rounded-full flex">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
                billingCycle === "monthly"
                  ? "bg-brand-red text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annually")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
                billingCycle === "annually"
                  ? "bg-brand-red text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-2xl border ${
                plan.active
                  ? "border-brand-red bg-transparent relative overflow-hidden"
                  : "border-brand-red/30 bg-transparent"
              } flex flex-col`}
            >
              {plan.active && (
                <div className="absolute inset-0 bg-brand-red/5 pointer-events-none"></div>
              )}

              <h3 className="text-2xl font-bold mb-2 uppercase tracking-wider">
                {plan.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6 min-h-[60px]">
                {plan.description}
              </p>

              <div className="grow space-y-4 mb-8 text-left">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <span className="text-sm text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="text-4xl font-bold mb-8">
                LKR {plan.price}
                <span className="text-sm text-gray-400">
                  {plan.billingSuffix}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Plans;
