"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Announcement,
  AnnouncementsAPI,
  AuthAPI,
  Booking,
  BookingsAPI,
  FeedbackAPI,
} from "@/app/lib/api";
import {
  Users,
  Calendar,
  DollarSign,
  LogOut,
  Clock,
  Star,
  Settings,
  ClipboardList,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface UserData {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  specializations?: string[];
  rating?: number;
  activeClients?: number;
  coachStatus?: string;
  isAuthenticated: boolean;
}

interface DashboardStats {
  activeClients: number;
  sessionsThisWeek: number;
  revenueThisMonth: number;
  revenueChangePercent: number;
  averageRating: number;
  ratingCount: number;
}

const socketBaseUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const getWeekStart = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getMonthStart = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getPreviousMonthStart = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const CoachDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    activeClients: 0,
    sessionsThisWeek: 0,
    revenueThisMonth: 0,
    revenueChangePercent: 0,
    averageRating: 0,
    ratingCount: 0,
  });

  const loadCoachPerformanceData = useCallback(async (coachId: string) => {
    try {
      setLoadingBookings(true);

      const [allBookings, feedback] = await Promise.all([
        BookingsAPI.getByCoach(coachId),
        FeedbackAPI.getByCoach(coachId),
      ]);

      const cancelled = allBookings
        .filter((booking) => booking.status === "cancelled")
        .sort((a, b) => {
          const dateA = a.cancelledAt ? new Date(a.cancelledAt).getTime() : 0;
          const dateB = b.cancelledAt ? new Date(b.cancelledAt).getTime() : 0;
          return dateB - dateA;
        });

      const today = new Date().toISOString().split("T")[0];
      const todaysBookings = allBookings
        .filter((booking) => {
          const bookingDate = new Date(booking.date)
            .toISOString()
            .split("T")[0];
          return (
            bookingDate === today &&
            (booking.status === "accepted" || booking.status === "rescheduled")
          );
        })
        .sort((a, b) => {
          const timeA = a.time || "00:00";
          const timeB = b.time || "00:00";
          return timeA.localeCompare(timeB);
        });

      const now = new Date();
      const weekStart = getWeekStart(now);
      const monthStart = getMonthStart(now);
      const previousMonthStart = getPreviousMonthStart(now);

      const activeStatuses = new Set([
        "accepted",
        "completed",
        "rescheduled",
        "pending",
      ]);

      const activeClientKeys = new Set(
        allBookings
          .filter((booking) => activeStatuses.has(booking.status))
          .map(
            (booking) =>
              booking.customerEmail ||
              booking.customerId ||
              booking.customerName,
          )
          .filter(Boolean),
      );

      const sessionsThisWeek = allBookings.filter((booking) => {
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);
        return (
          bookingDate >= weekStart &&
          bookingDate <= now &&
          activeStatuses.has(booking.status)
        );
      }).length;

      const revenueThisMonth = allBookings
        .filter((booking) => {
          const bookingDate = new Date(booking.date);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate >= monthStart && booking.status === "completed";
        })
        .reduce((total, booking) => total + (Number(booking.price) || 0), 0);

      const revenuePreviousMonth = allBookings
        .filter((booking) => {
          const bookingDate = new Date(booking.date);
          bookingDate.setHours(0, 0, 0, 0);
          return (
            bookingDate >= previousMonthStart &&
            bookingDate < monthStart &&
            booking.status === "completed"
          );
        })
        .reduce((total, booking) => total + (Number(booking.price) || 0), 0);

      const revenueChangePercent =
        revenuePreviousMonth > 0
          ? ((revenueThisMonth - revenuePreviousMonth) / revenuePreviousMonth) *
            100
          : revenueThisMonth > 0
            ? 100
            : 0;

      const approvedRatings = feedback
        .filter((item) => item.status === "approved")
        .map((item) => Number(item.rating) || 0)
        .filter((rating) => rating > 0);

      const averageRating =
        approvedRatings.length > 0
          ? approvedRatings.reduce((sum, rating) => sum + rating, 0) /
            approvedRatings.length
          : Number(user?.rating) || 0;

      const fallbackActiveClients = Number(user?.activeClients) || 0;
      const fallbackAverageRating = Number(user?.rating) || 0;

      setTodayBookings(todaysBookings);
      setCancelledBookings(cancelled);
      setDashboardStats({
        activeClients: Math.max(activeClientKeys.size, fallbackActiveClients),
        sessionsThisWeek,
        revenueThisMonth,
        revenueChangePercent,
        averageRating: averageRating || fallbackAverageRating,
        ratingCount: approvedRatings.length,
      });
    } catch {
      setTodayBookings([]);
      setCancelledBookings([]);
    }
    setLoadingBookings(false);
  }, [user?.activeClients, user?.rating]);

  const socketRef = useRef<Socket | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/auth/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "coach") {
        router.push("/auth/login");
        return;
      }

      const currentUser = await AuthAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } else {
        setUser(parsedUser);
      }
      setLoading(false);
    } catch {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    }
  }, [router]);

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      const data = await AnnouncementsAPI.getAll({
        targetAudience: "coaches",
        status: "published",
      });
      setAnnouncements(data);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadAnnouncements();
  }, [loadAnnouncements, loadUserData]);

  useEffect(() => {
    if (!user?._id && !user?.id) {
      return;
    }

    const coachId = user._id || user.id || "";
    loadCoachPerformanceData(coachId);
  }, [user, loadCoachPerformanceData]);

  useEffect(() => {
    const coachId = user?._id || user?.id;
    if (!coachId) return;

    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.emit("register", coachId);
    socket.on("bookingCancelled", () => {
      loadCoachPerformanceData(coachId);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, loadCoachPerformanceData]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="bg-brand-gray border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Prime<span className="text-brand-red">Fit</span>{" "}
            <span className="text-sm text-gray-400">Coach Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-400">Coach</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-brand-red hover:bg-red-700 p-2 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Coach <span className="text-brand-red">{user?.name}</span>
          </h1>
          <p className="text-gray-400">
            Manage your clients and track their progress
          </p>
        </div>

        <div className="bg-brand-gray p-6 rounded-xl mb-8">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <ClipboardList className="text-brand-red" />
            Coach Announcements
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Announcements targeted to coaches and all users will appear here.
          </p>
          <div className="space-y-3">
            {announcementsLoading ? (
              <div className="bg-black/40 p-4 rounded-lg text-sm text-gray-400">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-black/40 p-4 rounded-lg text-sm text-gray-400">
                No coach announcements right now.
              </div>
            ) : (
              announcements.slice(0, 3).map((announcement) => (
                <div
                  key={
                    announcement._id || announcement.id || announcement.title
                  }
                  className="bg-black/40 p-4 rounded-lg border-l-4 border-brand-red"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold line-clamp-1">
                      {announcement.title}
                    </h3>
                    <span className="text-xs bg-brand-red/20 text-brand-red px-2 py-1 rounded capitalize whitespace-nowrap">
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {announcement.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="mb-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/coach/profile"
            className="bg-linear-to-br from-brand-red to-red-900 p-6 rounded-xl hover:shadow-xl hover:shadow-brand-red/20 transition-all group"
          >
            <Settings
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">My Profile</h3>
            <p className="text-white/80 text-sm">Update professional details</p>
          </Link>

          <Link
            href="/dashboard/coach/availability"
            className="bg-linear-to-br from-blue-600 to-blue-800 p-6 rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all group"
          >
            <Clock
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Availability</h3>
            <p className="text-white/80 text-sm">Manage your schedule</p>
          </Link>

          <Link
            href="/dashboard/coach/requests"
            className="bg-linear-to-br from-yellow-600 to-yellow-800 p-6 rounded-xl hover:shadow-xl hover:shadow-yellow-500/20 transition-all group relative"
          >
            <AlertCircle
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Requests</h3>
            <p className="text-white/80 text-sm">Review booking requests</p>
            <div className="absolute top-4 right-4 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
          </Link>

          <Link
            href="/dashboard/coach/clients"
            className="bg-linear-to-br from-purple-600 to-purple-800 p-6 rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition-all group"
          >
            <Users
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">My Clients</h3>
            <p className="text-white/80 text-sm">View and manage clients</p>
          </Link>

          <Link
            href="/dashboard/coach/communication"
            className="bg-linear-to-br from-cyan-600 to-blue-700 p-6 rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all group"
          >
            <MessageSquare
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Communication Center</h3>
            <p className="text-white/80 text-sm">Chat with clients and admins</p>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-brand-red" size={32} />
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                Live
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {dashboardStats.activeClients}
            </h3>
            <p className="text-gray-400 text-sm">Active Clients</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-blue-500" size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {dashboardStats.sessionsThisWeek}
            </h3>
            <p className="text-gray-400 text-sm">Sessions This Week</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-yellow-500" size={32} />
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                {dashboardStats.revenueChangePercent >= 0 ? "+" : ""}
                {dashboardStats.revenueChangePercent.toFixed(0)}%
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              LKR {dashboardStats.revenueThisMonth.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Monthly Earnings</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <Star className="text-purple-500" size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {dashboardStats.averageRating > 0
                ? dashboardStats.averageRating.toFixed(1)
                : "0.0"}
            </h3>
            <p className="text-gray-400 text-sm">Average Rating</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-brand-red" />
              Today&apos;s Schedule
            </h2>
            <div className="space-y-3">
              {loadingBookings ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="mx-auto mb-2 animate-spin" size={32} />
                  <p>Loading schedule...</p>
                </div>
              ) : todayBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto mb-3 text-gray-500" size={48} />
                  <p className="text-gray-400">
                    No sessions scheduled for today
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Enjoy your day off!
                  </p>
                </div>
              ) : (
                <>
                  {todayBookings.slice(0, 3).map((booking, index) => {
                    const colors = [
                      "border-brand-red bg-brand-red",
                      "border-blue-500 bg-blue-500",
                      "border-green-500 bg-green-500",
                      "border-purple-500 bg-purple-500",
                      "border-yellow-500 bg-yellow-500",
                    ];
                    const color = colors[index % colors.length];

                    return (
                      <div
                        key={booking._id || index}
                        className={`bg-black/40 p-4 rounded-lg border-l-4 ${color.split(" ")[0]}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold">
                              {booking.customerName || "Unknown Client"}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {booking.sessionType || booking.type}
                            </p>
                            {booking.status === "rescheduled" && (
                              <p className="text-xs text-yellow-400 mt-1">
                                Rescheduled
                              </p>
                            )}
                          </div>
                          <span
                            className={`${color.split(" ")[1]} px-2 py-1 rounded text-xs font-semibold`}
                          >
                            {booking.time || "TBD"}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {todayBookings.length > 3 && (
                    <p className="text-center text-sm text-gray-400 pt-2">
                      +{todayBookings.length - 3} more session
                      {todayBookings.length - 3 > 1 ? "s" : ""}
                    </p>
                  )}
                </>
              )}

              <Link
                href="/dashboard/coach/requests"
                className="block w-full bg-brand-red hover:bg-red-700 py-3 rounded-lg font-bold text-center transition-colors"
              >
                View Full Schedule
              </Link>
            </div>
          </div>

          {/* Cancelled Sessions */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="text-gray-400" />
              Cancelled Sessions
            </h2>
            <div className="space-y-3">
              {loadingBookings ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="mx-auto mb-2 animate-spin" size={32} />
                  <p>Loading cancelled sessions...</p>
                </div>
              ) : cancelledBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto mb-3 text-gray-500" size={48} />
                  <p className="text-gray-400">No cancelled sessions</p>
                </div>
              ) : (
                <>
                  {cancelledBookings.slice(0, 5).map((booking, index) => (
                    <div
                      key={booking._id || index}
                      className="bg-black/40 p-4 rounded-lg border-l-4 border-gray-500"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold">
                            {booking.customerName || "Unknown Client"}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {new Date(booking.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            at {booking.time || "TBD"}
                          </p>
                          {booking.cancelledAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Cancelled{" "}
                              {new Date(booking.cancelledAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                          {booking.cancellationReason && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              Reason: {booking.cancellationReason}
                            </p>
                          )}
                        </div>
                        <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs font-semibold capitalize">
                          cancelled
                        </span>
                      </div>
                    </div>
                  ))}

                  {cancelledBookings.length > 5 && (
                    <p className="text-center text-sm text-gray-400 pt-2">
                      +{cancelledBookings.length - 5} more cancelled session
                      {cancelledBookings.length - 5 > 1 ? "s" : ""}
                    </p>
                  )}
                </>
              )}

              <Link
                href="/dashboard/coach/requests"
                className="block w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-bold text-center transition-colors"
              >
                View All Cancelled Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
