'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Send,
  Megaphone,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  Filter
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'customers' | 'coaches';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'scheduled';
  author: string;
  createdDate: string;
  publishedDate?: string;
  scheduledDate?: string;
  views: number;
  imageUrl?: string;
}

const AnnouncementsPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    content: '',
    targetAudience: 'all' as 'all' | 'customers' | 'coaches',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    scheduledDate: ''
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'New Year Promotion - 20% Off All Memberships',
      content: 'Celebrate the New Year with us! Get 20% off all membership plans when you sign up before January 31st. This is the perfect time to commit to your fitness goals.',
      targetAudience: 'customers',
      priority: 'high',
      status: 'published',
      author: 'Admin Team',
      createdDate: '2026-01-01',
      publishedDate: '2026-01-01',
      views: 456
    },
    {
      id: '2',
      title: 'New HIIT Classes Starting Next Week',
      content: 'We are excited to announce new HIIT classes every Monday and Wednesday at 6:00 PM. Join our certified trainers for intense workouts designed to maximize calorie burn.',
      targetAudience: 'customers',
      priority: 'medium',
      status: 'published',
      author: 'Admin Team',
      createdDate: '2026-01-10',
      publishedDate: '2026-01-12',
      views: 234
    },
    {
      id: '3',
      title: 'Coach Training Session - February Schedule',
      content: 'All coaches are required to attend the monthly training session on February 15th at 10:00 AM. We will cover new safety protocols and equipment usage.',
      targetAudience: 'coaches',
      priority: 'high',
      status: 'published',
      author: 'Admin Team',
      createdDate: '2026-01-15',
      publishedDate: '2026-01-15',
      views: 28
    },
    {
      id: '4',
      title: 'Facility Maintenance Notice',
      content: 'Our facility will undergo maintenance on January 25th from 8:00 AM to 12:00 PM. All classes and sessions during this time will be rescheduled.',
      targetAudience: 'all',
      priority: 'high',
      status: 'scheduled',
      author: 'Admin Team',
      createdDate: '2026-01-18',
      scheduledDate: '2026-01-22',
      views: 0
    },
    {
      id: '5',
      title: 'Nutrition Workshop Coming Soon',
      content: 'Join our upcoming nutrition workshop where expert dietitians will share insights on meal planning and healthy eating habits.',
      targetAudience: 'customers',
      priority: 'low',
      status: 'draft',
      author: 'Admin Team',
      createdDate: '2026-01-19',
      views: 0
    }
  ]);

  const handleCreateNew = () => {
    setFormData({
      id: '',
      title: '',
      content: '',
      targetAudience: 'all',
      priority: 'medium',
      status: 'draft',
      scheduledDate: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      status: announcement.status,
      scheduledDate: announcement.scheduledDate || ''
    });
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (formData.id) {
      // Update existing
      setAnnouncements(announcements.map(a =>
        a.id === formData.id
          ? {
              ...a,
              title: formData.title,
              content: formData.content,
              targetAudience: formData.targetAudience,
              priority: formData.priority,
              status: formData.status,
              scheduledDate: formData.scheduledDate || undefined
            }
          : a
      ));
      setSuccessMessage('Announcement updated successfully!');
    } else {
      // Create new
      const newAnnouncement: Announcement = {
        ...formData,
        id: Date.now().toString(),
        author: 'Admin Team',
        createdDate: new Date().toISOString().split('T')[0],
        publishedDate: formData.status === 'published' ? new Date().toISOString().split('T')[0] : undefined,
        views: 0
      };
      setAnnouncements([newAnnouncement, ...announcements]);
      setSuccessMessage('Announcement created successfully!');
    }
    setShowCreateModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePublish = (id: string) => {
    setAnnouncements(announcements.map(a =>
      a.id === id
        ? { ...a, status: 'published', publishedDate: new Date().toISOString().split('T')[0] }
        : a
    ));
    setSuccessMessage('Announcement published successfully!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUnpublish = (id: string) => {
    setAnnouncements(announcements.map(a =>
      a.id === id
        ? { ...a, status: 'draft', publishedDate: undefined }
        : a
    ));
    setSuccessMessage('Announcement unpublished successfully!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    setAnnouncementToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (announcementToDelete) {
      setAnnouncements(announcements.filter(a => a.id !== announcementToDelete));
      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
      setSuccessMessage('Announcement deleted successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const getFilteredAnnouncements = () => {
    if (activeTab === 'all') return announcements;
    return announcements.filter(a => a.status === activeTab);
  };

  const filteredAnnouncements = getFilteredAnnouncements();

  const getPublishedCount = () => announcements.filter(a => a.status === 'published').length;
  const getDraftCount = () => announcements.filter(a => a.status === 'draft').length;
  const getScheduledCount = () => announcements.filter(a => a.status === 'scheduled').length;
  const getTotalViews = () => announcements.reduce((sum, a) => sum + a.views, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'customers': return <Users size={14} />;
      case 'coaches': return <Users size={14} />;
      default: return <Megaphone size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-500/20';
      case 'draft': return 'text-gray-400 bg-gray-500/20';
      case 'scheduled': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="bg-brand-gray border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:text-brand-red transition-colors">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Announcements</h1>
                <p className="text-sm text-gray-400">Create and manage announcements</p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-brand-red hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Create Announcement
            </button>
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

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Megaphone className="text-green-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{getPublishedCount()}</p>
            <p className="text-sm text-gray-400">Published</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Edit className="text-gray-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{getDraftCount()}</p>
            <p className="text-sm text-gray-400">Drafts</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Clock className="text-blue-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{getScheduledCount()}</p>
            <p className="text-sm text-gray-400">Scheduled</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Eye className="text-brand-red mb-2" size={32} />
            <p className="text-3xl font-bold">{getTotalViews()}</p>
            <p className="text-sm text-gray-400">Total Views</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 bg-brand-gray p-2 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-brand-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Filter size={18} />
            All ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'published'
                ? 'bg-green-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle size={18} />
            Published ({getPublishedCount()})
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'draft'
                ? 'bg-gray-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Edit size={18} />
            Drafts ({getDraftCount()})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'scheduled'
                ? 'bg-blue-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock size={18} />
            Scheduled ({getScheduledCount()})
          </button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
              <Megaphone className="mx-auto mb-4 text-gray-600" size={64} />
              <h3 className="text-xl font-bold mb-2">No announcements found</h3>
              <p className="text-gray-400 mb-4">
                {activeTab === 'all' 
                  ? 'Get started by creating your first announcement'
                  : `No ${activeTab} announcements at this time`}
              </p>
              {activeTab === 'all' && (
                <button
                  onClick={handleCreateNew}
                  className="bg-brand-red hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create Announcement
                </button>
              )}
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="bg-brand-gray rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold flex-1">{announcement.title}</h3>
                      <div className="flex items-center gap-2 ml-4">
                        <div className={`px-3 py-1 rounded-lg ${getStatusColor(announcement.status)}`}>
                          <span className="text-xs font-semibold capitalize">{announcement.status}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-lg ${getPriorityColor(announcement.priority)}`}>
                          <span className="text-xs font-semibold capitalize">{announcement.priority}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 leading-relaxed">{announcement.content}</p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/40 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          {getAudienceIcon(announcement.targetAudience)}
                          <span className="text-xs font-semibold">Target Audience</span>
                        </div>
                        <p className="text-sm font-semibold capitalize">{announcement.targetAudience}</p>
                      </div>

                      <div className="bg-black/40 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Eye size={14} />
                          <span className="text-xs font-semibold">Views</span>
                        </div>
                        <p className="text-sm font-semibold">{announcement.views} views</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span>Created: {new Date(announcement.createdDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                      {announcement.publishedDate && (
                        <span>Published: {new Date(announcement.publishedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      )}
                      {announcement.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Scheduled: {new Date(announcement.scheduledDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                      <span>By {announcement.author}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="flex-1 lg:flex-none bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={18} />
                      Edit
                    </button>
                    {announcement.status === 'draft' || announcement.status === 'scheduled' ? (
                      <button
                        onClick={() => handlePublish(announcement.id)}
                        className="flex-1 lg:flex-none bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Send size={18} />
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(announcement.id)}
                        className="flex-1 lg:flex-none bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <EyeOff size={18} />
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="flex-1 lg:flex-none bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {formData.id ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="hover:text-brand-red transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content..."
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Target Audience *</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  >
                    <option value="all">All Users</option>
                    <option value="customers">Customers Only</option>
                    <option value="coaches">Coaches Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  >
                    <option value="draft">Save as Draft</option>
                    <option value="published">Publish Now</option>
                    <option value="scheduled">Schedule for Later</option>
                  </select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Scheduled Date *</label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title || !formData.content}
                className="flex-1 bg-brand-red hover:bg-red-600 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formData.id ? 'Update' : 'Create'} Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={32} />
              <h3 className="text-xl font-bold">Delete Announcement</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
