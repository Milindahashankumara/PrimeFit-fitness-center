'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI, BookingsAPI } from '@/app/lib/api';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  LogOut,
  TrendingUp,
  Clock,
  Star,
  Video,
  Settings,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
  _id?: string;
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

const CoachDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    loadUserData();
    loadTodaySchedule();
  }, [router]);

  const loadTodaySchedule = async () => {
    try {
      setLoadingBookings(true);
      // Get all bookings for this coach
      const allBookings = await BookingsAPI.getAll();
      
      // Filter for today's accepted/rescheduled bookings
      const today = new Date().toISOString().split('T')[0];
      const todaysBookings = allBookings
        .filter(booking => {
          const bookingDate = new Date(booking.date).toISOString().split('T')[0];
          return bookingDate === today && (booking.status === 'accepted' || booking.status === 'rescheduled');
        })
        .sort((a, b) => {
          // Sort by time
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          return timeA.localeCompare(timeB);
        });
      
      setTodayBookings(todaysBookings);
      setLoadingBookings(false);
    } catch (error) {
      console.error('Failed to load today\'s schedule:', error);
      setLoadingBookings(false);
    }
  };

  const loadUserData = async () => {
    try {
      // First check localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/auth/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'coach') {
        router.push('/auth/login');
        return;
      }

      // Load fresh data from API
      const currentUser = await AuthAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(currentUser));
      } else {
        setUser(parsedUser);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Fallback to localStorage data
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
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
            Prime<span className="text-brand-red">Fit</span> <span className="text-sm text-gray-400">Coach Portal</span>
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
          <p className="text-gray-400">Manage your clients and track their progress</p>
        </div>

        {/* Quick Action Cards */}
        <div className="mb-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/coach/profile" className="bg-gradient-to-br from-brand-red to-red-900 p-6 rounded-xl hover:shadow-xl hover:shadow-brand-red/20 transition-all group">
            <Settings className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">My Profile</h3>
            <p className="text-white/80 text-sm">Update professional details</p>
          </Link>
          
          <Link href="/dashboard/coach/availability" className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all group">
            <Clock className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">Availability</h3>
            <p className="text-white/80 text-sm">Manage your schedule</p>
          </Link>

          <Link href="/dashboard/coach/requests" className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-xl hover:shadow-xl hover:shadow-yellow-500/20 transition-all group relative">
            <AlertCircle className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">Requests</h3>
            <p className="text-white/80 text-sm">Review booking requests</p>
            <div className="absolute top-4 right-4 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
          </Link>

          <Link href="/dashboard/coach/clients" className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition-all group">
            <Users className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">My Clients</h3>
            <p className="text-white/80 text-sm">View and manage clients</p>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-brand-red" size={32} />
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">+3</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">42</h3>
            <p className="text-gray-400 text-sm">Active Clients</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-blue-500" size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-1">18</h3>
            <p className="text-gray-400 text-sm">Sessions This Week</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-yellow-500" size={32} />
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">+8%</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">LKR 5,240</h3>
            <p className="text-gray-400 text-sm">Monthly Earnings</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <Star className="text-purple-500" size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-1">4.9</h3>
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
                  <p className="text-gray-400">No sessions scheduled for today</p>
                  <p className="text-sm text-gray-500 mt-2">Enjoy your day off!</p>
                </div>
              ) : (
                <>
                  {todayBookings.slice(0, 3).map((booking, index) => {
                    const colors = ['border-brand-red bg-brand-red', 'border-blue-500 bg-blue-500', 'border-green-500 bg-green-500', 'border-purple-500 bg-purple-500', 'border-yellow-500 bg-yellow-500'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={booking._id || index} className={`bg-black/40 p-4 rounded-lg border-l-4 ${color.split(' ')[0]}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold">{booking.customerName || 'Unknown Client'}</h3>
                            <p className="text-sm text-gray-400">{booking.sessionType || booking.type}</p>
                            {booking.status === 'rescheduled' && (
                              <p className="text-xs text-yellow-400 mt-1">⚠️ Rescheduled</p>
                            )}
                          </div>
                          <span className={`${color.split(' ')[1]} px-2 py-1 rounded text-xs font-semibold`}>
                            {booking.time || 'TBD'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {todayBookings.length > 3 && (
                    <p className="text-center text-sm text-gray-400 pt-2">
                      +{todayBookings.length - 3} more session{todayBookings.length - 3 > 1 ? 's' : ''}
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

          {/* Recent Clients */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-brand-red" />
              Recent Clients
            </h2>
            <div className="space-y-3">
              <div className="bg-black/40 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center font-bold">
                    JS
                  </div>
                  <div>
                    <h3 className="font-semibold">John Smith</h3>
                    <p className="text-sm text-gray-400">Last session: Today</p>
                  </div>
                </div>
                <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">
                  View
                </button>
              </div>

              <div className="bg-black/40 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold">
                    ED
                  </div>
                  <div>
                    <h3 className="font-semibold">Emily Davis</h3>
                    <p className="text-sm text-gray-400">Last session: Yesterday</p>
                  </div>
                </div>
                <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">
                  View
                </button>
              </div>

              <div className="bg-black/40 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center font-bold">
                    MB
                  </div>
                  <div>
                    <h3 className="font-semibold">Michael Brown</h3>
                    <p className="text-sm text-gray-400">Last session: 2 days ago</p>
                  </div>
                </div>
                <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors">
                  View
                </button>
              </div>

              <button className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors">
                View All Clients
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="text-brand-red" />
              Recent Messages
            </h2>
            <div className="space-y-3">
              <div className="bg-black/40 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">Sarah Wilson</h3>
                  <span className="text-xs text-gray-400">10 min ago</span>
                </div>
                <p className="text-sm text-gray-400">Can we reschedule tomorrow&apos;s session?</p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">Tom Anderson</h3>
                  <span className="text-xs text-gray-400">1 hour ago</span>
                </div>
                <p className="text-sm text-gray-400">Thanks for the workout plan! 💪</p>
              </div>

              <button className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors">
                View All Messages
              </button>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-brand-red" />
              This Month&apos;s Performance
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Sessions Completed</span>
                  <span className="text-sm font-semibold">58 / 60</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div className="bg-brand-red h-3 rounded-full" style={{ width: '96.67%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Client Retention</span>
                  <span className="text-sm font-semibold">95%</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-semibold">Excellent</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button className="bg-brand-red hover:bg-red-700 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  <Video size={18} />
                  Start Session
                </button>
                <button className="bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  <Clock size={18} />
                  Time Off
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
