"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  X,
  Save,
  CheckCircle,
  Copy,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  sessionType: "personal" | "group" | "online";
  isRecurring: boolean;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

const AvailabilityPage = () => {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);
  const idCounterRef = useRef(100);

  const nextId = () => {
    const nextValue = idCounterRef.current;
    idCounterRef.current += 1;
    return String(nextValue);
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([
    {
      id: "1",
      day: "Monday",
      startTime: "09:00",
      endTime: "12:00",
      sessionType: "personal",
      isRecurring: true,
    },
    {
      id: "2",
      day: "Monday",
      startTime: "14:00",
      endTime: "18:00",
      sessionType: "personal",
      isRecurring: true,
    },
    {
      id: "3",
      day: "Tuesday",
      startTime: "09:00",
      endTime: "12:00",
      sessionType: "group",
      isRecurring: true,
    },
    {
      id: "4",
      day: "Wednesday",
      startTime: "09:00",
      endTime: "17:00",
      sessionType: "personal",
      isRecurring: true,
    },
    {
      id: "5",
      day: "Thursday",
      startTime: "10:00",
      endTime: "15:00",
      sessionType: "online",
      isRecurring: true,
    },
    {
      id: "6",
      day: "Friday",
      startTime: "09:00",
      endTime: "16:00",
      sessionType: "personal",
      isRecurring: true,
    },
  ]);

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([
    { id: "1", date: "2026-01-25", reason: "Conference" },
    { id: "2", date: "2026-02-14", reason: "Personal Day" },
  ]);

  const [newSlot, setNewSlot] = useState<Omit<TimeSlot, "id">>({
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
    sessionType: "personal",
    isRecurring: true,
  });

  const [newBlockedDate, setNewBlockedDate] = useState({
    date: "",
    reason: "",
  });

  const handleAddSlot = () => {
    const slot: TimeSlot = {
      ...newSlot,
      id: nextId(),
    };
    setAvailabilitySlots([...availabilitySlots, slot]);
    setShowAddSlot(false);
    setNewSlot({
      day: "Monday",
      startTime: "09:00",
      endTime: "17:00",
      sessionType: "personal",
      isRecurring: true,
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleRemoveSlot = (id: string) => {
    setAvailabilitySlots(availabilitySlots.filter((slot) => slot.id !== id));
  };

  const handleCopySlot = (slot: TimeSlot) => {
    const newSlot: TimeSlot = {
      ...slot,
      id: nextId(),
    };
    setAvailabilitySlots([...availabilitySlots, newSlot]);
  };

  const handleAddBlockedDate = () => {
    if (newBlockedDate.date && newBlockedDate.reason) {
      const blocked: BlockedDate = {
        ...newBlockedDate,
        id: nextId(),
      };
      setBlockedDates([...blockedDates, blocked]);
      setShowBlockDate(false);
      setNewBlockedDate({ date: "", reason: "" });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleRemoveBlockedDate = (id: string) => {
    setBlockedDates(blockedDates.filter((date) => date.id !== id));
  };

  const getSlotsByDay = (day: string) => {
    return availabilitySlots
      .filter((slot) => slot.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "personal":
        return "bg-blue-500/20 text-blue-400 border-blue-500";
      case "group":
        return "bg-purple-500/20 text-purple-400 border-purple-500";
      case "online":
        return "bg-green-500/20 text-green-400 border-green-500";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500";
    }
  };

  const getTotalHoursPerWeek = () => {
    return availabilitySlots.reduce((total, slot) => {
      const start = parseInt(slot.startTime.split(":")[0]);
      const end = parseInt(slot.endTime.split(":")[0]);
      return total + (end - start);
    }, 0);
  };

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
                <h1 className="text-2xl font-bold">Availability Schedule</h1>
                <p className="text-sm text-gray-400">
                  Manage your weekly availability and blocked dates
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddSlot(true)}
              className="bg-brand-red hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Time Slot
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">
              Schedule updated successfully!
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-brand-red" size={32} />
              <div>
                <p className="text-3xl font-bold">{getTotalHoursPerWeek()}</p>
                <p className="text-sm text-gray-400">Hours per Week</p>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="text-blue-500" size={32} />
              <div>
                <p className="text-3xl font-bold">{availabilitySlots.length}</p>
                <p className="text-sm text-gray-400">Time Slots</p>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="text-yellow-500" size={32} />
              <div>
                <p className="text-3xl font-bold">{blockedDates.length}</p>
                <p className="text-sm text-gray-400">Blocked Dates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Weekly Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Weekly Schedule</h2>

              <div className="space-y-4">
                {daysOfWeek.map((day) => {
                  const slots = getSlotsByDay(day);
                  return (
                    <div key={day} className="bg-black/40 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg">{day}</h3>
                        {slots.length === 0 && (
                          <span className="text-sm text-gray-400">
                            No availability
                          </span>
                        )}
                      </div>

                      {slots.length > 0 && (
                        <div className="space-y-2">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between bg-brand-gray p-3 rounded-lg border-l-4 border-brand-red"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Clock className="text-brand-red" size={18} />
                                <div className="flex-1">
                                  <p className="font-semibold">
                                    {slot.startTime} - {slot.endTime}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`text-xs px-2 py-1 rounded border ${getSessionTypeColor(slot.sessionType)}`}
                                    >
                                      {slot.sessionType
                                        .charAt(0)
                                        .toUpperCase() +
                                        slot.sessionType.slice(1)}
                                    </span>
                                    {slot.isRecurring && (
                                      <span className="text-xs text-gray-400">
                                        • Recurring
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopySlot(slot)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                  title="Duplicate slot"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={() => handleRemoveSlot(slot.id)}
                                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                  title="Remove slot"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Blocked Dates */}
          <div className="lg:col-span-1">
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Blocked Dates</h2>
                <button
                  onClick={() => setShowBlockDate(true)}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 p-2 rounded-lg transition-colors"
                  title="Block a date"
                >
                  <Plus size={18} />
                </button>
              </div>

              {blockedDates.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle
                    className="mx-auto mb-3 text-gray-600"
                    size={48}
                  />
                  <p className="text-gray-400">No blocked dates</p>
                  <button
                    onClick={() => setShowBlockDate(true)}
                    className="mt-4 text-brand-red hover:underline text-sm"
                  >
                    Block a date
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedDates.map((blocked) => (
                    <div
                      key={blocked.id}
                      className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-yellow-400" size={18} />
                          <p className="font-semibold">
                            {new Date(blocked.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveBlockedDate(blocked.id)}
                          className="text-red-400 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-300">{blocked.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full bg-black/40 hover:bg-black/60 py-2 rounded-lg text-sm transition-colors">
                    Copy Last Week&apos;s Schedule
                  </button>
                  <button className="w-full bg-black/40 hover:bg-black/60 py-2 rounded-lg text-sm transition-colors">
                    Clear All Availability
                  </button>
                  <button className="w-full bg-black/40 hover:bg-black/60 py-2 rounded-lg text-sm transition-colors">
                    Export Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Time Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-6">Add Time Slot</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Day of Week
                </label>
                <select
                  value={newSlot.day}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, day: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, startTime: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, endTime: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Session Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["personal", "group", "online"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setNewSlot({ ...newSlot, sessionType: type })
                      }
                      className={`py-2 rounded-lg border-2 transition-all ${
                        newSlot.sessionType === type
                          ? "border-brand-red bg-brand-red/20"
                          : "border-white/10 bg-black/40 hover:border-brand-red/50"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                <span className="text-sm">Recurring Weekly</span>
                <button
                  onClick={() =>
                    setNewSlot({
                      ...newSlot,
                      isRecurring: !newSlot.isRecurring,
                    })
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    newSlot.isRecurring ? "bg-brand-red" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      newSlot.isRecurring ? "translate-x-7" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddSlot(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlot}
                className="flex-1 bg-brand-red hover:bg-red-700 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-6">Block a Date</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  value={newBlockedDate.date}
                  onChange={(e) =>
                    setNewBlockedDate({
                      ...newBlockedDate,
                      date: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={newBlockedDate.reason}
                  onChange={(e) =>
                    setNewBlockedDate({
                      ...newBlockedDate,
                      reason: e.target.value,
                    })
                  }
                  placeholder="e.g., Vacation, Conference, Personal Day"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowBlockDate(false);
                  setNewBlockedDate({ date: "", reason: "" });
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBlockedDate}
                disabled={!newBlockedDate.date || !newBlockedDate.reason}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Block Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;
