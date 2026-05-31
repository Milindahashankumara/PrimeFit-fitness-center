"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoachesAPI } from "@/app/lib/api";
import {
  Search,
  Star,
  Clock,
  Award,
  Users,
  Filter,
  X,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

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
  coachStatus?: string;
}

const isValidObjectId = (value?: string) =>
  Boolean(value && value.length === 24 && /^[a-f\d]{24}$/i.test(value));

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const FindCoachesPage = () => {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<string>("All");
  const [selectedAvailability, setSelectedAvailability] =
    useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  const loadCoaches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const coachesData = await CoachesAPI.getAll();

      const validCoaches = coachesData.filter((coach) => {
        const id = coach._id || coach.id;
        return isValidObjectId(id);
      });

      setCoaches(validCoaches);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load coaches"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoaches();
    const interval = setInterval(loadCoaches, 30000);
    return () => clearInterval(interval);
  }, [loadCoaches]);

  const specializations = [
    "All",
    "Strength Training",
    "HIIT",
    "Yoga",
    "Weight Loss",
    "Sports Performance",
    "Pilates",
    "Boxing",
    "Cardio",
    "Nutrition Coaching",
  ];

  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch =
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specializations?.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesSpec =
      selectedSpecialization === "All" ||
      coach.specializations?.includes(selectedSpecialization);
    return matchesSearch && matchesSpec;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
          <p className="text-gray-400">Loading coaches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="bg-brand-gray border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="hover:text-brand-red transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Find Your Perfect Coach</h1>
                <p className="text-sm text-gray-400">
                  Browse {coaches.length} expert trainers
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-gray border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-brand-gray border border-white/10 px-4 py-2 rounded-lg hover:border-brand-red transition-colors whitespace-nowrap"
            >
              <Filter size={18} />
              Filters
            </button>

            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedSpecialization === spec
                    ? "bg-brand-red text-white"
                    : "bg-brand-gray border border-white/10 hover:border-brand-red"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-brand-gray border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Additional Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Availability
                </label>
                <div className="flex gap-2">
                  {["All", "Available Today", "Available Tomorrow"].map(
                    (avail) => (
                      <button
                        key={avail}
                        onClick={() => setSelectedAvailability(avail)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedAvailability === avail
                            ? "bg-brand-red text-white"
                            : "bg-black/40 border border-white/10 hover:border-brand-red"
                        }`}
                      >
                        {avail}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-400">
            Showing{" "}
            <span className="text-white font-semibold">
              {filteredCoaches.length}
            </span>{" "}
            coaches
          </p>
          {(searchQuery || selectedSpecialization !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSpecialization("All");
              }}
              className="text-brand-red hover:underline text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Coaches Grid */}
        {filteredCoaches.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto mb-4 text-gray-600" size={64} />
            <h3 className="text-xl font-bold mb-2">No coaches found</h3>
            <p className="text-gray-400">
              {searchQuery || selectedSpecialization !== "All"
                ? "Try adjusting your search or filters"
                : "No approved coaches available yet"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach) => (
              <div
                key={coach._id || coach.id}
                className="bg-brand-gray rounded-2xl overflow-hidden border border-white/10 hover:border-brand-red transition-all hover:shadow-xl hover:shadow-brand-red/20 group"
              >
                {/* Coach Header */}
                <div className="relative bg-linear-to-br from-brand-red to-red-900 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-brand-red text-2xl font-bold shadow-lg">
                      {coach.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Star
                        className="text-yellow-400 fill-yellow-400"
                        size={16}
                      />
                      <span className="font-bold">{coach.rating || 0}</span>
                      <span className="text-sm text-gray-300">
                        ({coach.reviewCount || 0})
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{coach.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Award size={16} />
                    <span>{coach.experience || 0} years experience</span>
                  </div>
                </div>

                {/* Coach Details */}
                <div className="p-6 space-y-4">
                  {/* Specializations */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">
                      SPECIALIZATIONS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {coach.specializations &&
                      coach.specializations.length > 0 ? (
                        coach.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="text-xs bg-brand-red/20 text-brand-red px-3 py-1 rounded-full border border-brand-red/30"
                          >
                            {spec}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          No specializations listed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {coach.bio ||
                      "Professional fitness coach dedicated to helping you achieve your goals."}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Users className="text-brand-red" size={18} />
                      <div>
                        <p className="text-xs text-gray-400">Active Clients</p>
                        <p className="font-bold">{coach.activeClients || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="text-brand-red" size={18} />
                      <div>
                        <p className="text-xs text-gray-400">Session Price</p>
                        <p className="font-bold">
                          LKR {coach.hourlyRate || 0}/hr
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  {coach.certifications && coach.certifications.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 mb-1">
                        CERTIFICATIONS
                      </p>
                      <p className="text-xs text-gray-500">
                        {coach.certifications.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/dashboard/customer/coaches/${coach._id || coach.id}`}
                      className="flex-1 bg-brand-red hover:bg-red-700 py-3 rounded-lg font-semibold transition-colors text-center"
                    >
                      View Profile
                    </Link>
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

export default FindCoachesPage;
