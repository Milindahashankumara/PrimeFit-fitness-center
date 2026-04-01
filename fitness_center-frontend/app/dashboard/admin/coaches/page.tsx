'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CoachesAPI, type Coach } from '@/app/lib/api';
import { 
  ArrowLeft, 
  User,
  Mail,
  Phone,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Shield,
  Filter,
  Search,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';

interface CoachApplication {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  experience?: number;
  specializations?: string[];
  certifications?: string[];
  bio?: string;
  hourlyRate?: number;
  status: 'pending' | 'approved' | 'rejected';
  coachStatus?: 'pending' | 'approved' | 'rejected';
  appliedDate?: string;
  documents?: string[];
  rating?: number;
  reviewCount?: number;
  activeClients?: number;
  rejectionReason?: string;
}

const CoachesApprovalPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<CoachApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNote, setActionNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coachApplications, setCoachApplications] = useState<CoachApplication[]>([]);

  // Load coaches from API
  useEffect(() => {
    loadCoaches();
    const interval = setInterval(loadCoaches, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading coaches from API...');
      const coaches = await CoachesAPI.getAll();
      console.log('Coaches loaded:', coaches);
      
      // Transform coaches to match CoachApplication interface
      const applications: CoachApplication[] = coaches.map((coach: Coach) => ({
        id: coach._id || coach.id || '',
        _id: coach._id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        experience: coach.experience || 0,
        specializations: coach.specializations || [],
        certifications: coach.certifications || [],
        bio: coach.bio || '',
        hourlyRate: coach.hourlyRate || 0,
        status: coach.coachStatus,
        coachStatus: coach.coachStatus,
        appliedDate: coach.appliedDate || new Date().toISOString(),
        documents: coach.documents || [],
        rating: coach.rating || 0,
        reviewCount: coach.reviewCount || 0,
        activeClients: coach.activeClients || 0,
        rejectionReason: coach.rejectionReason
      }));
      
      setCoachApplications(applications);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load coaches:', err);
      setError(err.message || 'Failed to load coaches');
      setLoading(false);
    }
  };

  const handleAction = (coach: CoachApplication, action: 'approve' | 'reject') => {
    setSelectedCoach(coach);
    setActionType(action);
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    if (selectedCoach) {
      try {
        const status = actionType === 'approve' ? 'approved' : 'rejected';
        console.log('Updating coach status:', selectedCoach.id, status);
        
        await CoachesAPI.updateStatus(
          selectedCoach._id || selectedCoach.id,
          status,
          actionType === 'reject' ? actionNote : undefined
        );
        
        // Reload coaches to get updated data
        await loadCoaches();
        
        setShowActionModal(false);
        setSelectedCoach(null);
        setActionNote('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err: any) {
        console.error('Failed to update coach status:', err);
        alert('Failed to update coach status: ' + err.message);
      }
    }
  };

  const handleViewDetails = (coach: CoachApplication) => {
    setSelectedCoach(coach);
    setShowDetailsModal(true);
  };

  const getFilteredCoaches = () => {
    let filtered = coachApplications;
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(coach => coach.status === activeTab);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(coach =>
        coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specializations?.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredCoaches = getFilteredCoaches();

  const getPendingCount = () => coachApplications.filter(c => c.status === 'pending').length;
  const getApprovedCount = () => coachApplications.filter(c => c.status === 'approved').length;
  const getRejectedCount = () => coachApplications.filter(c => c.status === 'rejected').length;

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
              <h1 className="text-2xl font-bold">Coach Registrations</h1>
              <p className="text-sm text-gray-400">Review and approve coach applications</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
              <p className="text-gray-400">Loading coach applications...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <p className="font-semibold text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">
              Coach application {actionType === 'approve' ? 'approved' : 'rejected'} successfully!
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-500" size={32} />
              {getPendingCount() > 0 && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Action Needed</span>
              )}
            </div>
            <p className="text-3xl font-bold">{getPendingCount()}</p>
            <p className="text-sm text-gray-400">Pending Review</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <p className="text-3xl font-bold">{getApprovedCount()}</p>
            <p className="text-sm text-gray-400">Approved Coaches</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="text-red-500" size={32} />
            </div>
            <p className="text-3xl font-bold">{getRejectedCount()}</p>
            <p className="text-sm text-gray-400">Rejected</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <User className="text-brand-red" size={32} />
            </div>
            <p className="text-3xl font-bold">{coachApplications.length}</p>
            <p className="text-sm text-gray-400">Total Applications</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or specialization..."
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
            <Clock size={18} />
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
            All ({coachApplications.length})
          </button>
        </div>

        {/* Coach Applications List */}
        <div className="space-y-4">
          {filteredCoaches.length === 0 ? (
            <div className="bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
              <User className="mx-auto mb-4 text-gray-600" size={64} />
              <h3 className="text-xl font-bold mb-2">No applications found</h3>
              <p className="text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : `No ${activeTab !== 'all' ? activeTab : ''} applications at this time`}
              </p>
            </div>
          ) : (
            filteredCoaches.map((coach) => (
              <div key={coach.id} className="bg-brand-gray rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center font-bold text-xl">
                          {coach.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{coach.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail size={14} />
                            {coach.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone size={14} />
                            {coach.phone}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg ${getStatusColor(coach.status)}`}>
                        <span className="text-sm font-semibold capitalize">{coach.status}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/40 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Award size={18} />
                          <span className="text-sm font-semibold">Experience & Rate</span>
                        </div>
                        <p className="font-bold">{coach.experience} years • ${coach.hourlyRate}/hour</p>
                      </div>

                      <div className="bg-black/40 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Shield size={18} />
                          <span className="text-sm font-semibold">Certifications</span>
                        </div>
                        <p className="text-sm">{coach.certifications?.join(', ') || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Specializations:</p>
                      <div className="flex flex-wrap gap-2">
                        {coach.specializations?.map((spec) => (
                          <span
                            key={spec}
                            className="text-xs bg-brand-red/20 text-brand-red px-3 py-1 rounded-full border border-brand-red/30"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-300">{coach.bio}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Applied: {new Date(coach.appliedDate || new Date()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                      {coach.documents && (
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          {coach.documents.length} documents
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                    <button
                      onClick={() => handleViewDetails(coach)}
                      className="flex-1 lg:flex-none bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      View Details
                    </button>
                    {coach.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(coach, 'approve')}
                          className="flex-1 lg:flex-none bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(coach, 'reject')}
                          className="flex-1 lg:flex-none bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCoach && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Coach Application Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="hover:text-brand-red transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-brand-red rounded-full flex items-center justify-center font-bold text-2xl">
                  {selectedCoach.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedCoach.name}</h3>
                  <div className={`inline-block px-3 py-1 rounded-lg mt-1 ${getStatusColor(selectedCoach.status)}`}>
                    <span className="text-sm font-semibold capitalize">{selectedCoach.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="font-semibold">{selectedCoach.email}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Phone</p>
                  <p className="font-semibold">{selectedCoach.phone}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Experience</p>
                  <p className="font-semibold">{selectedCoach.experience} years</p>
                </div>
                <div className="bg-black/40 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Hourly Rate</p>
                  <p className="font-semibold text-brand-red">${selectedCoach.hourlyRate}/hour</p>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Bio</p>
                <p className="text-gray-300">{selectedCoach.bio}</p>
              </div>

              <div className="bg-black/40 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Specializations</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCoach.specializations?.map((spec) => (
                    <span
                      key={spec}
                      className="bg-brand-red/20 text-brand-red px-3 py-1 rounded-full text-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Certifications</p>
                <ul className="space-y-1">
                  {selectedCoach.certifications?.map((cert) => (
                    <li key={cert} className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span>{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedCoach.documents && selectedCoach.documents.length > 0 && (
                <div className="bg-black/40 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Submitted Documents</p>
                  <div className="space-y-2">
                    {selectedCoach.documents?.map((doc) => (
                      <div key={doc} className="flex items-center justify-between bg-brand-gray p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="text-blue-400" size={18} />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <button className="text-brand-red hover:underline text-sm">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedCoach.status === 'pending' && (
              <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleAction(selectedCoach, 'approve');
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Approve Coach
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleAction(selectedCoach, 'reject');
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedCoach && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-lg w-full p-6 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Coach Application
            </h3>

            <div className="bg-black/40 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-400 mb-2">Coach Name</p>
              <p className="font-bold mb-3">{selectedCoach.name}</p>
              
              <p className="text-sm text-gray-400 mb-2">Email</p>
              <p className="font-semibold">{selectedCoach.email}</p>
            </div>

            {actionType === 'approve' ? (
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 shrink-0 mt-1" size={20} />
                  <p className="text-green-400 text-sm">
                    By approving this application, {selectedCoach.name} will be granted coach access and can start accepting bookings from clients.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Provide feedback to the applicant..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none mb-4"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedCoach(null);
                  setActionNote('');
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

export default CoachesApprovalPage;
