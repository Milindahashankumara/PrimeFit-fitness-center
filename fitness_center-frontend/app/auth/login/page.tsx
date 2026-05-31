"use client";

import React, { useState } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/app/lib/api";

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      switch (data.user.role) {
        case "customer":
          router.push("/dashboard/customer");
          break;
        case "coach":
          router.push("/dashboard/coach");
          break;
        case "admin":
          router.push("/dashboard/admin");
          break;
        default:
          router.push("/");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-brand-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-red/5 blur-3xl rounded-l-full pointer-events-none"></div>

      <div className="max-w-7xl w-full mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10 py-12">
        {/* Left Side: Info */}
        <div className="space-y-8">
          <h1 className="text-5xl font-bold">
            Welcome <span className="text-brand-red">Back!</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Login to access your personalized dashboard and continue your
            fitness journey.
          </p>

          <div className="grid gap-6">
            <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
              <h3 className="font-bold text-xl mb-2 text-brand-red">
                Track Your Progress
              </h3>
              <p className="text-sm text-gray-400">
                Monitor your workouts, nutrition, and achievements.
              </p>
            </div>
            <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
              <h3 className="font-bold text-xl mb-2 text-brand-red">
                Connect with Coaches
              </h3>
              <p className="text-sm text-gray-400">
                Get personalized guidance from expert trainers.
              </p>
            </div>
            <div className="bg-brand-gray p-6 rounded-xl border-l-4 border-brand-red">
              <h3 className="font-bold text-xl mb-2 text-brand-red">
                Join the Community
              </h3>
              <p className="text-sm text-gray-400">
                Share your journey and inspire others.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="bg-[#800000] p-8 md:p-12 rounded-3xl shadow-2xl relative">
          <h2 className="text-3xl font-bold mb-2">Login</h2>
          <p className="text-white/70 mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
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
              <label className="text-sm font-semibold">Password</label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-black/40 border border-white/20 rounded-lg py-3 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20"
                />
                <span className="text-sm text-white/70">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-brand-red hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-brand-red hover:bg-gray-100 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-white/20"></div>
              <span className="shrink-0 mx-4 text-gray-300 text-sm">Or</span>
              <div className="grow border-t border-white/20"></div>
            </div>

            <button
              type="button"
              className="w-full border border-white/30 hover:bg-white/10 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                />
                <path
                  fill="#34A853"
                  d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
                />
                <path
                  fill="#4A90E2"
                  d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                />
              </svg>
              Login with Google
            </button>

            <p className="text-center text-white/70 text-sm mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-white font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
