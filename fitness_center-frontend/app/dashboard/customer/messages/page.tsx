"use client";

import React, { Suspense } from "react";
import CommunicationCenter from "@/app/components/CommunicationCenter";

const CustomerMessagesPageContent = () => (
  <CommunicationCenter
    mode="customer"
    title="Messages & Emails"
    description="Message your assigned coaches or the admin team, track your inbox, and manage sent emails."
  />
);

const CustomerMessagesPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        Loading...
      </div>
    }
  >
    <CustomerMessagesPageContent />
  </Suspense>
);

export default CustomerMessagesPage;
