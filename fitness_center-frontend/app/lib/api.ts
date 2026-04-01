// Backend API integration
// This connects to the real backend at http://localhost:5000

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠️ No auth token found - user may need to login');
  }

  console.log('🌐 API Request:', url);

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    console.error('❌ API Error:', error.message);
    
    // If unauthorized, clear invalid token
    if (response.status === 401) {
      console.warn('⚠️ Unauthorized - clearing token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
    
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

export interface Booking {
  _id?: string; // MongoDB ID
  id?: string; // Alias for compatibility
  customerId: string;
  customerName: string;
  customerEmail: string;
  coachId: string;
  coachName: string;
  date: string;
  time: string;
  type: 'personal' | 'group' | 'online';
  duration: number;
  price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'rescheduled';
  message?: string;
  requestedAt: string;
  sessionType: string;
  location?: string;
  rescheduledBy?: string;
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
  rescheduledAt?: string;
}

export interface Complaint {
  _id: string;
  id?: string;
  subject: string;
  category: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  createdAt: string;
  date?: string;
  customerName: string;
  customerEmail: string;
  priority: 'low' | 'medium' | 'high';
  response?: string;
  responseDate?: string;
  resolvedBy?: string;
}

// Bookings API
export const BookingsAPI = {
  // Get all bookings
  getAll: async (): Promise<Booking[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      return [];
    }
  },

  // Get bookings for a specific customer
  getByCustomer: async (customerEmail: string): Promise<Booking[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings?customerEmail=${customerEmail}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch customer bookings:', error);
      return [];
    }
  },

  // Get bookings for a specific coach
  getByCoach: async (coachId: string): Promise<Booking[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings?coachId=${coachId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch coach bookings:', error);
      return [];
    }
  },

  // Create a new booking
  create: async (booking: Omit<Booking, 'id' | 'requestedAt'>): Promise<Booking> => {
    try {
      console.log('Creating booking:', booking);
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        body: JSON.stringify(booking)
      });
      console.log('Booking created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  },

  // Update a booking
  update: async (id: string, updates: Partial<Booking>): Promise<Booking> => {
    try {
      console.log('Updating booking:', id, updates);
      const response = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      console.log('Booking updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update booking:', error);
      throw error;
    }
  },

  // Delete a booking
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete booking:', error);
      return false;
    }
  }
};

// Complaints API
export const ComplaintsAPI = {
  // Get all complaints
  getAll: async (): Promise<Complaint[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/complaints`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      return [];
    }
  },

  // Get complaints for a specific customer
  getByCustomer: async (customerEmail: string): Promise<Complaint[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/complaints?customerEmail=${customerEmail}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch customer complaints:', error);
      return [];
    }
  },

  // Create a new complaint
  create: async (complaint: Omit<Complaint, '_id' | 'id' | 'createdAt' | 'date' | 'status'>): Promise<Complaint> => {
    try {
      console.log('Creating complaint:', complaint);
      const response = await fetchWithAuth(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        body: JSON.stringify(complaint)
      });
      console.log('Complaint created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create complaint:', error);
      throw error;
    }
  },

  // Update a complaint
  update: async (id: string, updates: Partial<Complaint>): Promise<Complaint> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update complaint:', error);
      throw error;
    }
  },

  // Delete a complaint
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/complaints/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete complaint:', error);
      return false;
    }
  }
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
  status: 'pending' | 'approved' | 'rejected';
  reviewedDate?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Feedback API
export const FeedbackAPI = {
  // Get all feedback
  getAll: async (): Promise<Feedback[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      return [];
    }
  },

  // Get feedback for a specific customer
  getByCustomer: async (): Promise<Feedback[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch customer feedback:', error);
      return [];
    }
  },

  // Get feedback for a specific coach
  getByCoach: async (coachId: string): Promise<Feedback[]> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback?coachId=${coachId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch coach feedback:', error);
      return [];
    }
  },

  // Create feedback
  create: async (feedback: Omit<Feedback, 'id' | '_id' | 'submittedDate'>): Promise<Feedback> => {
    try {
      console.log('Creating feedback:', feedback);
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        body: JSON.stringify(feedback)
      });
      console.log('Feedback created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create feedback:', error);
      throw error;
    }
  },

  // Update feedback (admin moderation)
  update: async (id: string, updates: Partial<Feedback>): Promise<Feedback> => {
    try {
      console.log('Updating feedback:', id, updates);
      const response = await fetchWithAuth(`${API_BASE_URL}/feedback/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      console.log('Feedback updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update feedback:', error);
      throw error;
    }
  },

  // Delete feedback
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/feedback/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete feedback:', error);
      return false;
    }
  }
};

// Utility to clear all data (for testing)
export const clearAllData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bookings');
    localStorage.removeItem('complaints');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
  coachStatus: 'pending' | 'approved' | 'rejected';
  appliedDate?: string;
  documents?: string[];
  rating?: number;
  reviewCount?: number;
  activeClients?: number;
  availability?: any[];
  rejectionReason?: string;
}

export const CoachesAPI = {
  // Get all coaches with optional filters
  getAll: async (filters?: { coachStatus?: string; search?: string }): Promise<Coach[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.coachStatus) params.append('coachStatus', filters.coachStatus);
      if (filters?.search) params.append('search', filters.search);
      
      const url = `${API_BASE_URL}/coaches${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetchWithAuth(url);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
      return [];
    }
  },

  // Get single coach by ID
  getById: async (id: string): Promise<Coach | null> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/coaches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch coach:', error);
      return null;
    }
  },

  // Update coach status (admin only)
  updateStatus: async (id: string, coachStatus: string, rejectionReason?: string): Promise<Coach> => {
    try {
      console.log('Updating coach status:', id, coachStatus);
      const response = await fetchWithAuth(`${API_BASE_URL}/coaches/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ coachStatus, rejectionReason })
      });
      console.log('Coach status updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update coach status:', error);
      throw error;
    }
  },

  // Update coach profile
  update: async (id: string, updates: Partial<Coach>): Promise<Coach> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/coaches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update coach:', error);
      throw error;
    }
  },

  // Delete coach (admin only)
  delete: async (id: string): Promise<boolean> => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/coaches/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete coach:', error);
      return false;
    }
  }
};

// Auth API
export const AuthAPI = {
  register: async (userData: any) => {
    try {
      console.log('Registering user:', userData);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      
      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || data.data));
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (credentials: { email: string; password: string; role: string }) => {
    try {
      console.log('Logging in:', credentials.email, credentials.role);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || data.data));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  updateProfile: async (updates: any) => {
    try {
      console.log('Updating profile:', updates);
      const response = await fetchWithAuth(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      console.log('Profile updated:', response.data);
      
      // Update localStorage with new user data
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }
};
