"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookingsAPI, CoachesAPI } from "@/app/lib/api";
import {
  ArrowLeft,
  Star,
  Award,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  Video,
  MessageSquare,
  Shield,
  TrendingUp,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
  date: string;
}

interface Coach {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  experience?: number;
  hourlyRate?: number;
  activeClients?: number;
  bio?: string;
  certifications?: string[];
  achievements?: string[];
  coachStatus?: string;
  blockedDates?: { id: string; date: string; reason: string }[];
  availability?: any;
}

interface CustomerUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const CoachDetailPage = () => {
  const params = useParams<{ id: string }>();
  const coachId = params?.id || "";
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null,
  );
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sessionType, setSessionType] = useState<"personal" | "group">(
    "personal",
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [coachBookings, setCoachBookings] = useState<any[]>([]);

  const loadCoachBookings = useCallback(async () => {
    if (!coachId) return;
    try {
      const bookings = await BookingsAPI.getByCoach(coachId);
      setCoachBookings(bookings || []);
    } catch (e) {
      console.error("Failed to load coach bookings", e);
    }
  }, [coachId]);

  const loadCoachData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const id = coachId;
      if (!id || id.length !== 24 || !/^[a-f\d]{24}$/i.test(id)) {
        setError("Invalid coach ID format");
        setLoading(false);
        return;
      }

      const coachData = await CoachesAPI.getById(id);
      if (!coachData) {
        setError("Coach not found");
        setLoading(false);
        return;
      }

      setCoach(coachData);
      setLoading(false);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load coach details"));
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    loadCoachData();
    loadCoachBookings();
  }, [loadCoachData, loadCoachBookings]);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDateBlocked = useCallback((date: Date) => {
    if (!coach || !coach.blockedDates) return false;
    const dateStr = getLocalDateString(date);
    return coach.blockedDates.some((b: any) => b.date === dateStr);
  }, [coach]);

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const generateHourlySlots = (startTime: string, endTime: string, durationMinutes: number) => {
    const list: string[] = [];
    let current = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    while (current + durationMinutes <= end) {
      list.push(minutesToTime(current));
      current += 60;
    }
    return list;
  };

  const bookedSlots = useMemo(() => {
    const dateStr = getLocalDateString(selectedDate);
    const activeStatuses = ["pending", "accepted", "rescheduled", "pending_reschedule"];
    return coachBookings
      .filter((b: any) => b.date === dateStr && activeStatuses.includes(b.status))
      .map((b: any) => b.time);
  }, [coachBookings, selectedDate]);

  const generateTimeSlots = useCallback((date: Date): TimeSlot[] => {
    if (!coach) return [];

    let slots = coach.availability;
    if (typeof slots === "string") {
      try {
        slots = JSON.parse(slots);
      } catch (e) {
        slots = [];
      }
    }
    if (!Array.isArray(slots)) {
      slots = [];
    }

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weekdayName = weekdays[date.getDay()];

    const daySlots = slots.filter((s: any) => s && s.day === weekdayName && s.startTime && s.endTime);
    const generatedTimes: string[] = [];

    daySlots.forEach((slot: any) => {
      const windowTimes = generateHourlySlots(slot.startTime, slot.endTime, 60);
      windowTimes.forEach((t) => {
        if (!generatedTimes.includes(t)) {
          generatedTimes.push(t);
        }
      });
    });

    generatedTimes.sort((a, b) => a.localeCompare(b));

    const dateStr = getLocalDateString(date);

    return generatedTimes.map((time) => {
      const isBooked = bookedSlots.includes(time);
      return {
        time,
        available: !isBooked,
        date: dateStr,
      };
    });
  }, [coach, bookedSlots]);

  const dates = useMemo(() => generateDates(), []);
  const timeSlots = useMemo(
    () => generateTimeSlots(selectedDate),
    [selectedDate, generateTimeSlots],
  );

  const handleBooking = async () => {
    if (!selectedTimeSlot || !coach) return;

    const userData = localStorage.getItem("user");
    const user = userData ? (JSON.parse(userData) as CustomerUser) : null;
    const customerId = user?.id || user?._id;

    if (!user || !customerId) {
      alert("Please log in to book a session");
      return;
    }

    try {
      await BookingsAPI.create({
        customerId,
        customerName: user.name,
        customerEmail: user.email,
        coachId: coach._id || coach.id || coachId,
        coachName: coach.name,
        date: selectedTimeSlot.date.split("T")[0],
        time: selectedTimeSlot.time,
        type: sessionType,
        duration: 60,
        price: coach.hourlyRate || 0,
        sessionType: coach.specializations?.[0] || "Training",
        location: sessionType === "personal" ? "Studio A" : "Online",
        message: `Booking for ${sessionType} training session`,
        status: "pending",
      });

      setBookingConfirmed(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingConfirmed(false);
        router.push("/dashboard/customer?bookingSuccess=true");
      }, 2000);
    } catch (error) {
      alert(
        getErrorMessage(error, "Failed to create booking. Please try again."),
      );
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleRatingSubmit = () => {
    setRatingSubmitted(true);
    setTimeout(() => {
      setShowRatingModal(false);
      setRatingSubmitted(false);
      setRating(0);
      setReviewText("");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
          <p className="text-gray-400">Loading coach profile...</p>
        </div>
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-2xl font-bold mb-2">Coach Not Found</h2>
          <p className="text-gray-400 mb-6">
            {error || "Unable to load coach details"}
          </p>
          <button
            onClick={() => router.back()}
            className="bg-brand-red hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="bg-brand-gray border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="hover:text-brand-red transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Coach Profile</h1>
              <p className="text-sm text-gray-400">
                View details and book a session
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Coach Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-brand-gray rounded-2xl overflow-hidden border border-white/10">
              <div className="relative bg-gradient-to-br from-brand-red to-red-900 p-8 text-center">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-brand-red text-4xl font-bold mx-auto shadow-2xl mb-4">
                  {coach.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <h2 className="text-3xl font-bold mb-2">{coach.name}</h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={20} />
                  <span className="text-2xl font-bold">
                    {coach.rating || 0}
                  </span>
                  <span className="text-white/80">
                    ({coach.reviewCount || 0} reviews)
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/90">
                  <Award size={18} />
                  <span>{coach.experience || 0} years experience</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Specializations */}
                <div>
                  <p className="text-xs text-gray-400 mb-3 font-semibold">
                    SPECIALIZATIONS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {coach.specializations &&
                    coach.specializations.length > 0 ? (
                      coach.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="text-sm bg-brand-red/20 text-brand-red px-3 py-1.5 rounded-full border border-brand-red/30"
                        >
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        No specializations listed
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="bg-black/40 p-4 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Session Price</p>
                  <p className="text-3xl font-bold text-brand-red">
                    LKR {coach.hourlyRate || 0}
                    <span className="text-lg text-gray-400">/hour</span>
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <div className="bg-black/40 p-3 rounded-lg text-center">
                    <Users className="text-brand-red mx-auto mb-1" size={20} />
                    <p className="font-bold">{coach.activeClients || 0}</p>
                    <p className="text-xs text-gray-400">Active Clients</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg text-center">
                    <Clock className="text-brand-red mx-auto mb-1" size={20} />
                    <p className="font-bold">{coach.reviewCount || 0}</p>
                    <p className="text-xs text-gray-400">Sessions</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full bg-brand-red hover:bg-red-700 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Calendar size={20} />
                    Book Session Now
                  </button>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Star size={20} />
                    Rate Coach
                  </button>
                  <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={20} />
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Shield className="text-brand-red" size={20} />
                Certifications
              </h3>
              <div className="space-y-2">
                {coach.certifications && coach.certifications.length > 0 ? (
                  coach.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="text-green-500" size={16} />
                      <span>{cert}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">
                    No certifications listed
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-2xl mb-4">About Coach</h3>
              <p className="text-gray-300 leading-relaxed">
                {coach.bio || "No bio available"}
              </p>
            </div>

            {/* Performance Stats */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-2">
                <TrendingUp className="text-brand-red" size={24} />
                Performance Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 p-4 rounded-xl text-center border-l-4 border-brand-red">
                  <p className="text-3xl font-bold text-brand-red">
                    {coach.activeClients || 0}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Active Clients</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl text-center border-l-4 border-green-500">
                  <p className="text-3xl font-bold text-green-500">
                    {coach.experience || 0}+
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Years Experience</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl text-center border-l-4 border-yellow-500">
                  <p className="text-3xl font-bold text-yellow-500">
                    {coach.rating?.toFixed(1) || 0}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Avg Rating</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl text-center border-l-4 border-blue-500">
                  <p className="text-3xl font-bold text-blue-500">
                    {coach.reviewCount || 0}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Total Reviews</p>
                </div>
              </div>
            </div>

            {/* Achievements */}
            {coach.achievements && coach.achievements.length > 0 && (
              <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-2xl mb-6 flex items-center gap-2">
                  <Award className="text-brand-red" size={24} />
                  Achievements & Recognition
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {coach.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="bg-black/40 p-4 rounded-xl flex items-start gap-3 border-l-4 border-brand-red"
                    >
                      <CheckCircle
                        className="text-brand-red shrink-0 mt-1"
                        size={20}
                      />
                      <span className="text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Preview */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h3 className="font-bold text-2xl mb-6">Client Reviews</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((review) => (
                  <div key={review} className="bg-black/40 p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center font-bold">
                          J{review}
                        </div>
                        <div>
                          <p className="font-semibold">John Doe {review}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className="text-yellow-400 fill-yellow-400"
                                size={14}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">2 weeks ago</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Excellent coach! Very professional and motivating. Helped
                      me achieve my goals faster than expected.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            {bookingConfirmed ? (
              // Confirmation Screen
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <Check size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Booking Confirmed!</h2>
                <p className="text-gray-400 mb-2">
                  Your session with {coach.name} has been booked
                </p>
                <p className="text-xl font-semibold text-brand-red mb-8">
                  {formatDate(selectedDate)} at {selectedTimeSlot?.time}
                </p>
                <div className="bg-black/40 p-6 rounded-xl mb-8">
                  <p className="text-sm text-gray-400 mb-2">Session Details</p>
                  <p className="font-semibold mb-1">
                    {sessionType === "personal"
                      ? "Personal Training"
                      : "Group Session"}
                  </p>
                  <p className="text-brand-red font-bold">
                    LKR{" "}
                    {sessionType === "personal"
                      ? coach.hourlyRate
                      : (coach.hourlyRate ?? 0) * 0.7}
                    /hour
                  </p>
                </div>
                <p className="text-sm text-gray-400">
                  A confirmation email has been sent to your inbox
                </p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="sticky top-0 bg-brand-gray border-b border-white/10 p-6 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-2xl font-bold">Book a Session</h2>
                    <p className="text-sm text-gray-400">with {coach.name}</p>
                  </div>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="hover:text-brand-red transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Session Type */}
                  <div>
                    <label className="text-sm font-semibold mb-3 block">
                      Session Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSessionType("personal")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          sessionType === "personal"
                            ? "border-brand-red bg-brand-red/20"
                            : "border-white/10 bg-black/40 hover:border-brand-red/50"
                        }`}
                      >
                        <Users
                          className="mx-auto mb-2 text-brand-red"
                          size={24}
                        />
                        <p className="font-semibold">Personal Training</p>
                        <p className="text-sm text-gray-400 mt-1">
                          LKR {coach.hourlyRate}/hour
                        </p>
                      </button>
                      <button
                        onClick={() => setSessionType("group")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          sessionType === "group"
                            ? "border-brand-red bg-brand-red/20"
                            : "border-white/10 bg-black/40 hover:border-brand-red/50"
                        }`}
                      >
                        <Users
                          className="mx-auto mb-2 text-brand-red"
                          size={24}
                        />
                        <p className="font-semibold">Group Session</p>
                        <p className="text-sm text-gray-400 mt-1">
                          LKR {(coach.hourlyRate ?? 0) * 0.7}/hour
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-semibold mb-3 block">
                      Select Date
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {dates.map((date) => {
                        const blocked = isDateBlocked(date);
                        return (
                          <button
                            key={date.toISOString()}
                            disabled={blocked}
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedTimeSlot(null);
                            }}
                            className={`p-3 rounded-xl text-center transition-all ${
                              selectedDate.toDateString() === date.toDateString()
                                ? "bg-brand-red border-2 border-brand-red"
                                : blocked
                                  ? "bg-black/20 border-2 border-white/5 opacity-40 cursor-not-allowed text-gray-500"
                                  : "bg-black/40 border-2 border-white/10 hover:border-brand-red/50"
                            }`}
                          >
                            <p className="text-xs text-gray-400">
                              {getDayName(date)}
                            </p>
                            <p className="font-bold">{date.getDate()}</p>
                            {isToday(date) && !blocked && (
                              <p className="text-xs text-brand-red mt-1">Today</p>
                            )}
                            {blocked && (
                              <p className="text-[10px] text-red-500 font-semibold mt-1">Blocked</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slot Selection */}
                  <div>
                    <label className="text-sm font-semibold mb-3 block">
                      Available Time Slots - {formatDate(selectedDate)}
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto">
                      {isDateBlocked(selectedDate) ? (
                        <div className="col-span-full py-6 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                          <p className="font-bold mb-1">Coach Unavailable</p>
                          <p className="text-xs text-gray-400">This date has been blocked by the coach.</p>
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-gray-400 bg-black/20 rounded-xl border border-white/5">
                          <p className="font-bold">No available sessions</p>
                        </div>
                      ) : (
                        timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-3 rounded-lg text-center transition-all ${
                              selectedTimeSlot?.time === slot.time
                                ? "bg-brand-red border-2 border-brand-red"
                                : slot.available
                                  ? "bg-black/40 border-2 border-white/10 hover:border-brand-red/50"
                                  : "bg-black/20 border-2 border-white/5 opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <Clock size={16} className="mx-auto mb-1" />
                            <p className="font-semibold text-sm">{slot.time}</p>
                            {!slot.available && (
                              <p className="text-xs text-red-400 mt-1">Booked</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Booking Summary */}
                  {selectedTimeSlot && (
                    <div className="bg-black/40 p-6 rounded-xl border border-brand-red/30">
                      <h3 className="font-bold mb-4">Booking Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Coach:</span>
                          <span className="font-semibold">{coach.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date:</span>
                          <span className="font-semibold">
                            {formatDate(selectedDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time:</span>
                          <span className="font-semibold">
                            {selectedTimeSlot.time}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Session Type:</span>
                          <span className="font-semibold capitalize">
                            {sessionType}
                          </span>
                        </div>
                        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
                          <span className="text-gray-400">Total:</span>
                          <span className="font-bold text-brand-red text-lg">
                            LKR{" "}
                            {sessionType === "personal"
                              ? coach.hourlyRate
                              : (coach.hourlyRate ?? 0) * 0.7}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBooking}
                    disabled={!selectedTimeSlot}
                    className="w-full bg-brand-red hover:bg-red-700 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Confirm Booking
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full border border-white/10">
            {ratingSubmitted ? (
              // Confirmation Screen
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <Star size={48} className="text-white fill-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
                <p className="text-gray-400 mb-2">
                  Your rating has been submitted
                </p>
                <p className="text-xl font-semibold text-yellow-400">
                  {rating} Star{rating !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      Rate Your Coach
                    </h2>
                    <button
                      onClick={() => setShowRatingModal(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <p className="text-white/90">
                    Share your experience with {coach.name}
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Star Rating */}
                  <div className="text-center">
                    <p className="text-sm font-semibold mb-4">
                      How was your experience?
                    </p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-125"
                        >
                          <Star
                            size={48}
                            className={`${
                              star <= (hoverRating || rating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-yellow-400 font-semibold">
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent!"}
                      </p>
                    )}
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Share Your Feedback (Optional)
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Tell us about your experience..."
                      rows={4}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-yellow-400 focus:outline-none resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      {reviewText.length} / 500 characters
                    </p>
                  </div>

                  {/* Quick Tags */}
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      What did you like? (Optional)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Professional",
                        "Motivating",
                        "Knowledgeable",
                        "Punctual",
                        "Friendly",
                        "Results-Oriented",
                      ].map((tag) => (
                        <button
                          key={tag}
                          className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm hover:bg-yellow-500/20 hover:border-yellow-500 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleRatingSubmit}
                    disabled={rating === 0}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
                  >
                    <Star size={20} />
                    Submit Rating
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDetailPage;
