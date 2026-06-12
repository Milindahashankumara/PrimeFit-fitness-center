"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingsAPI, MessagesAPI } from "@/app/lib/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  CheckCircle,
  X,
  AlertCircle,
  MessageSquare,
  Edit,
  Trash2,
} from "lucide-react";

interface Booking {
  id: number;
  _id?: string; // MongoDB ID for API calls
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  coachId?: string | { _id?: string; id?: string };
  coachName: string;
  coachImage: string;
  date: string;
  time: string;
  type: "personal" | "group" | "online";
  duration?: number;
  status:
    | "upcoming"
    | "completed"
    | "cancelled"
    | "pending"
    | "accepted"
    | "rejected"
    | "rescheduled"
    | "pending_reschedule";
  location: string;
  price: number;
  sessionType: string;
  message?: string;
  requestedAt?: string;
  rescheduledBy?: string;
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
  rescheduleRequest?: {
    requestedDate: string;
    requestedTime: string;
    requestReason?: string;
    requestedAt?: string;
    requestedBy?: string;
  };
  [key: string]: unknown;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const BookingsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "upcoming" | "completed" | "cancelled"
  >("upcoming");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
    reason: "",
  });
  const [messageData, setMessageData] = useState({
    subject: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  // Load user's bookings from API
  useEffect(() => {
    const loadBookings = async () => {
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        setAuthError(true);
        setIsLoading(false);
        setTimeout(() => router.push("/auth/login"), 2000);
        return;
      }

      try {
        setIsLoading(true);
        const apiBookings = await BookingsAPI.getByCustomer(user.email);

        const bookingsArray = Array.isArray(apiBookings) ? apiBookings : [];

        const transformedBookings: Booking[] = bookingsArray.map(
          (booking, index) => {
            const bookingId = booking._id || booking.id || String(index);
            const coachIdValue =
              typeof booking.coachId === "object" && booking.coachId !== null
                ? booking.coachId._id || booking.coachId.id || ""
                : booking.coachId || "";
            return {
              ...booking,
              id:
                typeof bookingId === "string"
                  ? parseInt(bookingId.slice(-8), 16)
                  : bookingId,
              _id: booking._id,
              coachId: coachIdValue,
              coachName: booking.coachName || "Unknown Coach",
              coachImage: (booking.coachName || "UK")
                .split(" ")
                .map((n: string) => n[0])
                .join(""),
              status:
                booking.status === "pending_reschedule"
                  ? "pending_reschedule"
                  : booking.status === "rescheduled"
                  ? "rescheduled"
                  : booking.status === "accepted"
                    ? "upcoming"
                    : booking.status === "rejected"
                      ? "cancelled"
                      : booking.status === "completed"
                        ? "completed"
                        : booking.status === "cancelled"
                          ? "cancelled"
                          : "upcoming",
              location: booking.location || "TBD",
            };
          },
        );

        setAllBookings(transformedBookings);
        setAuthError(false);
      } catch (error) {
        const errorMessage = getErrorMessage(error, "Failed to load bookings");

        if (
          errorMessage.includes("Not authorized") ||
          errorMessage.includes("token")
        ) {
          setAuthError(true);
          setTimeout(() => router.push("/auth/login"), 2000);
        }

        setAllBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
    const interval = setInterval(loadBookings, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const filteredBookings = allBookings.filter((booking) => {
    if (activeTab === "upcoming") {
      return (
        booking.status === "upcoming" ||
        booking.status === "rescheduled" ||
        booking.status === "accepted" ||
        booking.status === "pending_reschedule"
      );
    }
    return booking.status === activeTab;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateString: string) => {
    const bookingDate = new Date(dateString);
    const today = new Date();
    const diffTime = bookingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Past";
    return `In ${diffDays} days`;
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleMessageCoach = (booking: Booking) => {
    setSelectedBooking(booking);
    setMessageData({
      subject: `Message about ${booking.sessionType} session`,
      content: `Hi ${booking.coachName},\n\n`,
    });
    setShowMessageModal(true);
  };

  const handleRescheduleBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setRescheduleData({
      date: booking.date,
      time: booking.time,
      reason: "",
    });
    setShowRescheduleModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedBooking || !selectedBooking._id) {
      setShowCancelModal(false);
      return;
    }

    try {
      await BookingsAPI.update(selectedBooking._id, {
        status: "cancelled",
      });

      setAllBookings(
        allBookings.map((booking) =>
          booking.id === selectedBooking.id
            ? { ...booking, status: "cancelled" }
            : booking,
        ),
      );

      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error) {
      alert(
        getErrorMessage(error, "Failed to cancel booking. Please try again."),
      );
      setShowCancelModal(false);
    }
  };

  const confirmReschedule = async () => {
    if (!selectedBooking || !selectedBooking._id) {
      setShowRescheduleModal(false);
      return;
    }

    const coachId =
      typeof selectedBooking.coachId === "object"
        ? selectedBooking.coachId._id || selectedBooking.coachId.id || ""
        : selectedBooking.coachId;

    if (!rescheduleData.date || !rescheduleData.time) {
      alert("Please choose a new date and time.");
      return;
    }

    const newSlot = new Date(`${rescheduleData.date}T${rescheduleData.time}:00`);
    if (Number.isNaN(newSlot.getTime())) {
      alert("Please choose a valid date and time.");
      return;
    }

    if (newSlot.getTime() <= Date.now()) {
      alert("Please choose a future time for the rescheduled session.");
      return;
    }

    try {
      const updatedBooking = await BookingsAPI.update(selectedBooking._id, {
        status: "pending_reschedule",
        rescheduleRequest: {
          requestedDate: rescheduleData.date,
          requestedTime: rescheduleData.time,
          requestReason: rescheduleData.reason,
          requestedAt: new Date().toISOString(),
          requestedBy: "customer"
        }
      });

      setAllBookings(
        allBookings.map((booking) =>
          booking.id === selectedBooking.id
            ? {
                ...booking,
                ...updatedBooking,
                status: "pending_reschedule",
              }
            : booking,
        ),
      );

      if (coachId) {
        try {
          await MessagesAPI.send({
            receiverId: coachId,
            subject: `Reschedule request for ${selectedBooking.sessionType} session`,
            content:
              `Hi ${selectedBooking.coachName},\n\n` +
              `I would like to reschedule my booking from ${formatDate(selectedBooking.date)} at ${selectedBooking.time} ` +
              `to ${formatDate(rescheduleData.date)} at ${rescheduleData.time}.\n\n` +
              (rescheduleData.reason
                ? `Reason: ${rescheduleData.reason}\n\n`
                : "") +
              "Please review and approve this request.\n\nThanks.",
          });
        } catch (messageError) {
          console.error("Booking updated, but coach message failed:", messageError);
        }
      }

      setShowRescheduleModal(false);
      setSelectedBooking(null);
      setRescheduleData({ date: "", time: "", reason: "" });
      alert("Reschedule request sent! Waiting for coach approval.");
    } catch (error) {
      alert(
        getErrorMessage(error, "Failed to reschedule booking. Please try again."),
      );
      setShowRescheduleModal(false);
    }
  };

  const confirmMessageCoach = async () => {
    if (!selectedBooking || !selectedBooking.coachId) {
      setShowMessageModal(false);
      return;
    }

    const coachId =
      typeof selectedBooking.coachId === "object"
        ? selectedBooking.coachId._id || selectedBooking.coachId.id || ""
        : selectedBooking.coachId;

    if (!messageData.subject.trim() || !messageData.content.trim()) {
      alert("Please add a subject and message.");
      return;
    }

    if (!coachId) {
      alert("Coach details are missing for this booking.");
      return;
    }

    try {
      await MessagesAPI.send({
        receiverId: coachId,
        subject: messageData.subject.trim(),
        content: messageData.content.trim(),
      });

      setShowMessageModal(false);
      setSelectedBooking(null);
      setMessageData({ subject: "", content: "" });
    } catch (error) {
      alert(getErrorMessage(error, "Failed to send message. Please try again."));
    }
  };

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
              <h1 className="text-2xl font-bold">My Bookings</h1>
              <p className="text-sm text-gray-400">
                Manage your training sessions
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Authentication Error Message */}
        {authError && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-red-400 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-300 mb-4">
              You need to log in to view your bookings. Redirecting to login
              page...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !authError && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
            </div>
            <p className="text-gray-400">Loading your bookings...</p>
          </div>
        )}

        {/* Tabs */}
        {!isLoading && !authError && (
          <>
            <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === "upcoming"
                    ? "bg-brand-red text-white"
                    : "bg-brand-gray border border-white/10 hover:border-brand-red"
                }`}
              >
                Upcoming (
                {allBookings.filter((b) => b.status === "upcoming" || b.status === "rescheduled" || b.status === "accepted" || b.status === "pending_reschedule").length})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === "completed"
                    ? "bg-brand-red text-white"
                    : "bg-brand-gray border border-white/10 hover:border-brand-red"
                }`}
              >
                Completed (
                {allBookings.filter((b) => b.status === "completed").length})
              </button>
              <button
                onClick={() => setActiveTab("cancelled")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === "cancelled"
                    ? "bg-brand-red text-white"
                    : "bg-brand-gray border border-white/10 hover:border-brand-red"
                }`}
              >
                Cancelled (
                {allBookings.filter((b) => b.status === "cancelled").length})
              </button>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-gray-500" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    No {activeTab} bookings
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {activeTab === "upcoming"
                      ? "You don't have any upcoming sessions. Book a coach to get started!"
                      : `You have no ${activeTab} bookings.`}
                  </p>
                  {activeTab === "upcoming" && (
                    <button
                      onClick={() => router.push("/dashboard/customer/coaches")}
                      className="bg-brand-red hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Browse Coaches
                    </button>
                  )}
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-brand-gray rounded-2xl overflow-hidden border border-white/10 hover:border-brand-red/50 transition-all"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Coach Avatar */}
                          <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                            {booking.coachImage}
                          </div>

                          {/* Booking Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold">
                                  {booking.coachName}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {booking.sessionType}
                                </p>
                              </div>
                              {(booking.status === "upcoming" ||
                                booking.status === "accepted") && (
                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                                  {getDaysUntil(booking.date)}
                                </span>
                              )}
                              {booking.status === "rescheduled" && (
                                <div className="flex gap-2">
                                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                                    Rescheduled
                                  </span>
                                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                                    {getDaysUntil(booking.date)}
                                  </span>
                                </div>
                              )}
                              {booking.status === "pending_reschedule" && (
                                <div className="flex gap-2">
                                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold">
                                    Pending Reschedule Approval
                                  </span>
                                </div>
                              )}
                              {booking.status === "completed" && (
                                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                                  Completed
                                </span>
                              )}
                              {booking.status === "cancelled" && (
                                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold">
                                  Cancelled
                                </span>
                              )}
                            </div>

                            {/* Reschedule Notice */}
                            {booking.status === "rescheduled" &&
                              booking.rescheduledBy === "coach" && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg mb-3">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle
                                      className="text-yellow-400 shrink-0 mt-0.5"
                                      size={16}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-yellow-400 mb-1">
                                        Coach Rescheduled This Session
                                      </p>
                                      <p className="text-xs text-gray-300 mb-2">
                                        <span className="line-through text-gray-500">
                                          Original: {booking.originalDate} at{" "}
                                          {booking.originalTime}
                                        </span>
                                        <br />
                                        <span className="text-green-400 font-semibold">
                                          New: {booking.date} at {booking.time}
                                        </span>
                                      </p>
                                      {booking.rescheduleReason && (
                                        <p className="text-xs text-gray-400 italic">
                                          {booking.rescheduleReason}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Session Info Grid */}
                            {booking.status === "pending_reschedule" && booking.rescheduleRequest ? (
                              <div className="bg-black/40 p-4 rounded-xl mt-4">
                                <p className="text-sm font-semibold text-orange-400 mb-3">Awaiting Coach Approval</p>
                                <div className="space-y-2">
                                  <p className="text-sm">
                                    <span className="text-gray-400">Current:</span> {formatDate(booking.date)} at {booking.time}
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-400">Requested:</span>{" "}
                                    <span className="text-green-400 font-semibold">
                                      {formatDate(booking.rescheduleRequest.requestedDate)} at {booking.rescheduleRequest.requestedTime}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="grid md:grid-cols-4 gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                  <Calendar
                                    className="text-brand-red shrink-0"
                                    size={18}
                                  />
                                  <div>
                                    <p className="text-xs text-gray-400">Date</p>
                                    <p className="font-semibold text-sm">
                                      {formatDate(booking.date)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock
                                    className="text-brand-red shrink-0"
                                    size={18}
                                  />
                                  <div>
                                    <p className="text-xs text-gray-400">Time</p>
                                    <p className="font-semibold text-sm">
                                      {booking.time}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {booking.location === "Online" ? (
                                    <Video
                                      className="text-brand-red shrink-0"
                                      size={18}
                                    />
                                  ) : (
                                    <MapPin
                                      className="text-brand-red shrink-0"
                                      size={18}
                                    />
                                  )}
                                  <div>
                                    <p className="text-xs text-gray-400">
                                      Location
                                    </p>
                                    <p className="font-semibold text-sm">
                                      {booking.location}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <User
                                    className="text-brand-red shrink-0"
                                    size={18}
                                  />
                                  <div>
                                    <p className="text-xs text-gray-400">Type</p>
                                    <p className="font-semibold text-sm capitalize">
                                      {booking.type}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="bg-black/40 p-3 rounded-lg mb-4 inline-block">
                        <span className="text-gray-400 text-sm">Total: </span>
                        <span className="text-brand-red font-bold text-lg">
                          LKR {booking.price}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {(booking.status === "upcoming" || booking.status === "rescheduled" || booking.status === "accepted") && (
                          <>
                            <button
                              onClick={() => handleMessageCoach(booking)}
                              className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare size={18} />
                              Message Coach
                            </button>
                            <button
                              onClick={() => handleRescheduleBooking(booking)}
                              className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <Edit size={18} />
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 size={18} />
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === "pending_reschedule" && (
                          <>
                            <button
                              onClick={() => handleMessageCoach(booking)}
                              className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare size={18} />
                              Message Coach
                            </button>
                            <button
                              disabled
                              className="flex-1 bg-white/5 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Clock size={18} />
                              Awaiting Approval
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 size={18} />
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === "completed" && (
                          <>
                            <button className="flex-1 bg-brand-red hover:bg-red-700 py-2 rounded-lg font-semibold transition-colors">
                              Leave Review
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/customer/coaches/${booking.id}`,
                                )
                              }
                              className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors"
                            >
                              Book Again
                            </button>
                          </>
                        )}
                        {booking.status === "cancelled" && (
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/customer/coaches/${booking.id}`,
                              )
                            }
                            className="flex-1 bg-brand-red hover:bg-red-700 py-2 rounded-lg font-semibold transition-colors"
                          >
                            Book Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">
              Cancel Booking?
            </h2>
            <p className="text-gray-400 text-center mb-6">
              Are you sure you want to cancel your session with{" "}
              {selectedBooking.coachName} on {formatDate(selectedBooking.date)}?
            </p>

            <div className="bg-black/40 p-4 rounded-xl mb-6">
              <p className="text-sm text-gray-400 mb-2">Cancellation Policy:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Cancel 24+ hours before: Full refund</li>
                <li>• Cancel 12-24 hours before: 50% refund</li>
                <li>• Cancel less than 12 hours: No refund</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancellation}
                className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl font-semibold transition-colors"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">Reschedule Session</h2>
            <p className="text-gray-400 mb-6">
              Update your booking with {selectedBooking.coachName}. The coach will be notified by email.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Date</label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(event) =>
                    setRescheduleData({ ...rescheduleData, date: event.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-red"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Time</label>
                <input
                  type="time"
                  value={rescheduleData.time}
                  onChange={(event) =>
                    setRescheduleData({ ...rescheduleData, time: event.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Reason</label>
              <textarea
                rows={4}
                value={rescheduleData.reason}
                onChange={(event) =>
                  setRescheduleData({ ...rescheduleData, reason: event.target.value })
                }
                placeholder="Optional: share why you need to reschedule"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-red resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedBooking(null);
                  setRescheduleData({ date: "", time: "", reason: "" });
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                className="flex-1 bg-brand-red hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Save Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Coach Modal */}
      {showMessageModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">Message Coach</h2>
            <p className="text-gray-400 mb-6">
              This message will be sent to {selectedBooking.coachName} by email.
            </p>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Subject</label>
              <input
                type="text"
                value={messageData.subject}
                onChange={(event) =>
                  setMessageData({ ...messageData, subject: event.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-red"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Message</label>
              <textarea
                rows={5}
                value={messageData.content}
                onChange={(event) =>
                  setMessageData({ ...messageData, content: event.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-red resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedBooking(null);
                  setMessageData({ subject: "", content: "" });
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMessageCoach}
                className="flex-1 bg-brand-red hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors"
                disabled={!messageData.subject.trim() || !messageData.content.trim()}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
