'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ComplaintsAPI } from '@/app/lib/api';
import { 
  ArrowLeft, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Search,
  Filter,
  Send,
  CheckCheck,
  XCircle
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
  resolvedBy?: string;
}

const AdminComplaintsPage = () => {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'in-progress' | 'resolved' | 'rejected'>('resolved');
  const [showSuccess, setShowSuccess] = useState(false);

  // Load complaints from API
  useEffect(() => {
    const loadComplaints = async () => {
      try {
        console.log('📋 Admin loading all complaints from API...');
        const apiComplaints = await ComplaintsAPI.getAll();
        console.log('✅ Loaded complaints:', apiComplaints);
        
        // Ensure it's an array
        const complaintsArray = Array.isArray(apiComplaints) ? apiComplaints : [];
        setComplaints(complaintsArray);
      } catch (error) {
        console.error('❌ Failed to load complaints:', error);
        setComplaints([]);
      }
    };

    loadComplaints();
    // Poll for new complaints every 10 seconds
    const interval = setInterval(loadComplaints, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter complaints whenever the active tab, search term, or complaints change
  useEffect(() => {
    let filtered = complaints;

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, activeTab, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-400 bg-green-500/20';
      case 'in-progress':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'pending':
        return 'text-red-400 bg-red-500/20';
      case 'rejected':
        return 'text-gray-400 bg-gray-500/20';
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
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 border-red-500';
      case 'medium':
        return 'text-yellow-400 border-yellow-500';
      case 'low':
        return 'text-blue-400 border-blue-500';
      default:
        return 'text-gray-400 border-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coach':
        return <User size={18} />;
      case 'facility':
        return <AlertTriangle size={18} />;
      case 'booking':
        return <Calendar size={18} />;
      case 'billing':
        return <FileText size={18} />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  const handleOpenResponseModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResponseText(complaint.response || '');
    setResponseStatus(complaint.status === 'pending' ? 'in-progress' : complaint.status as any);
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const complaintId = selectedComplaint._id || selectedComplaint.id;
    
    try {
      console.log('📤 Submitting admin response for complaint:', complaintId);
      
      // Update complaint via API
      const updatedComplaint = await ComplaintsAPI.update(complaintId!, {
        status: responseStatus,
        response: responseText,
        responseDate: new Date().toISOString(),
        resolvedBy: user.name || 'Administrator'
      });
      
      console.log('✅ Complaint updated:', updatedComplaint);
      
      // Update local state
      const updatedComplaints = complaints.map(c => 
        (c._id || c.id) === complaintId ? updatedComplaint : c
      );
      setComplaints(updatedComplaints);

      // Close modal and show success
      setShowResponseModal(false);
      setSelectedComplaint(null);
      setResponseText('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Failed to update complaint:', error);
      alert('Failed to send response. Please try again.');
    }
  };

  const getCount = (status: string) => {
    if (status === 'all') return complaints.length;
    return complaints.filter(c => c.status === status).length;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <h1 className="text-2xl font-bold">Customer Complaints Management</h1>
              <p className="text-sm text-gray-400">Review and respond to customer complaints</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">Response sent successfully!</p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-gray-400" size={24} />
              </div>
              <span className="text-2xl font-bold">{getCount('all')}</span>
            </div>
            <p className="text-gray-400 text-sm">Total Complaints</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-400" size={24} />
              </div>
              <span className="text-2xl font-bold text-red-400">{getCount('pending')}</span>
            </div>
            <p className="text-gray-400 text-sm">Pending Review</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-400" size={24} />
              </div>
              <span className="text-2xl font-bold text-yellow-400">{getCount('in-progress')}</span>
            </div>
            <p className="text-gray-400 text-sm">In Progress</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <span className="text-2xl font-bold text-green-400">{getCount('resolved')}</span>
            </div>
            <p className="text-gray-400 text-sm">Resolved</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-brand-gray rounded-xl p-6 border border-white/10 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search complaints by subject, description, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-brand-gray rounded-xl p-2 mb-6 inline-flex gap-2">
          {['all', 'pending', 'in-progress', 'resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-brand-red text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
              <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                {getCount(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-brand-gray rounded-xl p-12 text-center border border-white/10">
            <MessageSquare className="mx-auto text-gray-600 mb-4" size={64} />
            <h3 className="text-xl font-bold mb-2">No complaints found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'No complaints to display'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div key={complaint._id || complaint.id} className="bg-brand-gray rounded-xl p-6 border border-white/10 hover:border-brand-red/50 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-lg bg-brand-red/20`}>
                        {getCategoryIcon(complaint.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{complaint.subject}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {complaint.customerName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(complaint.createdAt || complaint.date || '')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority.toUpperCase()}
                            </span>
                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                              {getStatusIcon(complaint.status)}
                              {complaint.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-black/40 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-300 leading-relaxed">{complaint.description}</p>
                        </div>

                        <div className="text-xs text-gray-500">
                          <strong>Category:</strong> {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)} • 
                          <strong className="ml-2">Email:</strong> {complaint.customerEmail}
                        </div>

                        {complaint.response && (
                          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCheck className="text-green-400" size={16} />
                              <span className="text-sm font-semibold text-green-400">Admin Response</span>
                              {complaint.resolvedBy && (
                                <span className="text-xs text-gray-400">by {complaint.resolvedBy}</span>
                              )}
                              {complaint.responseDate && (
                                <span className="text-xs text-gray-400">• {formatDate(complaint.responseDate)}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-300">{complaint.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleOpenResponseModal(complaint)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      complaint.status === 'resolved' || complaint.status === 'rejected'
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-brand-red hover:bg-red-700'
                    }`}
                  >
                    <Send size={16} />
                    {complaint.response ? 'Update Response' : 'Respond'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold">Respond to Complaint</h2>
              <p className="text-gray-400 text-sm mt-1">{selectedComplaint.subject}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Complaint */}
              <div className="bg-black/40 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Original Complaint</p>
                <p className="text-sm text-gray-300">{selectedComplaint.description}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <User size={12} />
                  {selectedComplaint.customerName} • {selectedComplaint.customerEmail}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3">Update Status</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setResponseStatus('in-progress')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      responseStatus === 'in-progress'
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-white/20 bg-black/40 hover:border-yellow-500/50'
                    }`}
                  >
                    <Clock className="mx-auto mb-2 text-yellow-400" size={24} />
                    <p className="text-sm font-semibold">In Progress</p>
                  </button>
                  <button
                    onClick={() => setResponseStatus('resolved')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      responseStatus === 'resolved'
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-white/20 bg-black/40 hover:border-green-500/50'
                    }`}
                  >
                    <CheckCircle className="mx-auto mb-2 text-green-400" size={24} />
                    <p className="text-sm font-semibold">Resolved</p>
                  </button>
                  <button
                    onClick={() => setResponseStatus('rejected')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      responseStatus === 'rejected'
                        ? 'border-gray-500 bg-gray-500/20'
                        : 'border-white/20 bg-black/40 hover:border-gray-500/50'
                    }`}
                  >
                    <XCircle className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm font-semibold">Rejected</p>
                  </button>
                </div>
              </div>

              {/* Response Text */}
              <div>
                <label className="block text-sm font-semibold mb-3">Your Response</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the customer..."
                  rows={6}
                  className="w-full bg-black/40 border border-white/20 rounded-lg p-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition-colors resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedComplaint(null);
                  setResponseText('');
                }}
                className="px-6 py-3 rounded-lg font-semibold bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={!responseText.trim()}
                className="px-6 py-3 rounded-lg font-semibold bg-brand-red hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaintsPage;
