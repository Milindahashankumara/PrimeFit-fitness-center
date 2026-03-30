'use client';

import React from 'react';

const Plans = () => {
  const plans = [
    {
      name: "PRO PLAN",
      price: "99",
      features: ["Access To All Videos", "Progress Tracking", "Supportive Community", "Advanced Workout Plans"],
      active: false
    },
    {
      name: "CUSTOM PLAN",
      price: "149",
      features: ["Access To All Videos", "Progress Tracking", "Supportive Community", "Fully Customized Plan", "Weekly Check-Ins"],
      active: true
    },
    {
      name: "BEGINNER PLAN",
      price: "49",
      features: ["Access To All Videos", "Progress Tracking", "Supportive Community", "Basic Nutrition Guide"],
      active: false
    }
  ];

  return (
    <div id="membership" className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Our <span className="text-brand-red">Plans</span></h2>
        <p className="text-gray-400 mb-12">Select the plan that suits your fitness goals.</p>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-12">
            <div className="bg-brand-gray p-1 rounded-full flex">
                <button className="px-6 py-2 bg-brand-red rounded-full text-sm font-bold">Monthly</button>
                <button className="px-6 py-2 text-gray-400 text-sm font-bold hover:text-white">Annually</button>
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`p-8 rounded-2xl border ${
                plan.active 
                  ? 'border-brand-red bg-transparent relative overflow-hidden' 
                  : 'border-brand-red/30 bg-transparent'
              } flex flex-col`}
            >
              {plan.active && <div className="absolute inset-0 bg-brand-red/5 pointer-events-none"></div>}
              
              <h3 className="text-2xl font-bold mb-2 uppercase tracking-wider">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-6 min-h-[60px]">
                {plan.active ? "Experience a fully tailored fitness experience with our custom plan." : "Great for starting your journey with basic workouts."}
              </p>

              <div className="flex-grow space-y-4 mb-8 text-left">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <span className="text-sm text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="text-4xl font-bold mb-8">
                LKR {plan.price}<span className="text-sm text-gray-400">/mo</span>
              </div>

              <button className={`w-full py-3 rounded-full font-bold transition-all ${
                plan.active 
                  ? 'bg-brand-red hover:bg-red-700 text-white' 
                  : 'bg-orange-600/80 hover:bg-orange-600 text-white' 
              }`}>
                Choose This Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Plans;
