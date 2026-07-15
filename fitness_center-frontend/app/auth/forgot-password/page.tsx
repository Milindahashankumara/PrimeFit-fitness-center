"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/app/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show first validation error if any
        const errMsg =
          data.errors?.[0]?.message || data.message || "Something went wrong. Please try again.";
        setError(errMsg);
        return;
      }

      // Always show success (API never reveals if email exists — security)
      setSubmitted(true);
      setMessage(
        data.message ||
          "If that email is registered, you will receive a password reset link shortly."
      );
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
              <ArrowLeft size={16} />
              Back to login
            </Link>
            <div className="rounded-3xl border border-white/10 bg-brand-gray/60 p-8 shadow-2xl shadow-black/30">
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-brand-red">PrimeFit</p>
              <h1 className="text-4xl font-bold md:text-5xl">Reset Password</h1>
              <p className="mt-4 text-white/70">
                Enter your registered email address below. We will send you a secure link to reset
                your password. The link expires in <strong className="text-white">1 hour</strong>.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl shadow-black/30">
            {submitted ? (
              /* Success State */
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500">
                  <CheckCircle className="text-green-400" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                  <p className="text-white/70 text-sm leading-relaxed">{message}</p>
                </div>
                <p className="text-white/50 text-xs">
                  Didn&apos;t receive it? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                    }}
                    className="text-brand-red hover:underline"
                  >
                    try again
                  </button>
                  .
                </p>
                <Link
                  href="/auth/login"
                  className="mt-2 text-sm text-brand-red hover:underline"
                >
                  Back to login
                </Link>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Forgot Password?</h2>
                  <p className="text-white/60 text-sm">We&apos;ll send you a reset link.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your registered email"
                      required
                      className="w-full rounded-lg border border-white/20 bg-black/40 py-3 pl-10 text-white placeholder:text-gray-500 focus:border-brand-red focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-500 bg-red-500/20 p-4">
                    <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={20} />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-white py-3 text-lg font-bold text-brand-red transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <p className="text-center text-sm text-white/50">
                  Remembered it?{" "}
                  <Link href="/auth/login" className="text-brand-red hover:underline">
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
