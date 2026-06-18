"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const CommunicationCenter = dynamic(
  () => import("@/app/components/CommunicationCenter"),
  { ssr: false }
);

const AdminCommunicationsPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        Loading...
      </div>
    }
  >
    <CommunicationCenter
      mode="admin"
      allowBroadcast
      title="Communication Center"
      description="Monitor all communications, send messages and broadcast announcements."
    />
  </Suspense>
);

export default AdminCommunicationsPage;
