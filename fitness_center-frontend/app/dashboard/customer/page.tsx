"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dumbbell,
  Calendar,
  Folder,
  User,
  LogOut,
  Clock,
  Target,
  Award,
  Activity,
  Users,
  CheckCircle,
  Search,
  MessageSquare,
  Mail,
  Star,
  Settings,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import {
  Announcement,
  AnnouncementsAPI,
  ResourceItem,
  ResourcesAPI,
} from "@/app/lib/api";

interface UserData {
  name: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
}

const getResourceUrl = (resource: ResourceItem): string | null => {
  if (resource.type === "link") {
    return resource.linkUrl || null;
  }

  if (resource.type === "video") {
    return resource.videoUrl || resource.linkUrl || null;
  }

  return resource.fileUrl || resource.imageUrl || resource.videoUrl || null;
};

const getCategoryLabel = (category: string): string => {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const CustomerDashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "customer") {
      router.push("/auth/login");
      return;
    }

    setUser(parsedUser);
    setLoading(false);

    if (searchParams.get("bookingSuccess") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [router, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      try {
        const data = await ResourcesAPI.getAll();
        if (!isMounted) return;

        const latestResources = data
          .filter(
            (resource) =>
              resource.isPublic !== false && resource.status !== "archived",
          )
          .sort((a, b) => {
            const aSource = a.uploadDate || a.createdAt || a.updatedAt;
            const bSource = b.uploadDate || b.createdAt || b.updatedAt;
            const aTime = aSource ? new Date(aSource).getTime() : 0;
            const bTime = bSource ? new Date(bSource).getTime() : 0;
            return bTime - aTime;
          })
          .slice(0, 3);

        setResources(latestResources);
      } finally {
        if (isMounted) {
          setResourcesLoading(false);
        }
      }
    };

    loadResources();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      try {
        const data = await AnnouncementsAPI.getAll({
          targetAudience: "customers",
          status: "published",
        });
        if (!isMounted) return;

        setAnnouncements(data);
      } finally {
        if (isMounted) {
          setAnnouncementsLoading(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

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
      <header className="bg-brand-gray border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Prime<span className="text-brand-red">Fit</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-400">Customer</p>
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
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="font-semibold text-green-400">
                Session Booked Successfully!
              </p>
              <p className="text-sm text-gray-300">
                Your training session has been confirmed.
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="text-brand-red">{user?.name}!</span>
          </h1>
          <p className="text-gray-400">
            Let&apos;s crush your fitness goals today.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Megaphone className="text-brand-red" />
              Announcements for You
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Latest updates shared for customers.
            </p>
            <div className="space-y-3">
              {announcementsLoading ? (
                <div className="bg-black/40 p-4 rounded-lg text-sm text-gray-400">
                  Loading announcements...
                </div>
              ) : announcements.length === 0 ? (
                <div className="bg-black/40 p-4 rounded-lg text-sm text-gray-400">
                  No customer announcements right now.
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
        </div>

        <div className="mb-8 grid md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Link
            href="/dashboard/customer/coaches"
            className="bg-linear-to-br from-brand-red to-red-900 p-6 rounded-xl hover:shadow-xl hover:shadow-brand-red/20 transition-all group"
          >
            <Users
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Find a Coach</h3>
            <p className="text-white/80 text-sm">
              Browse expert trainers and book sessions
            </p>
          </Link>

          <Link
            href="/dashboard/customer/bookings"
            className="bg-linear-to-br from-blue-600 to-blue-800 p-6 rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all group"
          >
            <Calendar
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">My Bookings</h3>
            <p className="text-white/80 text-sm">
              View and manage your scheduled sessions
            </p>
          </Link>

          <Link
            href="/dashboard/customer/feedback"
            className="bg-linear-to-br from-yellow-600 to-yellow-800 p-6 rounded-xl hover:shadow-xl hover:shadow-yellow-500/20 transition-all group"
          >
            <Star
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Feedback</h3>
            <p className="text-white/80 text-sm">
              Rate your sessions and coaches
            </p>
          </Link>

          <Link
            href="/dashboard/customer/profile"
            className="bg-linear-to-br from-purple-600 to-purple-800 p-6 rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition-all group"
          >
            <Settings
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">My Profile</h3>
            <p className="text-white/80 text-sm">
              Manage your account and preferences
            </p>
          </Link>

          <Link
            href="/dashboard/customer/subscriptions"
            className="bg-linear-to-br from-brand-red to-orange-700 p-6 rounded-xl hover:shadow-xl hover:shadow-orange-500/20 transition-all group"
          >
            <ShieldCheck
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Subscriptions</h3>
            <p className="text-white/80 text-sm">
              Activate a plan and manage bills
            </p>
          </Link>

          <Link
            href="/dashboard/customer/messages"
            className="bg-linear-to-br from-cyan-600 to-blue-700 p-6 rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all group"
          >
            <Mail
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Messages & Emails</h3>
            <p className="text-white/80 text-sm">Communication with others</p>
          </Link>

          <Link
            href="/dashboard/customer/complaints"
            className="bg-linear-to-br from-orange-600 to-orange-800 p-6 rounded-xl hover:shadow-xl hover:shadow-orange-500/20 transition-all group"
          >
            <MessageSquare
              className="text-white mb-3 group-hover:scale-110 transition-transform"
              size={32}
            />
            <h3 className="text-xl font-bold mb-1">Support</h3>
            <p className="text-white/80 text-sm">
              Submit feedback or complaints
            </p>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-brand-red" />
              Upcoming Sessions
            </h2>
            <div className="space-y-3">
              <div className="bg-black/40 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Personal Training</h3>
                  <p className="text-sm text-gray-400">with Coach Sarah</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-red">Tomorrow</p>
                  <p className="text-sm text-gray-400">10:00 AM</p>
                </div>
              </div>
              <div className="bg-black/40 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Yoga Class</h3>
                  <p className="text-sm text-gray-400">with Coach Mike</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-red">Wed, Jan 22</p>
                  <p className="text-sm text-gray-400">6:00 PM</p>
                </div>
              </div>
              <Link
                href="/dashboard/customer/bookings"
                className="block w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors text-center"
              >
                View All Sessions
              </Link>
            </div>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Folder className="text-brand-red" />
              Fitness Resources
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Latest resources shared by admin
            </p>
            <div className="space-y-3">
              {resourcesLoading ? (
                <div className="bg-black/40 p-4 rounded-lg text-sm text-gray-400">
                  Loading resources...
                </div>
              ) : resources.length === 0 ? (
                <div className="bg-black/40 p-4 rounded-lg text-sm text-gray-400">
                  No resources available yet.
                </div>
              ) : (
                resources.map((resource) => {
                  const resourceUrl = getResourceUrl(resource);

                  return (
                    <div
                      key={resource._id || resource.id || resource.title}
                      className="bg-black/40 p-4 rounded-lg"
                    >
                      <h3 className="font-semibold mb-1 line-clamp-1">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {resource.description}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                          {getCategoryLabel(resource.category)}
                        </span>
                        {resourceUrl ? (
                          <a
                            href={resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-red hover:text-white transition-colors"
                          >
                            Open Resource
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">No link</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              <Link
                href="/blog"
                className="block w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors text-center"
              >
                View All Resources
              </Link>
            </div>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <User className="text-brand-red" />
              My Coaches
            </h2>
            <div className="space-y-3">
              <div className="bg-black/40 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center text-2xl font-bold">
                    S
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Sarah Johnson</h3>
                    <p className="text-sm text-gray-400">
                      Strength & HIIT Specialist
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Award className="text-yellow-500" size={14} />
                      <span className="text-xs text-yellow-500">
                        8 years experience
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard/customer/messages"
                    className="flex-1 bg-brand-red hover:bg-red-700 py-2 rounded-lg font-semibold transition-colors text-center text-sm"
                  >
                    Message
                  </Link>
                  <Link
                    href="/dashboard/customer/coaches/1"
                    className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors text-center text-sm"
                  >
                    Book Again
                  </Link>
                </div>
              </div>
              <Link
                href="/dashboard/customer/coaches"
                className="flex w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-semibold transition-colors text-center items-center justify-center gap-2"
              >
                <Search size={18} />
                Browse All Coaches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-dark flex items-center justify-center">
          <div className="text-2xl text-white">Loading...</div>
        </div>
      }
    >
      <CustomerDashboardContent />
    </Suspense>
  );
};

export default CustomerDashboard;
