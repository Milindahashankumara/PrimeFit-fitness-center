'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ComplaintsAPI } from '@/app/lib/api';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface Complaint {
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
}

const ComplaintsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    category: 'coach',
    description: '',
    priority: 'medium'
  });

  // Mock complaint history - will be loaded from API
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Load user's complaints from API on mount
  useEffect(() => {
    const loadUserComplaints = async () => {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user) {
        console.log('No user found in localStorage');
        return;
      }

      try {
        console.log('Fetching complaints for:', user.email);
        const apiComplaints = await ComplaintsAPI.getByCustomer(user.email);
        console.log('Fetched complaints:', apiComplaints);
        
        // Ensure apiComplaints is an array
        const complaintsArray = Array.isArray(apiComplaints) ? apiComplaints : [];
        setComplaints(complaintsArray);
      } catch (error) {
        console.error('Failed to load complaints:', error);
        setComplaints([]);
      }
    };

    loadUserComplaints();
    // Poll for updates every 5 seconds to catch admin responses
    const interval = setInterval(loadUserComplaints, 5000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { value: 'coach', label: 'Coach Related', icon: User },
    { value: 'facility', label: 'Facility Issues', icon: AlertTriangle },
    { value: 'booking', label: 'Booking Problems', icon: Calendar },
    { value: 'billing', label: 'Billing & Payments', icon: FileText },
    { value: 'other', label: 'Other', icon: MessageSquare }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-blue-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'high', label: 'High', color: 'text-red-400' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get user data
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : { name: 'Anonymous', email: 'unknown@email.com' };
    
    try {
      console.log('Submitting complaint:', formData);
      
      // Create new complaint via API
      const newComplaint = await ComplaintsAPI.create({
        subject: formData.subject,
        category: formData.category,
        description: formData.description,
        customerName: user.name,
        customerEmail: user.email,
        priority: formData.priority as 'low' | 'medium' | 'high'
      });
      
      console.log('Complaint submitted:', newComplaint);
      
      // Update local state
      setComplaints([newComplaint, ...complaints]);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        subject: '',
        category: 'coach',
        description: '',
        priority: 'medium'
      });
      
      // Hide success message and switch to history tab
      setTimeout(() => {
        setShowSuccess(false);
        setActiveTab('history');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-400 bg-green-500/20';
      case 'in-progress':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'pending':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} />;
      case 'in-progress':
        return <Clock size={16} />;
      case 'pending':
        return <AlertCircle size={16} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="bg-brand-gray border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:text-brand-red transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Complaints & Feedback</h1>
              <p className="text-sm text-gray-400">Submit issues or view your complaint history</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="font-semibold text-green-400">Complaint submitted successfully!</p>
              <p className="text-sm text-green-300">We'll review your complaint and respond within 24-48 hours.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-brand-gray p-2 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'submit'
                ? 'bg-brand-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Submit Complaint
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'history'
                ? 'bg-brand-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Complaint History
          </button>
        </div>

        {/* Submit Complaint Tab */}
        {activeTab === 'submit' && (
          <div className="bg-brand-gray rounded-2xl p-8 border border-white/10">
            <div className="flex items-start gap-4 mb-6 bg-blue-500/20 border border-blue-500 p-4 rounded-lg">
              <Shield className="text-blue-400 shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-blue-400 mb-1">We Value Your Feedback</h3>
                <p className="text-sm text-gray-300">
                  Your complaints help us improve our services. All submissions are reviewed by our support team within 24-48 hours.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold mb-2">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Brief description of your complaint"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-3">Category *</label>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleInputChange('category', category.value)}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          formData.category === category.value
                            ? 'bg-brand-red border-brand-red text-white'
                            : 'bg-black/40 border-white/10 hover:border-brand-red'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="text-sm font-medium">{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold mb-3">Priority Level</label>
                <div className="flex gap-3">
                  {priorities.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => handleInputChange('priority', priority.value)}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all font-semibold ${
                        formData.priority === priority.value
                          ? 'bg-brand-red border-brand-red text-white'
                          : 'bg-black/40 border-white/10 hover:border-brand-red'
                      }`}
                    >
                      <span className={formData.priority === priority.value ? '' : priority.color}>
                        {priority.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">Detailed Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please provide as much detail as possible about your complaint..."
                  required
                  rows={6}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {formData.description.length} / 1000 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!formData.subject || !formData.description}
                className="w-full bg-brand-red hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Submit Complaint
              </button>
            </form>
          </div>
        )}

        {/* Complaint History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
                <MessageSquare className="mx-auto mb-4 text-gray-600" size={64} />
                <h3 className="text-xl font-bold mb-2">No Complaints Yet</h3>
                <p className="text-gray-400 mb-6">You haven't submitted any complaints or feedback.</p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="bg-brand-red hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Submit Your First Complaint
                </button>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-brand-gray rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500/20 p-3 rounded-lg">
                        <AlertCircle className="text-red-400" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {complaints.filter(c => c.status === 'pending').length}
                        </p>
                        <p className="text-sm text-gray-400">Pending</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-gray rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500/20 p-3 rounded-lg">
                        <Clock className="text-yellow-400" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {complaints.filter(c => c.status === 'in-progress').length}
                        </p>
                        <p className="text-sm text-gray-400">In Progress</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-gray rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <CheckCircle className="text-green-400" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {complaints.filter(c => c.status === 'resolved').length}
                        </p>
                        <p className="text-sm text-gray-400">Resolved</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaint List */}
                {complaints.map((complaint) => (
                  <div key={complaint._id || complaint.id} className="bg-brand-gray rounded-2xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{complaint.subject}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(complaint.createdAt || complaint.date || '').toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="px-2 py-1 bg-black/40 rounded">
                            {categories.find(c => c.value === complaint.category)?.label}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        <span className="text-sm font-semibold capitalize">{complaint.status}</span>
                      </div>
                    </div>

                    <div className="bg-black/40 p-4 rounded-lg mb-4">
                      <p className="text-gray-300">{complaint.description}</p>
                    </div>

                    {complaint.response && (
                      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="text-green-400" size={20} />
                          <span className="font-semibold text-green-400">Response from Support Team</span>
                          {complaint.responseDate && (
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(complaint.responseDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300">{complaint.response}</p>
                      </div>
                    )}

                    {complaint.status !== 'resolved' && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                        <button className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-semibold transition-colors">
                          Update Complaint
                        </button>
                        <button className="px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg font-semibold transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsPage;
