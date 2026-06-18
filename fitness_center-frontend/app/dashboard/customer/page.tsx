"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const CustomerDashboard = dynamic(
  () => import("./CustomerDashboard"),
  { ssr: false }
);

const CustomerDashboardPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-dark flex items-center justify-center">
          <div className="text-2xl text-white">Loading...</div>
        </div>
      }
    >
      <CustomerDashboard />
    </Suspense>
  );
};

export default CustomerDashboardPage;
