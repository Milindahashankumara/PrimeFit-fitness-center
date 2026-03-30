'use client';

import React, { useState } from 'react';
import { User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer' // customer, coach
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Call real backend API
      console.log('📝 Registering user:', formData.email);
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log('✅ Registration successful!', data);

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      switch (formData.role) {
        case 'customer':
          router.push('/dashboard/customer');
          break;
        case 'coach':
          router.push('/dashboard/coach');
          break;
        default:
          router.push('/');
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-brand-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-1/2 h-full bg-brand-red/5 blur-3xl rounded-r-full pointer-events-none"></div>

      <div className="max-w-7xl w-full mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10 py-12">
        
        {/* Left Side: Registration Form */}
        <div className="bg-[#800000] p-8 md:p-12 rounded-3xl shadow-2xl relative">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-white/70 mb-8">Join our fitness community today</p>

          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-black/40 border border-white/20 rounded-lg py-3 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-black/40 border border-white/20 rounded-lg py-3 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  className="w-full bg-black/40 border border-white/20 rounded-lg py-3 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  className="w-full bg-black/40 border border-white/20 rounded-lg py-3 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="w-full bg-black/40 border border-white/20 rounded-lg py-3 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Register As</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-red transition-colors"
              >
                <option value="customer">Customer</option>
                <option value="coach">Coach</option>
              </select>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required className="w-4 h-4 mt-1 rounded border-white/20" />
              <span className="text-sm text-white/70">
                I agree to the{' '}
                <Link href="/terms" className="text-brand-red hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-brand-red hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-brand-red hover:bg-gray-100 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink-0 mx-4 text-gray-300 text-sm">Or</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            <button
              type="button"
              className="w-full border border-white/30 hover:bg-white/10 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
              </svg>
              Sign up with Google
            </button>

            <p className="text-center text-white/70 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-white font-semibold hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>

        {/* Right Side: Info */}
        <div className="space-y-8">
          <h1 className="text-5xl font-bold">
            Start Your <span className="text-brand-red">Fitness Journey</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Join thousands of members who have transformed their lives with PrimeFit.
          </p>

          <div className="grid gap-6">
            <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
              <h3 className="font-bold text-xl mb-2 text-brand-red">Personalized Plans</h3>
              <p className="text-sm text-gray-400">Get customized workout and nutrition plans tailored to your goals.</p>
            </div>
            <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
              <h3 className="font-bold text-xl mb-2 text-brand-red">Expert Guidance</h3>
              <p className="text-sm text-gray-400">Work with certified coaches who support you every step.</p>
            </div>
            <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
              <h3 className="font-bold text-xl mb-2 text-brand-red">Track Progress</h3>
              <p className="text-sm text-gray-400">Monitor your achievements and celebrate milestones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
