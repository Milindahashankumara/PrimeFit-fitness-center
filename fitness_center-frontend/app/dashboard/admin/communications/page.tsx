"use client";

import CommunicationCenter from "@/app/components/CommunicationCenter";

const AdminCommunicationsPage = () => (
  <CommunicationCenter
    mode="admin"
    allowBroadcast
    title="Email Management Center"
    description="Monitor all customer and coach communications, send direct messages, and broadcast announcements."
  />
);

export default AdminCommunicationsPage;
