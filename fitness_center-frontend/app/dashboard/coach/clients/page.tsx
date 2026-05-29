"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Search, Users, Mail, CheckCircle2, TrendingUp, Star } from "lucide-react";
import { BookingsAPI, Booking } from "@/app/lib/api";

type ClientSummary = {
  key: string;
  name: string;
  email: string;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  lastSession?: Booking;
  nextSession?: Booking;
  lastSessionLabel: string;
  nextSessionLabel: string;
  status: "active" | "upcoming" | "past";
};

type CoachUser = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
};

const getCustomerKey = (booking: Booking & Record<string, any>): string => {
  const populatedCustomer = booking.customerId as unknown as { _id?: string; name?: string; email?: string } | undefined;
  return (
    populatedCustomer?._id ||
    booking.customerId ||
    booking.customerEmail ||
    booking.customerName ||
    "unknown-client"
  );
};

const getCustomerName = (booking: Booking & Record<string, any>): string => {
  const populatedCustomer = booking.customerId as unknown as { name?: string } | undefined;
  return booking.customerName || populatedCustomer?.name || "Unknown Customer";
};

const getCustomerEmail = (booking: Booking & Record<string, any>): string => {
  const populatedCustomer = booking.customerId as unknown as { email?: string } | undefined;
  return booking.customerEmail || populatedCustomer?.email || "No email available";
};

const formatDateLabel = (value?: string): string => {
  if (!value) return "Date not set";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "C";

const buildLastSessionLabel = (booking: Booking): string => {
  const parts = [formatDateLabel(booking.date), booking.time].filter(Boolean);
  return parts.join(" • ");
};

const buildNextSessionLabel = (booking: Booking): string => {
  const parts = [formatDateLabel(booking.date), booking.time].filter(Boolean);
  return parts.join(" • ");
};

const CoachClientsPage = () => {
  const router = useRouter();
  const [coach, setCoach] = useState<CoachUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadCoach = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/auth/login");
        return;
      }

      const parsedUser = JSON.parse(storedUser) as CoachUser;
      if (parsedUser.role !== "coach") {
        router.push("/auth/login");
        return;
      }

      setCoach(parsedUser);
      setLoading(false);
    };

    loadCoach();
  }, [router]);

  useEffect(() => {
    if (!coach) return;

    const loadClients = async () => {
      try {
        setClientsLoading(true);
        const coachId = coach._id || coach.id || "";
        const coachBookings = await BookingsAPI.getByCoach(coachId);
        setBookings(coachBookings);
      } catch (error) {
        console.error("Failed to load coach clients:", error);
        setBookings([]);
      } finally {
        setClientsLoading(false);
      }
    };

    loadClients();
  }, [coach]);

  const clientSummaries = useMemo<ClientSummary[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grouped = new Map<string, Booking[]>();

    bookings.forEach((booking) => {
      const key = getCustomerKey(booking as Booking & Record<string, any>);
      const existing = grouped.get(key) || [];
      existing.push(booking);
      grouped.set(key, existing);
    });

    return Array.from(grouped.entries()).map(([key, customerBookings]) => {
      const sortedByDate = [...customerBookings].sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
        const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return timeB - timeA;
      });

      const futureBookings = customerBookings
        .filter((booking) => {
          const bookingDate = new Date(booking.date);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate >= today && booking.status !== "rejected" && booking.status !== "cancelled";
        })
        .sort((a, b) => {
          const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
          const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
          return timeA - timeB;
        });

      const completedSessions = customerBookings.filter((booking) => booking.status === "completed").length;
      const upcomingSessions = customerBookings.filter((booking) => {
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= today && ["pending", "accepted", "rescheduled"].includes(booking.status);
      }).length;

      const lastSession = sortedByDate[0];
      const nextSession = futureBookings[0];

      const latestDate = lastSession ? new Date(lastSession.date) : null;
      const status: ClientSummary["status"] = nextSession
        ? "upcoming"
        : latestDate && latestDate < today
          ? "past"
          : "active";

      return {
        key,
        name: getCustomerName(customerBookings[0] as Booking & Record<string, any>),
        email: getCustomerEmail(customerBookings[0] as Booking & Record<string, any>),
        totalSessions: customerBookings.length,
        completedSessions,
        upcomingSessions,
        lastSession,
        nextSession,
        lastSessionLabel: lastSession ? buildLastSessionLabel(lastSession) : "No past session",
        nextSessionLabel: nextSession ? buildNextSessionLabel(nextSession) : "No upcoming session",
        status,
      };
    });
  }, [bookings]);

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return clientSummaries;

    return clientSummaries.filter((client) => {
      return (
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
      );
    });
  }, [clientSummaries, searchTerm]);

  const stats = useMemo(() => {
    const activeClients = clientSummaries.filter((client) => client.upcomingSessions > 0).length;
    const upcomingSessions = clientSummaries.reduce((total, client) => total + client.upcomingSessions, 0);
    const completedSessions = clientSummaries.reduce((total, client) => total + client.completedSessions, 0);

    return {
      totalClients: clientSummaries.length,
      activeClients,
      upcomingSessions,
      completedSessions,
    };
  }, [clientSummaries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/dashboard/coach"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2">My Clients</h1>
            <p className="text-gray-400">
              Live customer data pulled from your booked and completed sessions.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-brand-gray px-4 py-3 rounded-xl border border-white/10">
            <Users className="text-brand-red" />
            <div>
              <p className="text-sm text-gray-400">Coach</p>
              <p className="font-semibold">{coach?.name}</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-brand-gray p-5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Total Clients</p>
            <h3 className="text-3xl font-bold">{stats.totalClients}</h3>
          </div>
          <div className="bg-brand-gray p-5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Active Clients</p>
            <h3 className="text-3xl font-bold text-green-400">{stats.activeClients}</h3>
          </div>
          <div className="bg-brand-gray p-5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Upcoming Sessions</p>
            <h3 className="text-3xl font-bold text-blue-400">{stats.upcomingSessions}</h3>
          </div>
          <div className="bg-brand-gray p-5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Completed Sessions</p>
            <h3 className="text-3xl font-bold text-yellow-400">{stats.completedSessions}</h3>
          </div>
        </div>

        <div className="bg-brand-gray p-5 rounded-xl border border-white/10 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <Users className="text-brand-red" />
                Customer roster
              </h2>
              <p className="text-sm text-gray-400">
                Each card summarizes a real customer from your booking history.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by customer name or email"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-brand-red"
              />
            </div>
          </div>
        </div>

        {clientsLoading ? (
          <div className="bg-brand-gray p-10 rounded-xl border border-white/10 text-center text-gray-400">
            Loading customer records...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-brand-gray p-10 rounded-xl border border-white/10 text-center">
            <Users className="mx-auto mb-3 text-gray-500" size={48} />
            <h3 className="text-xl font-semibold mb-2">No clients found</h3>
            <p className="text-gray-400 mb-6">
              You do not have any booked customers yet, or no customer matches your search.
            </p>
            <Link
              href="/dashboard/coach/requests"
              className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 px-5 py-3 rounded-lg font-semibold transition-colors"
            >
              <Calendar size={18} />
              View booking requests
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredClients.map((client) => (
              <div key={client.key} className="bg-brand-gray rounded-2xl border border-white/10 p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-full bg-linear-to-br from-brand-red to-orange-500 flex items-center justify-center font-bold text-lg shrink-0">
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold truncate">{client.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <Mail size={14} />
                        <span className="truncate">{client.email}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${client.status === "active" ? "bg-green-500/20 text-green-400" : client.status === "upcoming" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-300"}`}>
                    {client.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Sessions</p>
                    <p className="text-2xl font-bold">{client.totalSessions}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-400">{client.completedSessions}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Upcoming</p>
                    <p className="text-2xl font-bold text-blue-400">{client.upcomingSessions}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between gap-4 bg-black/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="text-brand-red shrink-0" size={18} />
                      <div>
                        <p className="text-xs text-gray-400">Last session</p>
                        <p className="font-medium">{client.lastSessionLabel}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{client.lastSession?.status || "n/a"}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 bg-black/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Calendar className="text-brand-red shrink-0" size={18} />
                      <div>
                        <p className="text-xs text-gray-400">Next session</p>
                        <p className="font-medium">{client.nextSessionLabel}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{client.nextSession?.status || "n/a"}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/dashboard/coach/requests"
                    className="inline-flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <CheckCircle2 size={18} />
                    Open requests
                  </Link>
                  <div className="inline-flex items-center justify-center gap-2 bg-white/5 px-4 py-3 rounded-lg text-sm text-gray-300">
                    <Star size={16} className="text-yellow-400" />
                    Real booking data
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachClientsPage;