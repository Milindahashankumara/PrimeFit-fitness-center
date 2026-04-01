import React from 'react';
import Image from 'next/image';

const Hero = () => {
  return (
    <div id="home" className="relative h-screen min-h-[800px] flex items-center overflow-hidden">
      <Image src="/heropage.png" alt="Hero" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              ACHIEVE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-red-600">FITNESS GOALS</span> <br />
              WITH PRIMEFIT
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Join the PrimeFit community and transform your fitness journey. Our expert coaches and personalized programs are designed to help you achieve your goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-brand-red text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-brand-red/30">
                Start Your Journey
              </button>
              <button className="border border-gray-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:border-white transition-all">
                Explore Programs
              </button>
            </div>

            {/* Bottom Stats */}
            <div className="flex gap-12 pt-12 border-t border-white/10 mt-12">
              <div>
                <h3 className="text-3xl font-bold text-brand-red">96%</h3>
                <p className="text-gray-400 text-sm">Client Satisfaction</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-brand-red text-nowrap">+5 Years</h3>
                <p className="text-gray-400 text-sm">Experience</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-brand-red">+800</h3>
                <p className="text-gray-400 text-sm">Active Members</p>
              </div>
            </div>
          </div>

          {/* Image/Stats Floating */}
          <div className="relative hidden md:block">
            <div className="relative z-10">
               <div className="absolute top-0 right-0 bg-brand-gray p-4 rounded-lg border border-white/10 animate-bounce">
                  <p className="font-bold text-2xl">+1300</p>
                  <p className="text-xs text-gray-400">Positive Reviews</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
