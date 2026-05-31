import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | PrimeFit",
  description: "PrimeFit terms and conditions for platform usage.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-white">
      <section className="mx-auto w-full max-w-4xl px-4 py-24">
        <div className="mb-10 rounded-3xl border border-white/10 bg-brand-gray/60 p-8 shadow-2xl shadow-black/30">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-brand-red">
            PrimeFit
          </p>
          <h1 className="text-4xl font-bold md:text-5xl">Terms & Conditions</h1>
          <p className="mt-4 text-white/70">
            These terms govern how you use the PrimeFit website and services.
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-8 text-white/80">
          <div>
            <h2 className="text-xl font-semibold text-white">Account usage</h2>
            <p className="mt-2 leading-7">
              You are responsible for keeping your account details accurate and
              protecting your login credentials.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Bookings and services
            </h2>
            <p className="mt-2 leading-7">
              Booking availability, coach assignments, and subscriptions may
              change based on service rules and business operations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Acceptable use</h2>
            <p className="mt-2 leading-7">
              You agree not to misuse the platform, interfere with its security,
              or attempt to access data that does not belong to you.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Changes</h2>
            <p className="mt-2 leading-7">
              PrimeFit may update these terms as the product evolves. Continued
              use of the service means you accept the updated terms.
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
