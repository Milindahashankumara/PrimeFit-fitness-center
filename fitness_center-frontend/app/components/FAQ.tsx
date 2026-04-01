'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  { 
    q: "What Is PrimeFit And How Can It Help Me Reach My Fitness Goals?", 
    a: "PrimeFit is an online fitness platform that offers personalized workout plans, expert coaching, and comprehensive nutritional guidance. Whether you're looking to lose weight, build muscle, or simply stay fit, our tailored programs will help you." 
  },
  { q: "How Do I Get Started With A Workout Plan?", a: "Sign up via our pricing page, select a coach, and we will build your plan within 24 hours." },
  { q: "What Is Included In The Custom Plan?", a: "The custom plan includes 1-on-1 coaching, weekly check-ins, macro calculations, and video form analysis." },
  { q: "Can I Change My Plan After Signing Up?", a: "Yes, you can upgrade or downgrade your plan at any time from your account settings." },
  { q: "What Kind Of Support Can I Expect From My Trainer?", a: "You get 24/7 chat support and scheduled weekly video calls." },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-20 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16">FAQ</h2>
        
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div 
              key={idx} 
              className={`border rounded-lg transition-all duration-300 overflow-hidden ${
                openIndex === idx 
                  ? 'border-brand-red bg-brand-red/5' 
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <button 
                onClick={() => setOpenIndex(idx === openIndex ? -1 : idx)}
                className="w-full flex justify-between items-center p-6 text-left"
              >
                <span className="font-bold text-lg">{item.q}</span>
                {openIndex === idx ? <ChevronUp className="text-brand-red" /> : <ChevronDown className="text-gray-400" />}
              </button>
              
              <div 
                className={`px-6 text-gray-400 text-sm leading-relaxed transition-all duration-300 ${
                  openIndex === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
