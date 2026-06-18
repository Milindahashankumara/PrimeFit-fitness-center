"use client";

import React, { Suspense } from "react";
import CommunicationCenter from "@/app/components/CommunicationCenter";

const AdminCommunicationsPageContent = () => (
  <CommunicationCenter
    mode="admin"
    allowBroadcast
    title="Communication Center"
    description="Monitor all communications, send messages and broadcast announcements."
  />
);

const AdminCommunicationsPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        Loading...
      </div>
    }
  >
    <AdminCommunicationsPageContent />
  </Suspense>
);

export default AdminCommunicationsPage;
