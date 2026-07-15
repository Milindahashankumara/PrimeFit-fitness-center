"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/app/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Use ref to prevent double-call in React StrictMode
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check the link in your email.");
      return;
    }

    // Call backend to verify the email
    fetch(`${API_BASE_URL}/auth/verify-email/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully! You can now login.");
        } else {
          setStatus("error");
          setMessage(
            data.message ||
              "Email verification failed. The link may be invalid or expired."
          );
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please check your connection and try again.");
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setResendMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      setResendMessage(
        data.message ||
          "If that email is registered and unverified, a new link has been sent."
      );
    } catch {
      setResendMessage("Failed to send. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        {/* PrimeFit brand */}
        <p className="mb-8 text-sm uppercase tracking-[0.3em] text-brand-red">PrimeFit</p>

        {/* Loading State */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <Loader2 className="animate-spin text-brand-red" size={36} />
            </div>
            <h1 className="text-3xl font-bold">Verifying Your Email...</h1>
            <p className="text-white/60">Please wait a moment.</p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border border-green-500">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h1 className="text-3xl font-bold">Email Verified!</h1>
            <p className="text-white/70 max-w-md leading-relaxed">{message}</p>
            <Link
              href="/auth/login"
              className="mt-2 rounded-lg bg-white px-8 py-3 font-bold text-brand-red transition-colors hover:bg-gray-100"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 border border-red-500">
              <AlertCircle className="text-red-400" size={40} />
            </div>
            <h1 className="text-3xl font-bold">Verification Failed</h1>
            <p className="text-white/70 leading-relaxed">{message}</p>

            {/* Resend verification form */}
            <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-6 text-left mt-2">
              <h2 className="font-semibold text-lg mb-4">Request a New Verification Link</h2>
              <form onSubmit={handleResend} className="space-y-4">
                <div>
                  <label className="text-sm text-white/70 mb-1 block">Your Email Address</label>
                  <input
                    id="resend-email"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:border-brand-red focus:outline-none transition-colors"
                  />
                </div>
                {resendMessage && (
                  <p className="text-sm text-green-400">{resendMessage}</p>
                )}
                <button
                  id="resend-submit"
                  type="submit"
                  disabled={resendLoading}
                  className="w-full rounded-lg bg-white py-3 font-bold text-brand-red transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </button>
              </form>
            </div>

            <Link href="/auth/login" className="text-sm text-brand-red hover:underline">
              Back to login
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

// Wrapped in Suspense because useSearchParams requires it in Next.js App Router
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white text-xl">
        Loading...
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
