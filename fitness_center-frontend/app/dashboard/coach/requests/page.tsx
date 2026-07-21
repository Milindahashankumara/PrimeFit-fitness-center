"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { BookingsAPI } from "@/app/lib/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Check,
  X,
  MessageSquare,
  DollarSign,
  Video,
  AlertCircle,
  CheckCircle,
  Filter,
} from "lucide-react";

interface BookingRequest {
  _id: string;
  id?: string;
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  sessionType: "personal" | "group" | "online";
  duration: number;
  price: number;
  status: "pending" | "accepted" | "rejected" | "completed" | "rescheduled" | "pending_reschedule" | "cancelled";
  message?: string;
  requestedAt: string;
  rescheduledBy?: string;
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduleRequest?: {
    requestedDate: string;
    requestedTime: string;
    requestReason?: string;
    requestedAt?: string;
    requestedBy?: string;
  };
}

const toBookingStatus = (value: string): BookingRequest["status"] => {
  const allowedStatuses: BookingRequest["status"][] = [
    "pending",
    "accepted",
    "rejected",
    "completed",
    "rescheduled",
    "pending_reschedule",
    "cancelled",
  ];

  if (allowedStatuses.includes(value as BookingRequest["status"])) {
    return value as BookingRequest["status"];
  }

  return value as BookingRequest["status"];
};

const socketBaseUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const BookingRequestsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "all"
  >("pending");
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(
    null,
  );
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "reject">("accept");
  const [responseMessage, setResponseMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
    reason: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingRequest, setCancellingRequest] = useState<BookingRequest | null>(null);

  const loadBookings = useCallback(async () => {
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    if (!user) return;

    try {
      const allBookings = await BookingsAPI.getAll();

      const requests: BookingRequest[] = allBookings.map((booking) => ({
        _id: booking._id || booking.id || "",
        id: booking.id,
        clientName: booking.customerName || "Unknown Customer",
        clientEmail: booking.customerEmail || "",
        date: booking.date,
        time: booking.time,
        sessionType: booking.type,
        duration: booking.duration,
        price: booking.price,
        status: toBookingStatus(booking.status),
        message: booking.message,
        requestedAt: booking.requestedAt,
        originalDate: booking.originalDate,
        originalTime: booking.originalTime,
        rescheduleReason: booking.rescheduleReason,
        rescheduledBy: booking.rescheduledBy,
        cancellationReason: booking.cancellationReason,
        cancelledAt: booking.cancelledAt,
        rescheduleRequest: booking.rescheduleRequest,
      }));

      setBookingRequests(requests);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
  }, []);

  // Load bookings for this coach
  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 5000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;
    const coachId = user?._id || user?.id;
    if (!coachId) return;

    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.emit("register", coachId);
    socket.on("bookingCancelled", () => {
      loadBookings();
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadBookings]);

  const handleAction = (
    request: BookingRequest,
    action: "accept" | "reject",
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setShowActionModal(true);
  };

  const handleReschedule = (request: BookingRequest) => {
    setSelectedRequest(request);
    setRescheduleData({ date: request.date, time: request.time, reason: "" });
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedRequest) return;

    try {
      console.log("Rescheduling booking:", selectedRequest._id);

      await BookingsAPI.update(selectedRequest._id, {
        originalDate: selectedRequest.date,
        originalTime: selectedRequest.time,
        date: rescheduleData.date,
        time: rescheduleData.time,
        rescheduleReason: rescheduleData.reason,
        rescheduledBy: "coach",
        rescheduledAt: new Date().toISOString(),
        status: "rescheduled",
      });

      // Update local state
      setBookingRequests(
        bookingRequests.map((req) =>
          req._id === selectedRequest._id
            ? {
                ...req,
                originalDate: req.date,
                originalTime: req.time,
                date: rescheduleData.date,
                time: rescheduleData.time,
                rescheduleReason: rescheduleData.reason,
                rescheduledBy: "coach",
                status: "rescheduled",
              }
            : req,
        ),
      );

      setShowRescheduleModal(false);
      setSelectedRequest(null);
      setRescheduleData({ date: "", time: "", reason: "" });
      setSuccessMessage(
        "Session rescheduled successfully! Customer will be notified.",
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to reschedule booking:", error);
      alert("Failed to reschedule booking. Please try again.");
    }
  };

  const handleCompleteSession = async (request: BookingRequest) => {
    if (confirm(`Mark session with ${request.clientName} as completed?`)) {
      try {
        await BookingsAPI.update(request._id, {
          status: "completed",
        });

        setBookingRequests(
          bookingRequests.map((req) =>
            req._id === request._id ? { ...req, status: "completed" } : req,
          ),
        );

        setSuccessMessage(
          "Session marked as completed! Customer can now provide feedback.",
        );
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error("Failed to complete session:", error);
        alert("Failed to mark session as completed");
      }
    }
  };

  const handleCancelSession = (request: BookingRequest) => {
    setCancellingRequest(request);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleConfirmCancelSession = async () => {
    if (!cancellingRequest) return;
    try {
      await BookingsAPI.update(cancellingRequest._id, {
        status: "cancelled",
        cancelledBy: "coach",
        cancelledAt: new Date().toISOString(),
        ...(cancelReason ? { cancellationReason: cancelReason } : {}),
      });

      setBookingRequests(
        bookingRequests.map((req) =>
          req._id === cancellingRequest._id
            ? { ...req, status: "cancelled", cancellationReason: cancelReason || undefined }
            : req
        )
      );

      setShowCancelModal(false);
      setCancellingRequest(null);
      setCancelReason("");
      setSuccessMessage("Session cancelled. The customer will be notified by email.");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to cancel session:", error);
      alert("Failed to cancel session. Please try again.");
    }
  };

  const handleApproveReschedule = async (request: BookingRequest) => {
    if (!request.rescheduleRequest) return;

    try {
      await BookingsAPI.update(request._id, {
        status: "rescheduled",
        originalDate: request.date,
        originalTime: request.time,
        date: request.rescheduleRequest.requestedDate,
        time: request.rescheduleRequest.requestedTime,
        rescheduleReason: request.rescheduleRequest.requestReason,
        rescheduledBy: "customer",
        rescheduledAt: new Date().toISOString(),
        rescheduleRequest: null,
      });

      setBookingRequests(
        bookingRequests.map((req) =>
          req._id === request._id
            ? {
                ...req,
                status: "rescheduled",
                originalDate: req.date,
                originalTime: req.time,
                date: request.rescheduleRequest!.requestedDate,
                time: request.rescheduleRequest!.requestedTime,
                rescheduleReason: request.rescheduleRequest!.requestReason,
                rescheduledBy: "customer",
                rescheduleRequest: undefined,
              }
            : req,
        ),
      );

      setSuccessMessage("Reschedule request approved! Customer has been notified.");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to approve reschedule:", error);
      alert("Failed to approve reschedule request");
    }
  };

  const handleRejectReschedule = async (request: BookingRequest) => {
    if (confirm(`Reject reschedule request from ${request.clientName}?`)) {
      try {
        await BookingsAPI.update(request._id, {
          status: "accepted",
          rescheduleRequest: null,
        });

        setBookingRequests(
          bookingRequests.map((req) =>
            req._id === request._id
              ? { ...req, status: "accepted", rescheduleRequest: undefined }
              : req,
          ),
        );

        setSuccessMessage("Reschedule request rejected. Booking remains at original time.");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error("Failed to reject reschedule:", error);
        alert("Failed to reject reschedule request");
      }
    }
  };

  const handleConfirmAction = async () => {
    if (selectedRequest) {
      try {
        // Build update payload — include rejectionReason when rejecting
        const payload: Record<string, string> = {
          status: actionType === "accept" ? "accepted" : "rejected",
        };
        if (actionType === "reject" && responseMessage.trim()) {
          payload.rejectionReason = responseMessage.trim();
        }

        await BookingsAPI.update(selectedRequest._id, payload);

        // Update local state
        setBookingRequests(
          bookingRequests.map((req) =>
            req._id === selectedRequest._id
              ? {
                  ...req,
                  status: actionType === "accept" ? "accepted" : "rejected",
                }
              : req,
          ),
        );

        setShowActionModal(false);
        setSelectedRequest(null);
        setResponseMessage("");
        setSuccessMessage(
          actionType === "accept"
            ? "Booking accepted! The customer has been notified."
            : "Booking rejected. The customer will be notified by email.",
        );
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
      } catch (error) {
        console.error("Failed to update booking:", error);
        alert("Failed to update booking status");
      }
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === "all") return bookingRequests;
    if (activeTab === "pending") {
      return bookingRequests.filter((req) => req.status === "pending" || req.status === "pending_reschedule");
    }
    if (activeTab === "accepted") {
      return bookingRequests.filter((req) => req.status === "accepted" || req.status === "rescheduled");
    }
    if (activeTab === "cancelled") {
      return bookingRequests.filter((req) => req.status === "cancelled");
    }
    return bookingRequests.filter((req) => req.status === activeTab);
  };

  const filteredRequests = getFilteredRequests();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 bg-yellow-500/20";
      case "pending_reschedule":
        return "text-orange-400 bg-orange-500/20";
      case "accepted":
        return "text-green-400 bg-green-500/20";
      case "rejected":
        return "text-red-400 bg-red-500/20";
      case "completed":
        return "text-blue-400 bg-blue-500/20";
      case "rescheduled":
        return "text-purple-400 bg-purple-500/20";
      case "cancelled":
        return "text-gray-400 bg-gray-500/20 line-through";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "personal":
        return <User size={18} />;
      case "group":
        return <User size={18} />;
      case "online":
        return <Video size={18} />;
      default:
        return <User size={18} />;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "personal":
        return "bg-blue-500/20 text-blue-400";
      case "group":
        return "bg-purple-500/20 text-purple-400";
      case "online":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPendingCount = () =>
    bookingRequests.filter((r) => r.status === "pending" || r.status === "pending_reschedule").length;
  const getAcceptedCount = () =>
    bookingRequests.filter((r) => r.status === "accepted" || r.status === "rescheduled").length;
  const getRejectedCount = () =>
    bookingRequests.filter((r) => r.status === "rejected").length;
  const getCompletedCount = () =>
    bookingRequests.filter((r) => r.status === "completed").length;
  const getCancelledCount = () =>
    bookingRequests.filter((r) => r.status === "cancelled").length;

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
              <h1 className="text-2xl font-bold">Booking Requests</h1>
              <p className="text-sm text-gray-400">
                Review and respond to session requests
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-yellow-500" size={32} />
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                Action Needed
              </span>
            </div>
            <p className="text-3xl font-bold">{getPendingCount()}</p>
            <p className="text-sm text-gray-400">Pending Requests</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <p className="text-3xl font-bold">{getAcceptedCount()}</p>
            <p className="text-sm text-gray-400">Accepted</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <X className="text-red-500" size={32} />
            </div>
            <p className="text-3xl font-bold">{getRejectedCount()}</p>
            <p className="text-sm text-gray-400">Rejected</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-brand-red" size={32} />
            </div>
            <p className="text-3xl font-bold">
              LKR{" "}
              {bookingRequests
                .filter(
                  (r) => r.status === "accepted" || r.status === "completed",
                )
                .reduce((sum, r) => sum + r.price, 0)}
            </p>
            <p className="text-sm text-gray-400">Total Earnings</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 bg-brand-gray p-2 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-yellow-500 text-brand-dark"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <AlertCircle size={18} />
            Pending ({getPendingCount()})
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "accepted"
                ? "bg-green-500 text-brand-dark"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CheckCircle size={18} />
            Accepted ({getAcceptedCount()})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "rejected"
                ? "bg-red-500 text-brand-dark"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <X size={18} />
            Rejected ({getRejectedCount()})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-blue-500 text-brand-dark"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CheckCircle size={18} />
            Completed ({getCompletedCount()})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "cancelled"
                ? "bg-gray-500 text-brand-dark"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <X size={18} />
            Cancelled ({getCancelledCount()})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === "all"
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Filter size={18} />
            All Requests ({bookingRequests.length})
          </button>
        </div>

        {/* Booking Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
              <Calendar className="mx-auto mb-4 text-gray-600" size={64} />
              <h3 className="text-xl font-bold mb-2">
                No {activeTab !== "all" ? activeTab : ""} requests
              </h3>
              <p className="text-gray-400">
                {activeTab === "pending" &&
                  "You have no pending booking requests at the moment."}
                {activeTab === "accepted" &&
                  "You haven't accepted any bookings yet."}
                {activeTab === "rejected" &&
                  "You haven't rejected any bookings."}
                {activeTab === "completed" && "No completed sessions yet."}
                {activeTab === "cancelled" && "No cancelled sessions."}
                {activeTab === "all" && "No booking requests found."}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request._id}
                className="bg-brand-gray rounded-2xl p-6 border border-white/10"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Client Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center font-bold">
                            {request.clientName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "UK"}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">
                              {request.clientName || "Unknown Customer"}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {request.clientEmail || "No email"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg ${getStatusColor(request.status)}`}
                      >
                        <span className="text-sm font-semibold capitalize">
                          {request.status === "pending_reschedule" 
                            ? "Pending Reschedule" 
                            : request.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="bg-black/40 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Calendar size={16} />
                          <span className="text-xs">Date</span>
                        </div>
                        <p className="font-semibold">
                          {new Date(request.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="bg-black/40 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Clock size={16} />
                          <span className="text-xs">Time</span>
                        </div>
                        <p className="font-semibold">
                          {request.time} ({request.duration} min)
                        </p>
                      </div>

                      <div className="bg-black/40 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          {getSessionTypeIcon(request.sessionType)}
                          <span className="text-xs">Type</span>
                        </div>
                        <p
                          className={`font-semibold capitalize px-2 py-1 rounded ${getSessionTypeColor(request.sessionType)}`}
                        >
                          {request.sessionType}
                        </p>
                      </div>

                      <div className="bg-black/40 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <DollarSign size={16} />
                          <span className="text-xs">Price</span>
                        </div>
                        <p className="font-semibold text-brand-red">
                          LKR {request.price}
                        </p>
                      </div>
                    </div>

                    {/* Client Message */}
                    {request.message && (
                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="text-blue-400" size={16} />
                          <span className="text-xs text-blue-400 font-semibold">
                            Client Message
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {/* Reschedule Request Details */}
                    {request.status === "pending_reschedule" && request.rescheduleRequest && (
                      <div className="bg-orange-500/10 border border-orange-500/50 p-4 rounded-lg mb-3">
                        <p className="text-sm font-semibold text-orange-400 mb-3">
                          Requested Reschedule
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="text-gray-400">From:</span>{" "}
                            {new Date(request.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} at {request.time}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-400">To:</span>{" "}
                            <span className="text-green-400 font-semibold">
                              {new Date(request.rescheduleRequest.requestedDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })} at {request.rescheduleRequest.requestedTime}
                            </span>
                          </p>
                          {request.rescheduleRequest.requestReason && (
                            <p className="text-xs text-gray-300 italic mt-2 pt-2 border-t border-white/10">
                              Reason: {request.rescheduleRequest.requestReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rescheduled Info */}
                    {request.status === "rescheduled" && request.originalDate && request.originalTime && (
                      <div className="bg-blue-500/10 border border-blue-500/50 p-4 rounded-lg mb-3">
                        <p className="text-sm font-semibold text-blue-400 mb-2">
                          Rescheduled Session
                        </p>
                        <p className="text-xs text-gray-400 mb-1">Original time:</p>
                        <p className="text-sm font-semibold mb-2">
                          {new Date(request.originalDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })} at {request.originalTime}
                        </p>
                        {request.rescheduleReason && (
                          <p className="text-xs text-gray-300 italic mt-2 pt-2 border-t border-white/10">
                            Reason: {request.rescheduleReason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Cancellation Details */}
                    {request.status === "cancelled" && (
                      <div className="bg-gray-500/10 border border-gray-500/50 p-4 rounded-lg mb-3">
                        <p className="text-sm font-semibold text-gray-400 mb-2">
                          Cancelled Session
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">Customer:</span>{" "}
                          {request.clientName}
                        </p>
                        {request.cancelledAt && (
                          <p className="text-sm mt-1">
                            <span className="text-gray-400">Cancelled on:</span>{" "}
                            {new Date(request.cancelledAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {request.cancellationReason && (
                          <p className="text-xs text-gray-300 italic mt-2 pt-2 border-t border-white/10">
                            Reason: {request.cancellationReason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Request Time */}
                    <p className="text-xs text-gray-400">
                      Requested{" "}
                      {new Date(request.requestedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  {request.status === "pending" && (
                    <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                      <button
                        onClick={() => handleAction(request, "accept")}
                        className="flex-1 lg:flex-none bg-green-500 hover:bg-green-600 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReschedule(request)}
                        className="flex-1 lg:flex-none bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleAction(request, "reject")}
                        className="flex-1 lg:flex-none bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Reject
                      </button>
                    </div>
                  )}

                  {(request.status === "accepted" || request.status === "rescheduled") && (
                    <div className="flex flex-col gap-2 lg:min-w-[140px]">
                      <button
                        onClick={() => handleCompleteSession(request)}
                        className="bg-brand-red hover:bg-red-600 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Complete Session
                      </button>
                      <button
                        onClick={() => handleReschedule(request)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelSession(request)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Cancel Session
                      </button>
                    </div>
                  )}

                  {request.status === "pending_reschedule" && request.rescheduleRequest && (
                    <div className="flex flex-col gap-2 lg:min-w-[180px]">
                      <button
                        onClick={() => handleApproveReschedule(request)}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        Approve Reschedule
                      </button>
                      <button
                        onClick={() => handleRejectReschedule(request)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Reject Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">
              {actionType === "accept" ? "Accept" : "Reject"} Booking Request
            </h3>

            <div className="bg-black/40 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-400 mb-2">Client</p>
              <p className="font-bold mb-3">{selectedRequest.clientName}</p>

              <p className="text-sm text-gray-400 mb-2">Session Details</p>
              <p className="font-semibold">
                {new Date(selectedRequest.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {selectedRequest.time}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                {selectedRequest.duration} min • {selectedRequest.sessionType}{" "}
                session • LKR {selectedRequest.price}
              </p>
            </div>

            {actionType === "accept" ? (
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg mb-4">
                <p className="text-green-400 text-sm">
                  By accepting this request, you confirm that you are available
                  for this session. The client will be notified immediately.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Let the client know why you can't accept this booking..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none mb-4"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                  setResponseMessage("");
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  actionType === "accept"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Confirm {actionType === "accept" ? "Accept" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Reschedule Session</h3>

            <div className="bg-black/40 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-400 mb-2">Client</p>
              <p className="font-bold mb-3">{selectedRequest.clientName}</p>

              <p className="text-sm text-gray-400 mb-2">Current Schedule</p>
              <p className="font-semibold text-yellow-400">
                {new Date(selectedRequest.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {selectedRequest.time}
              </p>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      date: e.target.value,
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  New Time
                </label>
                <input
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      time: e.target.value,
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Reason for Rescheduling
                </label>
                <textarea
                  value={rescheduleData.reason}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Let the client know why you need to reschedule..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg mb-4">
              <p className="text-blue-400 text-sm">
                The customer will be notified about the new schedule and can
                accept or reject the change.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedRequest(null);
                  setRescheduleData({ date: "", time: "", reason: "" });
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!rescheduleData.date || !rescheduleData.time}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-colors"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Session Modal */}
      {showCancelModal && cancellingRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-2 text-red-400">Cancel Session</h3>
            <p className="text-gray-400 text-sm mb-4">
              You are about to cancel the session with{" "}
              <strong className="text-white">{cancellingRequest.clientName}</strong> on{" "}
              <strong className="text-white">
                {new Date(cancellingRequest.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>{" "}
              at <strong className="text-white">{cancellingRequest.time}</strong>.
            </p>

            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mb-4">
              <p className="text-red-400 text-sm">
                ⚠️ The customer will receive an email notification about this cancellation.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let the customer know why you are cancelling..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingRequest(null);
                  setCancelReason("");
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancelSession}
                className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRequestsPage;
