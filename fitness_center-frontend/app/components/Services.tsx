import React from 'react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const Services = () => {
    const services = [
        { title: "LOSING WEIGHT", desc: "Achieve sustainable weight loss with our customized programs.", img: "/ourservices1.png" },
        { title: "BUILDING MUSCLE", desc: "Develop strength and define your muscles with tailored programs.", img: "/ourservices2.png" },
        { title: "TRAINING AT HOME", desc: "Stay fit and strong with our effective home workout plans.", img: "/ourservices3.png" },
        { title: "GYM PLAN", desc: "Maximize your gym sessions with structured plans.", img: "/ourservices4.png" },
    ];

    return (
        <div id="programs" className="py-20 bg-brand-dark">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-4">Our <span className="text-brand-red">Services</span></h2>
                <p className="text-center text-gray-400 mb-12">At this part you can easily access all of our services.</p>

                <div className="grid md:grid-cols-4 gap-6">
                    {services.map((item, idx) => (
                        <div key={idx} className="bg-brand-gray/50 rounded-xl overflow-hidden group hover:bg-brand-gray transition-colors border border-white/5 relative h-[400px] flex flex-col justify-end p-6">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-brand-red mb-2 uppercase italic">{item.title}</h3>
                                <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                                    {item.desc}
                                </p>
                                <button className="flex items-center gap-2 text-white hover:text-brand-red transition-colors text-sm uppercase tracking-wider font-bold">
                                    Learn More <ArrowRight size={16} className="text-brand-red" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Services;
