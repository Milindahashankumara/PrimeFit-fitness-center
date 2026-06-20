import React, { Suspense } from "react";
import CustomerDashboard from "./CustomerDashboard";

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
