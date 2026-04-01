'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
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
  Star,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
  name: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
}

const CustomerDashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'customer') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    setLoading(false);

    if (searchParams.get('bookingSuccess') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [router, searchParams]);

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
            <button onClick={handleLogout} className="bg-brand-red hover:bg-red-700 p-2 rounded-lg transition-colors">
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
              <p className="font-semibold text-green-400">Session Booked Successfully!</p>
              <p className="text-sm text-gray-300">Your training session has been confirmed.</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, <span className="text-brand-red">{user?.name}!</span>
          </h1>
          <p className="text-gray-400">Let&apos;s crush your fitness goals today 💪</p>
        </div>

        <div className="mb-8 grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/dashboard/customer/coaches" className="bg-gradient-to-br from-brand-red to-red-900 p-6 rounded-xl hover:shadow-xl hover:shadow-brand-red/20 transition-all group">
            <Users className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">Find a Coach</h3>
            <p className="text-white/80 text-sm">Browse expert trainers and book sessions</p>
          </Link>
          
          <Link href="/dashboard/customer/bookings" className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition-all group">
            <Calendar className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">My Bookings</h3>
            <p className="text-white/80 text-sm">View and manage your scheduled sessions</p>
          </Link>

          <Link href="/dashboard/customer/feedback" className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-xl hover:shadow-xl hover:shadow-yellow-500/20 transition-all group">
            <Star className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">Feedback</h3>
            <p className="text-white/80 text-sm">Rate your sessions and coaches</p>
          </Link>

          <Link href="/dashboard/customer/profile" className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition-all group">
            <Settings className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">My Profile</h3>
            <p className="text-white/80 text-sm">Manage your account and preferences</p>
          </Link>

          <Link href="/dashboard/customer/complaints" className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-xl hover:shadow-xl hover:shadow-orange-500/20 transition-all group">
            <MessageSquare className="text-white mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-xl font-bold mb-1">Support</h3>
            <p className="text-white/80 text-sm">Submit feedback or complaints</p>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
            <div className="flex items-center justify-between mb-4">
              <Activity className="text-brand-red" size={32} />
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">+12%</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">24</h3>
            <p className="text-gray-400 text-sm">Workouts This Month</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-blue-500" size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-1">18.5</h3>
            <p className="text-gray-400 text-sm">Hours Trained</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <Target className="text-yellow-500" size={32} />
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">85%</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">17/20</h3>
            <p className="text-gray-400 text-sm">Monthly Goal</p>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-purple-500" size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-1">8</h3>
            <p className="text-gray-400 text-sm">Achievements</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Dumbbell className="text-brand-red" />
              Today&apos;s Workout
            </h2>
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-lg border-l-4 border-brand-red">
                <h3 className="font-bold mb-1">Upper Body Strength</h3>
                <p className="text-sm text-gray-400 mb-2">45 minutes • Intermediate</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-brand-red/20 text-brand-red px-2 py-1 rounded">Chest</span>
                  <span className="text-xs bg-brand-red/20 text-brand-red px-2 py-1 rounded">Arms</span>
                  <span className="text-xs bg-brand-red/20 text-brand-red px-2 py-1 rounded">Shoulders</span>
                </div>
              </div>
              <button className="w-full bg-brand-red hover:bg-red-700 py-3 rounded-lg font-bold transition-colors">
                Start Workout
              </button>
            </div>
          </div>

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
              <Link href="/dashboard/customer/bookings" className="block w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors text-center">
                View All Sessions
              </Link>
            </div>
          </div>

          <div className="bg-brand-gray p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-brand-red" />
              Progress Tracking
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Weight Goal</span>
                  <span className="text-sm font-semibold">75kg / 80kg</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div className="bg-brand-red h-3 rounded-full" style={{ width: '93.75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Strength Level</span>
                  <span className="text-sm font-semibold">Level 6</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Endurance</span>
                  <span className="text-sm font-semibold">Level 7</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
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
                  <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center text-2xl font-bold">S</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Sarah Johnson</h3>
                    <p className="text-sm text-gray-400">Strength & HIIT Specialist</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Award className="text-yellow-500" size={14} />
                      <span className="text-xs text-yellow-500">8 years experience</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-brand-red hover:bg-red-700 py-2 rounded-lg font-semibold transition-colors text-sm">
                    Message
                  </button>
                  <Link href="/dashboard/customer/coaches/1" className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors text-center text-sm">
                    Book Again
                  </Link>
                </div>
              </div>
              <Link href="/dashboard/customer/coaches" className="flex w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-semibold transition-colors text-center items-center justify-center gap-2">
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
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    }>
      <CustomerDashboardContent />
    </Suspense>
  );
};

export default CustomerDashboard;
