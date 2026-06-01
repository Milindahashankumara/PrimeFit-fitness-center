"use client";

import React, { useState, useEffect } from "react";
import { Quote, ArrowLeft, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import { FeedbackAPI } from "@/app/lib/api";

interface Testimonial {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  date: string;
  coachName?: string;
}

type TestimonialResponse = {
  _id?: string;
  id?: string;
  customerName?: string;
  rating?: number;
  feedback?: string;
  submittedDate?: string;
  createdAt?: string;
  coachName?: string;
};

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTestimonials = async () => {
      try {
        const approvedTestimonials =
          await FeedbackAPI.getApprovedTestimonials();

        if (!isMounted) return;

        const mappedTestimonials = (
          approvedTestimonials as TestimonialResponse[]
        ).map((item, index) => ({
          id: item._id || item.id || `testimonial-${index}`,
          customerName: item.customerName || "Customer",
          rating: Number(item.rating) || 0,
          text: item.feedback || "",
          date:
            item.submittedDate || item.createdAt || new Date().toISOString(),
          coachName: item.coachName,
        }));

        setTestimonials(mappedTestimonials);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error loading testimonials:", error);
        if (isMounted) {
          setTestimonials([]);
          setCurrentIndex(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTestimonials();

    // Refresh periodically so newly approved testimonials appear without code changes.
    const interval = setInterval(loadTestimonials, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1,
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <section className="py-20 bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">
            What Our <span className="text-brand-red">Customers Say</span>
          </h2>
          <p className="text-gray-400 mt-2">
            See the real results from our community.
          </p>
          {testimonials.length > 1 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {currentIndex + 1} of {testimonials.length} testimonials
            </p>
          )}
        </div>

        <div className="relative bg-linear-to-r from-brand-red/10 to-transparent p-1 rounded-2xl border border-brand-red/20">
          <div className="grid md:grid-cols-2 items-center">
            <div className="hidden md:block relative h-[500px]">
              <Image
                src="/feedback1.png"
                alt="Fitness Model"
                fill
                className="object-contain z-10 drop-shadow-2xl"
              />
            </div>

            <div className="p-8 md:p-12 relative">
              <div className="bg-[#800000] p-8 rounded-xl relative shadow-2xl min-h-[400px] flex flex-col">
                <Quote className="absolute top-4 right-4 text-white/20 w-12 h-12" />

                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-300">
                    Loading testimonials...
                  </div>
                ) : currentTestimonial ? (
                  <>
                    <h3 className="text-2xl font-bold mb-1">
                      {currentTestimonial.customerName}
                    </h3>
                    <p className="text-gray-300 text-xs mb-1">
                      {formatDate(currentTestimonial.date)}
                    </p>
                    {currentTestimonial.coachName && (
                      <p className="text-gray-400 text-xs mb-3">
                        Client of {currentTestimonial.coachName}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={
                            star <= currentTestimonial.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-500"
                          }
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-300">
                        ({currentTestimonial.rating}/5)
                      </span>
                    </div>

                    <p className="text-gray-200 leading-relaxed mb-6 flex-1">
                      "{currentTestimonial.text}"
                    </p>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-300 text-center">
                    No approved testimonials yet.
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
                  <div className="flex gap-2">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentIndex
                            ? "w-8 bg-white"
                            : "w-2 bg-white/30 hover:bg-white/50"
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
