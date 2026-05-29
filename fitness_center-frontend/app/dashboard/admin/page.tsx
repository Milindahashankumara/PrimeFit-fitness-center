"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  DollarSign,
  Activity,
  Settings,
  LogOut,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Shield,
  BarChart,
  FileText,
  Calendar,
  Megaphone,
  Folder,
  Clock,
  ArrowRight,
  Star,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { SubscriptionAPI, SubscriptionOverview } from "@/app/lib/api";

interface UserData {
  name: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
}

const AdminDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/auth/login");
      return;
    }

    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await SubscriptionAPI.getAdminOverview();
        setOverview(data);
      } finally {
        setOverviewLoading(false);
      }
    };

    if (!loading && user?.role === "admin") {
      loadOverview();
    }
  }, [loading, user]);

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

  const totals = overview?.totals;
  const totalMembers = totals?.totalMembers ?? totals?.totalCustomers ?? 0;
  const activeCoaches = totals?.activeCoaches ?? 0;
  const monthlyRevenue = totals?.monthlyRevenue ?? 0;
  const sessionsThisMonth = totals?.sessionsThisMonth ?? 0;

  const formatRevenue = (value: number) => {
    if (value >= 1000000) return `LKR ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `LKR ${(value / 1000).toFixed(1)}K`;
    return `LKR ${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="bg-brand-gray border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Prime<span className="text-brand-red">Fit</span>{" "}
            <span className="text-sm text-gray-400">Admin Panel</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-400">Administrator</p>
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
            Admin <span className="text-brand-red">Dashboard</span>
          </h1>
          <p className="text-gray-400">
            Monitor and manage your fitness center
          </p>
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
              {overviewLoading ? "—" : totalMembers.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Total Members</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <UserCheck className="text-blue-500" size={32} />
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                Approved
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {overviewLoading ? "—" : activeCoaches.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Active Coaches</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-yellow-500" size={32} />
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                This Month
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {overviewLoading ? "—" : formatRevenue(monthlyRevenue)}
            </h3>
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <Activity className="text-purple-500" size={32} />
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                Booked
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {overviewLoading ? "—" : sessionsThisMonth.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Sessions This Month</p>
          </div>
        </div>

        {/* Admin Alerts */}
        <div className="mb-8 space-y-4">
          {/* Pending Coaches Alert */}
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-500" size={24} />
              <div>
                <p className="font-semibold text-yellow-400">
                  3 coach applications awaiting review
                </p>
                <p className="text-sm text-yellow-400/80">
                  Review and approve new coach registrations
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/admin/coaches"
              className="bg-yellow-500 hover:bg-yellow-600 text-brand-dark px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              Review Now
            </Link>
          </div>

          {/* Pending Complaints Alert */}
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={24} />
              <div>
                <p className="font-semibold text-red-400">
                  New customer complaints require attention
                </p>
                <p className="text-sm text-red-400/80">
                  Review and respond to customer feedback
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/admin/complaints"
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              View Complaints
            </Link>
          </div>
        </div>

        {/* Quick Actions - Grid Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="text-brand-red" />
            Admin Tools
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-6">
            <Link
              href="/dashboard/admin/coaches"
              className="group relative bg-brand-gray rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all hover:scale-105"
            >
              <span className="absolute -top-2 -right-2 bg-brand-red text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                3
              </span>
              <div className="w-14 h-14 bg-linear-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">Coach Applications</h3>
              <p className="text-sm text-gray-400 mb-4">
                Review and approve registrations
              </p>
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Manage Coaches</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link
              href="/dashboard/admin/feedback"
              className="group relative bg-brand-gray rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all hover:scale-105"
            >
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-brand-dark text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                3
              </span>
              <div className="w-14 h-14 bg-linear-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">Customer Feedback</h3>
              <p className="text-sm text-gray-400 mb-4">
                Moderate and approve reviews
              </p>
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Manage Feedback</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link
              href="/dashboard/admin/complaints"
              className="group relative bg-brand-gray rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all hover:scale-105"
            >
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                !
              </span>
              <div className="w-14 h-14 bg-linear-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <AlertCircle className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">Complaints</h3>
              <p className="text-sm text-gray-400 mb-4">
                Address customer concerns
              </p>
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm group-hover:gap-3 transition-all">
                <span>View Complaints</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link
              href="/dashboard/admin/announcements"
              className="group bg-brand-gray rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all hover:scale-105"
            >
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">Announcements</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create and publish updates
              </p>
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Manage Announcements</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link
              href="/dashboard/admin/resources"
              className="group bg-brand-gray rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all hover:scale-105"
            >
              <div className="w-14 h-14 bg-linear-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Folder className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">Fitness Resources</h3>
              <p className="text-sm text-gray-400 mb-4">
                Manage and share fitness-related content
              </p>
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Manage Resources</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link
              href="/dashboard/admin/subscriptions"
              className="group bg-brand-gray rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all hover:scale-105"
            >
              <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CircleDollarSign className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">Subscriptions</h3>
              <p className="text-sm text-gray-400 mb-4">
                Manage plans, bills, and payment updates
              </p>
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Open Subscription Admin</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <div className="group bg-brand-gray rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all hover:scale-105 cursor-pointer">
              <div className="w-14 h-14 bg-linear-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Settings className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">System Settings</h3>
              <p className="text-sm text-gray-400 mb-4">
                Configure preferences
              </p>
              <div className="flex items-center gap-2 text-brand-red font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Manage Settings</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Traditional Quick Actions */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Shield className="text-brand-red" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full bg-brand-red hover:bg-red-700 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <Users size={18} />
                Add New Member
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <UserCheck size={18} />
                Add New Coach
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <Calendar size={18} />
                Manage Schedule
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <FileText size={18} />
                Generate Report
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-brand-gray p-6 rounded-xl md:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Activity className="text-brand-red" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              <div className="bg-black/40 p-4 rounded-lg flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">New Member Registration</h3>
                  <p className="text-sm text-gray-400">
                    Jessica Martinez joined Premium Plan
                  </p>
                  <span className="text-xs text-gray-500">5 minutes ago</span>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <DollarSign size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Payment Received</h3>
                  <p className="text-sm text-gray-400">
                    LKR 299 from John Smith - Annual Membership
                  </p>
                  <span className="text-xs text-gray-500">15 minutes ago</span>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shrink-0">
                  <UserCheck size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Coach Application</h3>
                  <p className="text-sm text-gray-400">
                    New coach application from Mike Johnson
                  </p>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Class Scheduled</h3>
                  <p className="text-sm text-gray-400">
                    Yoga class added for Wednesday 6:00 PM
                  </p>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Membership Overview */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart className="text-brand-red" />
              Membership Overview
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Premium Members</span>
                  <span className="text-sm font-semibold">542 (43%)</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div
                    className="bg-brand-red h-3 rounded-full"
                    style={{ width: "43%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Standard Members</span>
                  <span className="text-sm font-semibold">485 (39%)</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: "39%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Basic Members</span>
                  <span className="text-sm font-semibold">220 (18%)</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: "18%" }}
                  ></div>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg mt-6">
                <h3 className="font-semibold mb-2">Membership Trends</h3>
                <p className="text-sm text-gray-400 mb-3">
                  +187 new members this month
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-500/20 rounded p-2">
                    <p className="text-xs text-gray-400">New</p>
                    <p className="font-bold text-green-400">187</p>
                  </div>
                  <div className="bg-yellow-500/20 rounded p-2">
                    <p className="text-xs text-gray-400">Renewed</p>
                    <p className="font-bold text-yellow-400">124</p>
                  </div>
                  <div className="bg-red-500/20 rounded p-2">
                    <p className="text-xs text-gray-400">Expired</p>
                    <p className="font-bold text-red-400">42</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="text-brand-red" />
              System Alerts
            </h2>
            <div className="space-y-3">
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-400">
                      Equipment Maintenance
                    </h3>
                    <p className="text-sm text-gray-400">
                      5 machines require immediate maintenance
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-500 shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-yellow-400">
                      Expiring Memberships
                    </h3>
                    <p className="text-sm text-gray-400">
                      48 memberships expiring this week
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-blue-500 shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-blue-400">
                      Staff Schedule
                    </h3>
                    <p className="text-sm text-gray-400">
                      3 coaching slots need to be filled next week
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Activity className="text-green-500 shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-green-400">
                      System Health
                    </h3>
                    <p className="text-sm text-gray-400">
                      All systems operational
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-black/40 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Revenue Target</h3>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Monthly Goal</span>
                <span className="text-sm font-semibold">
                  LKR 84.5K / LKR 100K
                </span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-3">
                <div
                  className="bg-linear-to-r from-brand-red to-yellow-500 h-3 rounded-full"
                  style={{ width: "84.5%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
