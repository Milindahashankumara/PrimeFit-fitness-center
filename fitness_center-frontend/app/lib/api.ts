const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl || "http://localhost:5000/api"
).replace(/\/+$/, "");

console.log("DEBUG: Connecting to API Base URL:", API_BASE_URL);

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = "Request failed";
    if (isJson) {
      const errorData = await response.json().catch(() => ({}));
      errorMessage = errorData.message || errorMessage;
    } else {
      const text = await response.text().catch(() => "");
      errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
    }

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  if (!isJson) {
    throw new Error(`Expected JSON response from ${url}, but received content-type: ${contentType}`);
  }

  return response.json();
};

export interface Booking {
  _id?: string; // MongoDB ID
  id?: string; // Alias for compatibility
  customerId: any;
  customerName: string;
  customerEmail: string;
  coachId: any;
  coach?: any;
  coachName: string;
  date: string;
  time: string;
  type: "personal" | "group" | "online";
  duration: number;
  price: number;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "completed"
    | "cancelled"
    | "rescheduled"
    | "pending_reschedule";
  message?: string;
  requestedAt: string;
  sessionType: string;
  location?: string;
  rescheduledBy?: string;
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
  rescheduledAt?: string;
  rescheduleRequest?: {
    requestedDate: string;
    requestedTime: string;
    requestReason?: string;
    requestedAt?: string;
    requestedBy?: string;
  };
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: "customer" | "coach" | "admin";
  rejectionReason?: string;
  [key: string]: any;
}

export interface Complaint {
  _id: string;
  id?: string;
  subject: string;
  category: string;
  description: string;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  createdAt: string;
  date?: string;
  customerName: string;
  customerEmail: string;
  priority: "low" | "medium" | "high";
  response?: string;
  responseDate?: string;
  resolvedBy?: string;
}

export interface Announcement {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  type?: "general" | "maintenance" | "event" | "promotion" | "urgent";
  priority: "low" | "medium" | "high";
  status: "draft" | "published" | "archived" | "scheduled";
  targetAudience: "all" | "customers" | "coaches";
  publishDate?: string;
  scheduledDate?: string;
  expiryDate?: string;
  views?: number;
  createdBy?: string | { name?: string; email?: string };
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceItem {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  type: "document" | "video" | "image" | "link";
  category:
    | "workout-plan"
    | "nutrition"
    | "exercise-guide"
    | "health-tips"
    | "other";
  fileUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  fileName?: string;
  fileSize?: string;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadedBy?: string;
  downloads?: number;
  views?: number;
  isPublic?: boolean;
  tags?: string[];
  status?: "draft" | "published" | "archived";
}

// Bookings API
export const BookingsAPI = {
  // Get all bookings
  getAll: async (): Promise<Booking[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      return [];
    }
  },

  // Get bookings for a specific customer
  getByCustomer: async (customerEmail: string): Promise<Booking[]> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/bookings?customerEmail=${customerEmail}`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch customer bookings:", error);
      return [];
    }
  },

  // Get bookings for a specific coach
  getByCoach: async (coachId: string): Promise<Booking[]> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/bookings?coachId=${coachId}`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch coach bookings:", error);
      return [];
    }
  },

  // Create a new booking
  create: async (
    booking: Omit<Booking, "id" | "requestedAt">,
  ): Promise<Booking> => {
    try {
      console.log("Creating booking:", booking);
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings`, {
        method: "POST",
        body: JSON.stringify(booking),
      });
      console.log("Booking created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to create booking:", error);
      throw error;
    }
  },

  // Update a booking
  update: async (
    id: string,
    updates: Partial<Omit<Booking, "rescheduleRequest">> & {
      rescheduleRequest?: Booking["rescheduleRequest"] | null;
      rescheduledAt?: string;
    },
  ): Promise<Booking> => {
    try {
      console.log("Updating booking:", id, updates);
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      console.log("Booking updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to update booking:", error);
      throw error;
    }
  },

  // Delete a booking
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Failed to delete booking:", error);
      return false;
    }
  },
};

// Complaints API
export const ComplaintsAPI = {
  // Get all complaints
  getAll: async (): Promise<Complaint[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/complaints`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      return [];
    }
  },

  // Get complaints for a specific customer
  getByCustomer: async (customerEmail: string): Promise<Complaint[]> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/complaints?customerEmail=${customerEmail}`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch customer complaints:", error);
      return [];
    }
  },

  // Create a new complaint
  create: async (
    complaint: Omit<Complaint, "_id" | "id" | "createdAt" | "date" | "status">,
  ): Promise<Complaint> => {
    try {
      console.log("Creating complaint:", complaint);
      const response = await fetchWithAuth(`${API_BASE_URL}/complaints`, {
        method: "POST",
        body: JSON.stringify(complaint),
      });
      console.log("Complaint created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to create complaint:", error);
      throw error;
    }
  },

  // Update a complaint
  update: async (
    id: string,
    updates: Partial<Complaint>,
  ): Promise<Complaint> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/complaints/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to update complaint:", error);
      throw error;
    }
  },

  // Delete a complaint
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/complaints/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      return false;
    }
  },
};

// Announcements API
export const AnnouncementsAPI = {
  getAll: async (filters?: {
    targetAudience?: "all" | "customers" | "coaches";
    status?: "draft" | "published" | "archived" | "scheduled";
  }): Promise<Announcement[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.targetAudience) {
        params.append("targetAudience", filters.targetAudience);
      }
      if (filters?.status) {
        params.append("status", filters.status);
      }

      const url = `${API_BASE_URL}/announcements${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      return [];
    }
  },

  create: async (payload: {
    title: string;
    content: string;
    type?: "general" | "maintenance" | "event" | "promotion" | "urgent";
    priority: "low" | "medium" | "high";
    targetAudience: "all" | "customers" | "coaches";
    status: "draft" | "published" | "archived" | "scheduled";
    expiryDate?: string;
  }): Promise<Announcement> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/announcements`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<Announcement>,
  ): Promise<Announcement> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/announcements/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    return response.data;
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/announcements/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      return false;
    }
  },
};

// Resources API
export const ResourcesAPI = {
  getAll: async (): Promise<ResourceItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      return [];
    }
  },

  create: async (payload: FormData): Promise<ResourceItem> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/resources`, {
        method: "POST",
        body: payload,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create resource:", error);
      throw error;
    }
  },

  update: async (id: string, payload: FormData): Promise<ResourceItem> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/resources/${id}`, {
        method: "PUT",
        body: payload,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to update resource:", error);
      throw error;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/resources/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Failed to delete resource:", error);
      return false;
    }
  },

  incrementDownload: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/resources/${id}/download`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("Failed to increment download count:", error);
    }
  },
};

// Feedback interface
export interface Feedback {
  _id?: string;
  id?: string;
  sessionId?: string;
  coachId: string;
  coachName: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  rating: number;
  feedback: string;
  submittedDate?: string;
  status: "pending" | "approved" | "rejected";
  reviewedDate?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionBill {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  customer: string;
  subscription: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  billingCycle: "monthly" | "annually";
  amount: number;
  currency: string;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  paidAt?: string;
  paymentMethod?: "cash" | "manual";
  paymentReference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionRecord {
  _id?: string;
  id?: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  billingCycle: "monthly" | "annually";
  amount: number;
  currency: string;
  status: "active" | "inactive" | "suspended" | "cancelled";
  paymentStatus: "pending" | "paid";
  activationDate: string;
  nextBillingDate?: string;
  paymentMethod?: "cash" | "manual";
  suspendedReason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionSummary {
  customer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt?: string;
  };
  currentSubscription: SubscriptionRecord | null;
  activeSubscription: SubscriptionRecord | null;
  subscriptions: SubscriptionRecord[];
  bills: SubscriptionBill[];
  pendingBills: SubscriptionBill[];
  paidBills: SubscriptionBill[];
}

export interface SubscriptionOverview {
  totals: {
    totalCustomers: number;
    totalMembers?: number;
    activeCoaches?: number;
    activeSubscriptions: number;
    pendingPayments: number;
    monthlySubscribers: number;
    annualSubscribers: number;
    monthlyRevenue?: number;
    sessionsThisMonth?: number;
  };
  customers: SubscriptionSummary[];
  subscriptions: SubscriptionRecord[];
  bills: SubscriptionBill[];
}

export interface CommunicationRecipient {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "coach" | "admin";
  coachStatus?: "pending" | "approved" | "rejected";
}

export interface CommunicationAttachment {
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
}

export interface CommunicationMessage {
  _id: string;
  id?: string;
  thread: string | CommunicationThread;
  sender: string | CommunicationRecipient;
  receiver: string | CommunicationRecipient;
  subject: string;
  content: string;
  attachments?: CommunicationAttachment[];
  readAt?: string;
  readBy?: string;
  deliveryStatus?: "pending" | "sent" | "failed";
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunicationThread {
  _id: string;
  id?: string;
  subject: string;
  participants: CommunicationRecipient[];
  lastMessage?: CommunicationMessage;
  lastMessageAt?: string;
  messageCount?: number;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunicationNotification {
  _id: string;
  id?: string;
  user: string | CommunicationRecipient;
  type: "message" | "announcement" | "system";
  title: string;
  body: string;
  relatedMessage?: string | CommunicationMessage;
  relatedThread?: string | CommunicationThread;
  actionUrl?: string;
  read: boolean;
  readAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Feedback API
export const FeedbackAPI = {
  // Get approved testimonials for the public homepage
  getApprovedTestimonials: async (): Promise<Feedback[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/testimonials`);
      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch approved testimonials:", error);
      return [];
    }
  },

  // Get all feedback
  getAll: async (): Promise<Feedback[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
      return [];
    }
  },

  // Get feedback for a specific customer
  getByCustomer: async (): Promise<Feedback[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch customer feedback:", error);
      return [];
    }
  },

  // Get feedback for a specific coach
  getByCoach: async (coachId: string): Promise<Feedback[]> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/feedback?coachId=${coachId}`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch coach feedback:", error);
      return [];
    }
  },

  // Create feedback
  create: async (
    feedback: Omit<Feedback, "id" | "_id" | "submittedDate">,
  ): Promise<Feedback> => {
    try {
      console.log("Creating feedback:", feedback);
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback`, {
        method: "POST",
        body: JSON.stringify(feedback),
      });
      console.log("Feedback created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to create feedback:", error);
      throw error;
    }
  },

  // Update feedback (admin moderation)
  update: async (id: string, updates: Partial<Feedback>): Promise<Feedback> => {
    try {
      console.log("Updating feedback:", id, updates);
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      console.log("Feedback updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to update feedback:", error);
      throw error;
    }
  },

  // Delete feedback
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/feedback/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Failed to delete feedback:", error);
      return false;
    }
  },
};

// Subscription API
export const SubscriptionAPI = {
  getMine: async (): Promise<SubscriptionSummary | null> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/subscriptions/me`);
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch subscription details:", error);
      return null;
    }
  },

  activate: async (subscription: {
    planName: string;
    billingCycle: "monthly" | "annually";
    amount: number;
    paymentMethod?: "cash" | "manual";
    notes?: string;
  }): Promise<{ subscription: SubscriptionRecord; bill: SubscriptionBill }> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/activate`,
        {
          method: "POST",
          body: JSON.stringify(subscription),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to activate subscription:", error);
      throw error;
    }
  },

  getAdminOverview: async (): Promise<SubscriptionOverview | null> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/admin/overview`,
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to load subscription overview:", error);
      return null;
    }
  },

  getCustomer: async (
    customerId: string,
  ): Promise<SubscriptionSummary | null> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/admin/customers/${customerId}`,
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to load customer subscription:", error);
      return null;
    }
  },

  markBillPaid: async (
    billId: string,
    updates?: {
      paymentMethod?: "cash" | "manual";
      paymentReference?: string;
      notes?: string;
    },
  ): Promise<{ bill: SubscriptionBill; subscription?: SubscriptionRecord }> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/admin/bills/${billId}/pay`,
        {
          method: "PUT",
          body: JSON.stringify(updates || {}),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to mark bill as paid:", error);
      throw error;
    }
  },

  updateStatus: async (
    subscriptionId: string,
    updates: {
      status?: SubscriptionRecord["status"];
      suspendedReason?: string;
      paymentStatus?: SubscriptionRecord["paymentStatus"];
    },
  ): Promise<SubscriptionRecord> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/admin/subscriptions/${subscriptionId}/status`,
        {
          method: "PUT",
          body: JSON.stringify(updates),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update subscription status:", error);
      throw error;
    }
  },
};

export const MessagesAPI = {
  getRecipients: async (): Promise<CommunicationRecipient[]> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/messages/recipients`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch message recipients:", error);
      return [];
    }
  },

  getThreads: async (filters?: {
    folder?: "inbox" | "sent" | "all";
    search?: string;
  }): Promise<CommunicationThread[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.folder) params.append("folder", filters.folder);
      if (filters?.search) params.append("search", filters.search);

      const response = await fetchWithAuth(
        `${API_BASE_URL}/messages/threads${params.toString() ? `?${params.toString()}` : ""}`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      return [];
    }
  },

  getInbox: async (search?: string): Promise<CommunicationThread[]> => {
    return MessagesAPI.getThreads({ folder: "inbox", search });
  },

  getSent: async (search?: string): Promise<CommunicationThread[]> => {
    return MessagesAPI.getThreads({ folder: "sent", search });
  },

  getThread: async (
    threadId: string,
  ): Promise<{
    thread: CommunicationThread;
    messages: CommunicationMessage[];
  } | null> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/messages/thread/${threadId}`,
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      return null;
    }
  },

  getMessage: async (
    messageId: string,
  ): Promise<CommunicationMessage | null> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/messages/${messageId}`,
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch message:", error);
      return null;
    }
  },

  send: async (payload: {
    receiverId: string;
    subject: string;
    content: string;
    threadId?: string;
    receiverRole?: "customer" | "coach" | "admin";
    attachments?: File[];
  }): Promise<{
    message: CommunicationMessage;
    thread: CommunicationThread;
  }> => {
    const formData = new FormData();
    formData.append("receiverId", payload.receiverId);
    formData.append("subject", payload.subject);
    formData.append("content", payload.content);

    if (payload.threadId) {
      formData.append("threadId", payload.threadId);
    }

    if (payload.receiverRole) {
      formData.append("receiverRole", payload.receiverRole);
    }

    payload.attachments?.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await fetchWithAuth(`${API_BASE_URL}/messages`, {
      method: "POST",
      body: formData,
    });

    return response.data;
  },

  broadcast: async (payload: {
    audience: "all" | "customers" | "coaches";
    subject: string;
    content: string;
    attachments?: File[];
  }): Promise<{ sentCount: number }> => {
    const formData = new FormData();
    formData.append("audience", payload.audience);
    formData.append("subject", payload.subject);
    formData.append("content", payload.content);

    payload.attachments?.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await fetchWithAuth(`${API_BASE_URL}/messages/broadcast`, {
      method: "POST",
      body: formData,
    });

    return response.data;
  },

  markRead: async (messageId: string): Promise<CommunicationMessage> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/messages/${messageId}/read`,
      {
        method: "PUT",
      },
    );
    return response.data;
  },

  getUnreadCount: async (): Promise<{
    unreadMessages: number;
    unreadNotifications: number;
    total: number;
  }> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/messages/unread-count`,
      );
      return (
        response.data || { unreadMessages: 0, unreadNotifications: 0, total: 0 }
      );
    } catch (error) {
      console.error("Failed to fetch unread counts:", error);
      return { unreadMessages: 0, unreadNotifications: 0, total: 0 };
    }
  },
};

export const NotificationsAPI = {
  getAll: async (filters?: {
    read?: boolean;
    type?: "message" | "announcement" | "system";
    search?: string;
  }): Promise<CommunicationNotification[]> => {
    try {
      const params = new URLSearchParams();
      if (typeof filters?.read === "boolean") {
        params.append("read", String(filters.read));
      }
      if (filters?.type) params.append("type", filters.type);
      if (filters?.search) params.append("search", filters.search);

      const response = await fetchWithAuth(
        `${API_BASE_URL}/notifications${params.toString() ? `?${params.toString()}` : ""}`,
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/notifications/unread-count`,
      );
      return response.data?.unreadCount || 0;
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      return 0;
    }
  },

  markRead: async (id: string): Promise<CommunicationNotification> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/notifications/${id}/read`,
      {
        method: "PUT",
      },
    );
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await fetchWithAuth(`${API_BASE_URL}/notifications/read-all`, {
      method: "PUT",
    });
  },
};

// Utility to clear all data (for testing)
export const clearAllData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("bookings");
    localStorage.removeItem("complaints");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

// Coaches API
export interface Coach {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specializations?: string[];
  certifications?: string[];
  bio?: string;
  hourlyRate?: number;
  experience?: number;
  coachStatus: "pending" | "approved" | "rejected";
  appliedDate?: string;
  documents?: string[];
  rating?: number;
  reviewCount?: number;
  activeClients?: number;
  availability?: any;
  blockedDates?: { id: string; date: string; reason: string }[];
  rejectionReason?: string;
}

export const CoachesAPI = {
  // Get all coaches with optional filters
  getAll: async (filters?: {
    coachStatus?: string;
    search?: string;
  }): Promise<Coach[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.coachStatus)
        params.append("coachStatus", filters.coachStatus);
      if (filters?.search) params.append("search", filters.search);

      const url = `${API_BASE_URL}/coaches${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetchWithAuth(url);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch coaches:", error);
      return [];
    }
  },

  // Get single coach by ID
  getById: async (id: string): Promise<Coach | null> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/coaches/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch coach:", error);
      return null;
    }
  },

  // Update coach status (admin only)
  updateStatus: async (
    id: string,
    coachStatus: string,
    rejectionReason?: string,
  ): Promise<Coach> => {
    try {
      console.log("Updating coach status:", id, coachStatus);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/coaches/${id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ coachStatus, rejectionReason }),
        },
      );
      console.log("Coach status updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to update coach status:", error);
      throw error;
    }
  },

  // Update coach profile
  update: async (id: string, updates: Partial<Coach>): Promise<Coach> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/coaches/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to update coach:", error);
      throw error;
    }
  },

  // Delete coach (admin only)
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/coaches/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Failed to delete coach:", error);
      return false;
    }
  },
};

// Auth API
export const AuthAPI = {
  register: async (userData: any) => {
    try {
      console.log("Registering user:", userData);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      console.log("Registration successful:", data);

      // Store token and user data
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user || data.data));
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  login: async (credentials: {
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      console.log("Logging in:", credentials.email, credentials.role);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      console.log("Login successful:", data);

      // Store token and user data
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user || data.data));
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
      return response.data;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  },

  updateProfile: async (updates: any) => {
    try {
      console.log("Updating profile:", updates);
      const response = await fetchWithAuth(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      console.log("Profile updated:", response.data);

      // Update localStorage with new user data
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }

      return response.data;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  },
};
