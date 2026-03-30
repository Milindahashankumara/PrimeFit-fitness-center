'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeedbackAPI } from '@/app/lib/api';
import { 
  ArrowLeft,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  User,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface FeedbackSubmission {
  id: string;
  sessionId: string;
  coachName: string;
  customerName: string;
  rating: number;
  feedback: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedDate?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const AdminFeedbackModerationPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);

  // Load feedback from API on mount
  useEffect(() => {
    const loadFeedback = async () => {
      try {
        setIsLoading(true);
        const feedbacks = await FeedbackAPI.getAll();
        console.log('Loaded feedback:', feedbacks);
        
        const transformed = feedbacks.map((f: any) => ({
          id: f._id || f.id,
          sessionId: f.sessionId || '',
          coachName: f.coachName,
          customerName: f.customerName || 'Anonymous',
          rating: f.rating,
          feedback: f.feedback,
          submittedDate: f.submittedDate ? new Date(f.submittedDate).toISOString().split('T')[0] : '',
          status: f.status,
          reviewedDate: f.reviewedDate ? new Date(f.reviewedDate).toISOString().split('T')[0] : undefined,
          reviewedBy: f.reviewedBy,
          rejectionReason: f.rejectionReason
        }));
        
        setFeedbackList(transformed);
      } catch (error) {
        console.error('Failed to load feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadFeedback, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (feedback: FeedbackSubmission, action: 'approve' | 'reject') => {
    setSelectedFeedback(feedback);
    setActionType(action);
    setRejectionReason('');
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedFeedback) return;

    try {
      setIsProcessing(true);

      // Update feedback status via API
      const updatedFeedback = await FeedbackAPI.update(selectedFeedback.id, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        rejectionReason: actionType === 'reject' ? rejectionReason : undefined
      });

      console.log('Feedback updated:', updatedFeedback);

      // Update local state
      setFeedbackList(feedbackList.map(fb =>
        fb.id === selectedFeedback.id ? {
          ...fb,
          status: actionType === 'approve' ? 'approved' : 'rejected',
          reviewedDate: new Date().toISOString().split('T')[0],
          reviewedBy: 'Admin Team',
          rejectionReason: actionType === 'reject' ? rejectionReason : undefined
        } : fb
      ));

      setShowActionModal(false);
      setSelectedFeedback(null);
      setSuccessMessage(
        actionType === 'approve' 
          ? 'Feedback approved successfully!'
          : 'Feedback rejected successfully.'
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update feedback:', error);
      setSuccessMessage('Failed to update feedback. Please try again.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFilteredFeedback = () => {
    let filtered = feedbackList;
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(fb => fb.status === activeTab);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(fb =>
        fb.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fb.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fb.feedback.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredFeedback = getFilteredFeedback();

  const getPendingCount = () => feedbackList.filter(f => f.status === 'pending').length;
  const getApprovedCount = () => feedbackList.filter(f => f.status === 'approved').length;
  const getRejectedCount = () => feedbackList.filter(f => f.status === 'rejected').length;
  const getAverageRating = () => {
    const approved = feedbackList.filter(f => f.status === 'approved');
    if (approved.length === 0) return 0;
    return (approved.reduce((sum, f) => sum + f.rating, 0) / approved.length).toFixed(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'approved': return 'text-green-400 bg-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
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
              <h1 className="text-2xl font-bold">Customer Feedback Moderation</h1>
              <p className="text-sm text-gray-400">Review and approve customer testimonials</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Alert for Pending */}
        {getPendingCount() > 0 && (
          <div className="mb-8 bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-yellow-500" size={24} />
            <div>
              <p className="font-semibold text-yellow-400">
                {getPendingCount()} feedback submission{getPendingCount() > 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-sm text-yellow-400/80">Review and moderate customer feedback before publication</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="text-yellow-500" size={32} />
              {getPendingCount() > 0 && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Review</span>
              )}
            </div>
            <p className="text-3xl font-bold">{getPendingCount()}</p>
            <p className="text-sm text-gray-400">Pending Review</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <CheckCircle className="text-green-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{getApprovedCount()}</p>
            <p className="text-sm text-gray-400">Approved</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <XCircle className="text-red-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{getRejectedCount()}</p>
            <p className="text-sm text-gray-400">Rejected</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-yellow-500 fill-yellow-500" size={32} />
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold">{getAverageRating()}</p>
            <p className="text-sm text-gray-400">Average Rating</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, coach name, or feedback content..."
              className="w-full bg-brand-gray border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-red focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 bg-brand-gray p-2 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare size={18} />
            Pending ({getPendingCount()})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'approved'
                ? 'bg-green-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle size={18} />
            Approved ({getApprovedCount()})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'rejected'
                ? 'bg-red-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <XCircle size={18} />
            Rejected ({getRejectedCount()})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-brand-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Filter size={18} />
            All ({feedbackList.length})
          </button>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <div className="bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
              <MessageSquare className="mx-auto mb-4 text-gray-600" size={64} />
              <h3 className="text-xl font-bold mb-2">No Feedback Found</h3>
              <p className="text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : `No ${activeTab !== 'all' ? activeTab : ''} feedback at this time`}
              </p>
            </div>
          ) : (
            filteredFeedback.map((feedback) => (
              <div key={feedback.id} className="bg-brand-gray rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center font-bold">
                          {feedback.customerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-bold">{feedback.customerName}</h3>
                          <p className="text-sm text-gray-400">Session with {feedback.coachName}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg ${getStatusColor(feedback.status)}`}>
                        <span className="text-xs font-semibold capitalize">{feedback.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={20}
                          className={star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold">{feedback.rating}/5</span>
                    </div>

                    <div className="bg-black/40 p-4 rounded-lg mb-4">
                      <p className="text-gray-300">{feedback.feedback}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Submitted: {new Date(feedback.submittedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {feedback.reviewedDate && (
                        <span>
                          Reviewed: {new Date(feedback.reviewedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                      {feedback.reviewedBy && (
                        <span>By {feedback.reviewedBy}</span>
                      )}
                    </div>

                    {feedback.rejectionReason && (
                      <div className="mt-3 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                        <p className="text-sm text-red-400">
                          <strong>Rejection Reason:</strong> {feedback.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {feedback.status === 'pending' && (
                    <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                      <button
                        onClick={() => handleAction(feedback, 'approve')}
                        className="flex-1 lg:flex-none bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <ThumbsUp size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(feedback, 'reject')}
                        className="flex-1 lg:flex-none bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <ThumbsDown size={18} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">
              {actionType === 'approve' ? 'Approve Feedback' : 'Reject Feedback'}
            </h3>

            <div className="bg-black/40 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedFeedback.customerName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold">{selectedFeedback.customerName}</p>
                  <p className="text-sm text-gray-400">Session with {selectedFeedback.coachName}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= selectedFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                  />
                ))}
              </div>

              <p className="text-sm text-gray-300">{selectedFeedback.feedback}</p>
            </div>

            {actionType === 'approve' ? (
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg mb-4">
                <p className="text-sm text-green-400">
                  ✓ This feedback will be published to the "What Our Customers Say" section on the homepage.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold mb-2">Reason for rejection (optional)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide feedback to improve future submissions..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none mb-4"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedFeedback(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  actionType === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackModerationPage;
