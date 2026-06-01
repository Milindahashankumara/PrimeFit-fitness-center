import React from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const trainers = [
  { name: "Sam Sam", role: "Personal Trainer", image: "/trainer1.png" },
  { name: "Harris Rough", role: "Personal Trainer", image: "/trainer2.png" },
  { name: "Jemmy Anderson", role: "Personal Trainer", image: "/trainer3.png" },
  { name: "Tom Cat", role: "Personal Trainer", image: "/trainer4.png" },
];

const Coaches = () => {
  return (
    <section id="coaching" className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold">
              Meet Our <span className="text-brand-red">Trainers</span>
            </h2>
            <p className="text-gray-400 mt-2">
              See a few of the many positive reviews of our customers.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="p-2 border border-white/20 rounded hover:border-brand-red hover:text-brand-red transition-colors">
              ←
            </button>
            <button className="p-2 border border-white/20 rounded hover:border-brand-red hover:text-brand-red transition-colors">
              →
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trainers.map((trainer, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl overflow-hidden bg-brand-gray border border-white/5 hover:border-brand-red/50 transition-all"
            >
              <div className="h-80 overflow-hidden relative">
                <Image
                  src={trainer.image}
                  alt={trainer.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6">
                <h3 className="text-xl font-bold mb-1">{trainer.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{trainer.role}</p>
                <button className="flex items-center gap-2 text-brand-red text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Learn More <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Coaches;
