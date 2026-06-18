"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const CommunicationCenter = dynamic(
  () => import("@/app/components/CommunicationCenter"),
  { ssr: false }
);

const CustomerMessagesPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        Loading...
      </div>
    }
  >
    <CommunicationCenter
      mode="customer"
      title="Messages & Emails"
      description="Message your assigned coaches or the admin team, track your inbox, and manage sent emails."
    />
  </Suspense>
);

export default CustomerMessagesPage;
