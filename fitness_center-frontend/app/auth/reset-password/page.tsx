"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/app/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // If no token in URL, show invalid link message immediately
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg =
          data.errors?.[0]?.message || data.message || "Reset failed. Please try again.";
        setError(errMsg);
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-20">
        <div className="grid w-full gap-10 md:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Info */}
          <div className="space-y-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline"
            >
              ← Back to login
            </Link>
            <div className="rounded-3xl border border-white/10 bg-brand-gray/60 p-8 shadow-2xl shadow-black/30">
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-brand-red">PrimeFit</p>
              <h1 className="text-4xl font-bold md:text-5xl">Set New Password</h1>
              <p className="mt-4 text-white/70">
                Choose a strong password that you haven&apos;t used before.
                Your new password must be at least <strong className="text-white">6 characters</strong>.
              </p>
            </div>
          </div>

          {/* Right: Form / States */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl shadow-black/30">
            {success ? (
              /* Success State */
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500">
                  <CheckCircle className="text-green-400" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Your password has been changed successfully.
                    You will be redirected to the login page in a few seconds...
                  </p>
                </div>
                <Link
                  href="/auth/login"
                  className="w-full rounded-lg bg-white py-3 text-center font-bold text-brand-red transition-colors hover:bg-gray-100"
                >
                  Login Now
                </Link>
              </div>
            ) : !token ? (
              /* No Token State */
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border border-red-500">
                  <AlertCircle className="text-red-400" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Invalid Link</h2>
                  <p className="text-white/70 text-sm">
                    This password reset link is invalid or missing. Please request a new one.
                  </p>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-brand-red hover:underline text-sm"
                >
                  Request new reset link
                </Link>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">New Password</h2>
                  <p className="text-white/60 text-sm">Enter and confirm your new password.</p>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="At least 6 characters"
                      required
                      className="w-full rounded-lg border border-white/20 bg-black/40 py-3 pl-10 pr-10 text-white placeholder:text-gray-500 focus:border-brand-red focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      id="reset-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Repeat new password"
                      required
                      className="w-full rounded-lg border border-white/20 bg-black/40 py-3 pl-10 pr-10 text-white placeholder:text-gray-500 focus:border-brand-red focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Password strength hint */}
                {password.length > 0 && (
                  <p className={`text-xs ${password.length >= 6 ? "text-green-400" : "text-red-400"}`}>
                    {password.length >= 6 ? "✓ Password length OK" : "✗ At least 6 characters required"}
                  </p>
                )}

                {/* Confirm match hint */}
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${password === confirmPassword ? "text-green-400" : "text-red-400"}`}>
                    {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-500 bg-red-500/20 p-4">
                    <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={20} />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <button
                  id="reset-submit"
                  type="submit"
                  disabled={loading || !token}
                  className="w-full rounded-lg bg-white py-3 text-lg font-bold text-brand-red transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Wrapped in Suspense because useSearchParams requires it in Next.js App Router
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
