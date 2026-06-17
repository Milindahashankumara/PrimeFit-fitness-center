"use client";

import CommunicationCenter from "@/app/components/CommunicationCenter";

const AdminCommunicationsPage = () => (
  <CommunicationCenter
    mode="admin"
    allowBroadcast
    title="Communication Center"
    description="Monitor all communications, send messages and broadcast announcements."
  />
);

export default AdminCommunicationsPage;
