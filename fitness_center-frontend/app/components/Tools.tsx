import React from 'react';
import Image from 'next/image';

const tools = [
  { img: "/tools1.png", title: "Calorie Calculator" },
  { img: "/tools2.png", title: "BMI Calculator" },
  { img: "/tools3.png", title: "Macronutrient Calculator" },
  { img: "/tools4.png", title: "Goal Setting Tool" },
  { img: "/tools5.png", title: "Workout Tracker" },
];

const Tools = () => {
  return (
    <div className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
           <h2 className="text-4xl font-bold">Our Fitness <span className="text-brand-red">Tools</span></h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {tools.map((tool, index) => (
            <div key={index} className="bg-brand-gray p-6 rounded-xl border border-white/5 hover:border-brand-red/50 transition-all group cursor-pointer text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-brand-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="relative w-16 h-16 text-white group-hover:text-brand-red transition-colors drop-shadow-[0_0_10px_rgba(217,4,41,0.5)]">
                  <Image src={tool.img} alt={tool.title} fill className="object-contain" />
                </div>
                <h3 className="font-bold text-lg uppercase font-mono">{tool.title}</h3>
                <p className="text-brand-red text-sm mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  Learn More &rarr;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;
