'use client';

import React, { useState, useEffect } from 'react';
import { Quote, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  date: string;
  coachName?: string;
}

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    {
      id: 'default',
      name: 'Steven Smith',
      role: 'Our Trainer',
      rating: 5,
      text: "I've been using PrimeFit for the past three months, and I'm genuinely impressed. The website is easy to navigate, and everything is laid out clearly. I purchased the Premium Plan, and the customized coaching has been a game-changer for me. Highly recommended!",
      date: '2026-01-01'
    }
  ]);

  useEffect(() => {
    // Load approved testimonials from localStorage
    const loadTestimonials = () => {
      try {
        const approvedTestimonials = localStorage.getItem('approvedTestimonials');
        if (approvedTestimonials) {
          const parsed = JSON.parse(approvedTestimonials);
          if (parsed.length > 0) {
            // Combine default testimonial with approved ones
            setTestimonials([
              {
                id: 'default',
                name: 'Steven Smith',
                role: 'Our Trainer',
                rating: 5,
                text: "I've been using PrimeFit for the past three months, and I'm genuinely impressed. The website is easy to navigate, and everything is laid out clearly. I purchased the Premium Plan, and the customized coaching has been a game-changer for me. Highly recommended!",
                date: '2026-01-01'
              },
              ...parsed
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading testimonials:', error);
      }
    };

    loadTestimonials();

    // Listen for storage changes to update in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'approvedTestimonials') {
        loadTestimonials();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for updates every 2 seconds (for same-tab updates)
    const interval = setInterval(loadTestimonials, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">What Our <span className="text-brand-red">Customers Say</span></h2>
          <p className="text-gray-400 mt-2">See the real results from our community.</p>
          {testimonials.length > 1 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {currentIndex + 1} of {testimonials.length} testimonials
            </p>
          )}
        </div>

        <div className="relative bg-gradient-to-r from-brand-red/10 to-transparent p-1 rounded-2xl border border-brand-red/20">
          <div className="grid md:grid-cols-2 items-center">
            
            {/* Left Image */}
            <div className="hidden md:block relative h-[500px]">
               <Image 
                 src="/feedback1.png"
                 alt="Fitness Model" 
                 fill
                 className="object-contain z-10 drop-shadow-2xl" 
               />
            </div>

            {/* Right Content */}
            <div className="p-8 md:p-12 relative">
                <div className="bg-[#800000] p-8 rounded-xl relative shadow-2xl min-h-[400px] flex flex-col">
                    <Quote className="absolute top-4 right-4 text-white/20 w-12 h-12" />
                    
                    <h3 className="text-2xl font-bold mb-1">{currentTestimonial.name}</h3>
                    <p className="text-gray-300 text-xs mb-3">{currentTestimonial.role}</p>
                    
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={star <= currentTestimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-300">({currentTestimonial.rating}/5)</span>
                    </div>
                    
                    <p className="text-gray-200 leading-relaxed mb-6 flex-1">
                        "{currentTestimonial.text}"
                    </p>

                    {currentTestimonial.coachName && (
                      <p className="text-xs text-gray-400 mb-4">
                        ⭐ Client of {currentTestimonial.coachName}
                      </p>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
                      <div className="flex gap-2">
                        {testimonials.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 rounded-full transition-all ${
                              idx === currentIndex 
                                ? 'w-8 bg-white' 
                                : 'w-2 bg-white/30 hover:bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handlePrevious}
                          className="p-3 border border-white/20 rounded-full hover:bg-white hover:text-brand-red transition-all"
                          disabled={testimonials.length <= 1}
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <button 
                          onClick={handleNext}
                          className="p-3 border border-white/20 rounded-full hover:bg-white hover:text-brand-red transition-all"
                          disabled={testimonials.length <= 1}
                        >
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
