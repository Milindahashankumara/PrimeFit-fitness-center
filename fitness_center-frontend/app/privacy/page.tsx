import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | PrimeFit",
  description: "PrimeFit privacy policy and data handling information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-white">
      <section className="mx-auto w-full max-w-4xl px-4 py-24">
        <div className="mb-10 rounded-3xl border border-white/10 bg-brand-gray/60 p-8 shadow-2xl shadow-black/30">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-brand-red">
            PrimeFit
          </p>
          <h1 className="text-4xl font-bold md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-white/70">
            This page explains how PrimeFit collects, uses, and protects your
            information.
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-8 text-white/80">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Information we collect
            </h2>
            <p className="mt-2 leading-7">
              We may collect details you submit during registration, booking,
              complaints, feedback, and profile updates. We also store basic
              account activity needed to operate the platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">How we use it</h2>
            <p className="mt-2 leading-7">
              Your information is used to create your account, manage your
              fitness dashboard, process bookings, and improve the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Data protection
            </h2>
            <p className="mt-2 leading-7">
              We use standard security practices and limit access to account
              data to authorized systems and administrators.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="mt-2 leading-7">
              If you have questions about this policy, contact the PrimeFit team
              through the app dashboard or support channels.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/auth/register"
              className="text-brand-red hover:underline"
            >
              Back to registration
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
