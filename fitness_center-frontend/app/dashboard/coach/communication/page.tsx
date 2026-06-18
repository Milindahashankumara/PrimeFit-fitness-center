import React, { Suspense } from "react";
import CommunicationCenter from "@/app/components/CommunicationCenter";

const CoachCommunicationPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        Loading...
      </div>
    }
  >
    <CommunicationCenter
      mode="coach"
      title="Communication Center"
      description="Talk to your customers, email admins, review inbox activity, and manage reply history."
    />
  </Suspense>
);

export default CoachCommunicationPage;
