"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("If that email exists, your team can handle the reset flow from here.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-brand-dark text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-20">
        <div className="grid w-full gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
            <div className="rounded-3xl border border-white/10 bg-brand-gray/60 p-8 shadow-2xl shadow-black/30">
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-brand-red">
                PrimeFit
              </p>
              <h1 className="text-4xl font-bold md:text-5xl">Reset Password</h1>
              <p className="mt-4 text-white/70">
                Enter your email to continue with the password reset process.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl shadow-black/30">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-lg border border-white/20 bg-black/40 py-3 pl-10 text-white placeholder:text-gray-500 focus:border-brand-red focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-500 bg-red-500/20 p-4">
                  <AlertCircle className="mt-0.5 text-red-500" size={20} />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 p-4 text-sm text-white/80">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-white py-3 text-lg font-bold text-brand-red transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset instructions"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}