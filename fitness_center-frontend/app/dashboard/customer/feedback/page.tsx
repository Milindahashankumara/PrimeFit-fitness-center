"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeedbackAPI, BookingsAPI } from "@/app/lib/api";
import {
  ArrowLeft,
  Star,
  Send,
  CheckCircle,
  Calendar,
  User,
  MessageSquare,
  Award,
  Clock,
  ThumbsUp,
} from "lucide-react";

interface CompletedSession {
  id: string;
  coachName: string;
  coachAvatar?: string;
  sessionType: string;
  date: string;
  duration: number;
  hasFeedback: boolean;
}

interface FeedbackSubmission {
  id: string;
  sessionId: string;
  coachName: string;
  rating: number;
  feedback: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
}

type BookingCoachRef =
  | string
  | { _id?: string; id?: string }
  | null
  | undefined;

type BookingRecord = {
  _id?: string;
  id?: string;
  coachId?: BookingCoachRef;
  coachName?: string;
  sessionType?: string;
  date: string;
  duration?: number;
  status: string;
};

type FeedbackRecord = {
  _id?: string;
  id?: string;
  sessionId?: string | { _id?: string; id?: string };
  coachName?: string;
  rating?: number;
  feedback?: string;
  submittedDate?: string;
  status: "pending" | "approved" | "rejected";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const getCoachId = (coachRef: BookingCoachRef): string => {
  if (typeof coachRef === "string") {
    return coachRef;
  }

  if (coachRef && typeof coachRef === "object") {
    return coachRef._id || coachRef.id || "";
  }

  return "";
};

const CustomerFeedbackPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [completedSessions, setCompletedSessions] = useState<
    CompletedSession[]
  >([]);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackSubmission[]>(
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const bookings = (await BookingsAPI.getByCustomer(
          user.email,
        )) as BookingRecord[];
        const feedbacks =
          (await FeedbackAPI.getByCustomer()) as FeedbackRecord[];

        const completed = bookings
          .filter((booking) => booking.status === "completed")
          .map((booking) => {
            const bookingId = String(booking._id || booking.id || "");

            return {
              id: bookingId,
              coachName: booking.coachName || "Coach",
              sessionType: booking.sessionType || "Training",
              date: booking.date,
              duration: booking.duration || 60,
              hasFeedback: feedbacks.some((feedbackItem) => {
                const feedbackSessionId = String(
                  (typeof feedbackItem.sessionId === "object"
                    ? feedbackItem.sessionId?._id || feedbackItem.sessionId?.id
                    : feedbackItem.sessionId) || "",
                );
                return feedbackSessionId === bookingId;
              }),
            };
          });

        if (!isMounted) return;

        setCompletedSessions(completed);

        const history = feedbacks.map((feedbackItem) => ({
          id: feedbackItem._id || feedbackItem.id || "",
          sessionId:
            typeof feedbackItem.sessionId === "string"
              ? feedbackItem.sessionId
              : feedbackItem.sessionId?._id || feedbackItem.sessionId?.id || "",
          coachName: feedbackItem.coachName || "Coach",
          rating: feedbackItem.rating || 0,
          feedback: feedbackItem.feedback || "",
          submittedDate: feedbackItem.submittedDate
            ? new Date(feedbackItem.submittedDate).toISOString().split("T")[0]
            : "",
          status: feedbackItem.status,
        }));

        setFeedbackHistory(history);
      } catch {
        setSuccessMessage("Unable to load feedback data.");
        setShowSuccess(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSubmitFeedback = async () => {
    if (!selectedSession || rating === 0 || !feedback.trim()) {
      return;
    }

    const session = completedSessions.find((s) => s.id === selectedSession);
    if (!session) return;

    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    try {
      setIsSubmitting(true);

      const bookings = (await BookingsAPI.getByCustomer(
        user?.email || "",
      )) as BookingRecord[];
      const booking = bookings.find(
        (bookingItem) =>
          (bookingItem._id || bookingItem.id) === selectedSession,
      );

      if (!booking) {
        throw new Error("Booking not found");
      }

      const coachId = getCoachId(booking.coachId);

      if (!coachId) {
        throw new Error("Coach ID not found for this booking");
      }

      const newFeedback = await FeedbackAPI.create({
        sessionId: selectedSession,
        coachId,
        coachName: session.coachName,
        rating,
        feedback: feedback.trim(),
        status: "pending",
      });

      const feedbackItem: FeedbackSubmission = {
        id: newFeedback._id || newFeedback.id || Date.now().toString(),
        sessionId: selectedSession,
        coachName: session.coachName,
        rating,
        feedback: feedback.trim(),
        submittedDate: new Date().toISOString().split("T")[0],
        status: "pending",
      };

      setFeedbackHistory([feedbackItem, ...feedbackHistory]);

      setCompletedSessions(
        completedSessions.map((s) =>
          s.id === selectedSession ? { ...s, hasFeedback: true } : s,
        ),
      );

      setSelectedSession(null);
      setRating(0);
      setFeedback("");
      setSuccessMessage(
        "Thank you for your feedback! It will be reviewed by our team.",
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      setSuccessMessage(
        getErrorMessage(error, "Failed to submit feedback. Please try again."),
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSessions = completedSessions.filter((s) => !s.hasFeedback);
  const selectedSessionData = completedSessions.find(
    (s) => s.id === selectedSession,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-400 bg-green-500/20";
      case "pending":
        return "text-yellow-400 bg-yellow-500/20";
      case "rejected":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="text-green-400" size={16} />;
      case "pending":
        return <Clock className="text-yellow-400" size={16} />;
      case "rejected":
        return <MessageSquare className="text-red-400" size={16} />;
      default:
        return null;
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
              <h1 className="text-2xl font-bold">Session Feedback</h1>
              <p className="text-sm text-gray-400">
                Share your experience with our coaches
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-brand-gray p-2 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === "submit"
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white"
              }`}
          >
            <Send size={18} />
            Submit Feedback
            {availableSessions.length > 0 && (
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                {availableSessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === "history"
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white"
              }`}
          >
            <MessageSquare size={18} />
            My Feedback
            {feedbackHistory.length > 0 && (
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                {feedbackHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Submit Feedback Tab */}
        {activeTab === "submit" && (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Award className="text-blue-400 shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-blue-400 mb-1">
                    Help Us Improve!
                  </h3>
                  <p className="text-sm text-gray-300">
                    Your feedback helps us maintain high-quality coaching
                    standards and helps other customers make informed decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Select Session */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-brand-red" size={24} />
                Select a Completed Session
              </h2>

              {availableSessions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare
                    className="mx-auto mb-4 text-gray-600"
                    size={64}
                  />
                  <h3 className="text-xl font-bold mb-2">
                    No Sessions Available
                  </h3>
                  <p className="text-gray-400">
                    Completed sessions will appear here automatically after your
                    coach marks them as finished. Refresh the page or wait a
                    moment if a session was completed recently.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session.id)}
                      className={`w-full p-4 rounded-lg border transition-all ${selectedSession === session.id
                          ? "border-brand-red bg-brand-red/10"
                          : "border-white/10 bg-black/40 hover:border-white/20"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center font-bold">
                            {session.coachName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <h3 className="font-bold">{session.coachName}</h3>
                            <p className="text-sm text-gray-400">
                              {session.sessionType}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span>
                                {new Date(session.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                              <span>•</span>
                              <span>{session.duration} min</span>
                            </div>
                          </div>
                        </div>
                        {selectedSession === session.id && (
                          <CheckCircle className="text-brand-red" size={24} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rating and Feedback Form */}
            {selectedSession && (
              <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-bold mb-6">Your Feedback</h2>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">
                    Rate Your Experience *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={40}
                          className={`${star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-600"
                            } transition-colors`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-4 text-lg font-semibold">
                        {rating === 5 && "Excellent!"}
                        {rating === 4 && "Great!"}
                        {rating === 3 && "Good"}
                        {rating === 2 && "Fair"}
                        {rating === 1 && "Poor"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">
                    Share Your Experience *
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={`Tell us about your session with ${selectedSessionData?.coachName}...`}
                    rows={6}
                    maxLength={500}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none"
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>
                      Your feedback will be reviewed before being published
                    </span>
                    <span>{feedback.length}/500</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitFeedback}
                  disabled={rating === 0 || !feedback.trim() || isSubmitting}
                  className="w-full bg-brand-red hover:bg-red-600 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {feedbackHistory.length === 0 ? (
              <div className="bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
                <MessageSquare
                  className="mx-auto mb-4 text-gray-600"
                  size={64}
                />
                <h3 className="text-xl font-bold mb-2">No Feedback Yet</h3>
                <p className="text-gray-400 mb-6">
                  You haven't submitted any feedback yet. Complete a session and
                  share your experience!
                </p>
                <button
                  onClick={() => setActiveTab("submit")}
                  className="bg-brand-red hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Send size={18} />
                  Submit Feedback
                </button>
              </div>
            ) : (
              feedbackHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-brand-gray rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center font-bold">
                        {item.coachName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <h3 className="font-bold">{item.coachName}</h3>
                        <p className="text-sm text-gray-400">
                          Submitted{" "}
                          {new Date(item.submittedDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-lg flex items-center gap-2 ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                      <span className="text-xs font-semibold capitalize">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={
                          star <= item.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold">
                      {item.rating}/5
                    </span>
                  </div>

                  <div className="bg-black/40 p-4 rounded-lg">
                    <p className="text-gray-300">{item.feedback}</p>
                  </div>

                  {item.status === "pending" && (
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                      <p className="text-sm text-yellow-400">
                        ⏳ Your feedback is under review and will be published
                        soon.
                      </p>
                    </div>
                  )}

                  {item.status === "approved" && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <ThumbsUp size={16} />
                        Your feedback has been approved and is now visible on
                        our website!
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerFeedbackPage;
