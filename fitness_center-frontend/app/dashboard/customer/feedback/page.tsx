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

/**
 * FEEDBACK WORKFLOW:
 * 1. Customer books a session with a coach (status: 'pending')
 * 2. Coach accepts the booking (status: 'accepted')
 * 3. After session is done, coach clicks "Complete Session" button (status: 'completed')
 * 4. Only 'completed' sessions appear here for customer to give feedback
 * 5. Customer rates and writes feedback
 * 6. Feedback goes to admin for review (status: 'pending')
 * 7. Admin approves/rejects feedback
 */

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

  // Load completed sessions and feedback history
  useEffect(() => {
    const loadData = async () => {
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        console.log("No user found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load all bookings
        const bookings = await BookingsAPI.getAll();
        console.log("Loaded bookings:", bookings);

        // Load all feedback
        const feedbacks = await FeedbackAPI.getByCustomer();
        console.log("Loaded feedback:", feedbacks);

        // Filter for completed sessions (completed status only)
        const completed = bookings
          .filter((b: any) => b.status === "completed")
          .map((booking: any) => ({
            id: booking._id || booking.id,
            coachName: booking.coachName,
            sessionType: booking.sessionType,
            date: booking.date,
            duration: booking.duration || 60,
            hasFeedback: feedbacks.some(
              (f: any) => f.sessionId === (booking._id || booking.id),
            ),
          }));

        setCompletedSessions(completed);

        // Transform feedback to match interface
        const history = feedbacks.map((f: any) => ({
          id: f._id || f.id,
          sessionId: f.sessionId,
          coachName: f.coachName,
          rating: f.rating,
          feedback: f.feedback,
          submittedDate: f.submittedDate
            ? new Date(f.submittedDate).toISOString().split("T")[0]
            : "",
          status: f.status,
        }));

        setFeedbackHistory(history);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmitFeedback = async () => {
    if (!selectedSession || rating === 0 || !feedback.trim()) {
      return;
    }

    const session = completedSessions.find((s) => s.id === selectedSession);
    if (!session) return;

    // Get user data for coach info
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    try {
      setIsSubmitting(true);

      // Find the booking to get coach ID
      const bookings = await BookingsAPI.getAll();
      const booking = bookings.find(
        (b: any) => (b._id || b.id) === selectedSession,
      );

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Submit feedback via API
      const newFeedback = await FeedbackAPI.create({
        sessionId: selectedSession,
        coachId: booking.coachId,
        coachName: session.coachName,
        rating,
        feedback: feedback.trim(),
        status: "pending",
      });

      console.log("Feedback submitted:", newFeedback);

      // Add to local state
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

      // Update session to mark as having feedback
      setCompletedSessions(
        completedSessions.map((s) =>
          s.id === selectedSession ? { ...s, hasFeedback: true } : s,
        ),
      );

      // Reset form
      setSelectedSession(null);
      setRating(0);
      setFeedback("");
      setSuccessMessage(
        "Thank you for your feedback! It will be reviewed by our team.",
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      console.error("Failed to submit feedback:", error);
      setSuccessMessage("Failed to submit feedback. Please try again.");
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
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "submit"
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
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "history"
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
                    All feedback is reviewed before being published.
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
                    You've already provided feedback for all completed sessions.
                    Book more sessions to share additional feedback!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session.id)}
                      className={`w-full p-4 rounded-lg border transition-all ${
                        selectedSession === session.id
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
                          className={`${
                            star <= (hoverRating || rating)
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
