'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Folder,
  Star,
  Calendar
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'image' | 'link';
  category: 'workout-plan' | 'nutrition' | 'exercise-guide' | 'health-tips' | 'other';
  fileUrl?: string;
  linkUrl?: string;
  fileName?: string;
  fileSize?: string;
  uploadDate: string;
  uploadedBy: string;
  downloads: number;
  views: number;
  isPublic: boolean;
  tags: string[];
}

const ResourcesPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'document' | 'video' | 'image' | 'link'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    type: 'document' as 'document' | 'video' | 'image' | 'link',
    category: 'workout-plan' as Resource['category'],
    linkUrl: '',
    isPublic: true,
    tags: [] as string[]
  });

  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      title: 'Full Body Workout Plan - Beginner',
      description: 'A comprehensive 4-week full body workout plan designed for beginners. Includes exercise descriptions, sets, reps, and rest periods.',
      type: 'document',
      category: 'workout-plan',
      fileName: 'beginner_fullbody_plan.pdf',
      fileSize: '2.4 MB',
      uploadDate: '2026-01-10',
      uploadedBy: 'Admin Team',
      downloads: 234,
      views: 567,
      isPublic: true,
      tags: ['beginner', 'full-body', 'strength']
    },
    {
      id: '2',
      title: 'Healthy Meal Prep Guide',
      description: 'Learn how to meal prep for the week with healthy, balanced recipes. Includes shopping lists and nutritional information.',
      type: 'document',
      category: 'nutrition',
      fileName: 'meal_prep_guide.pdf',
      fileSize: '5.1 MB',
      uploadDate: '2026-01-12',
      uploadedBy: 'Admin Team',
      downloads: 189,
      views: 423,
      isPublic: true,
      tags: ['nutrition', 'meal-prep', 'healthy-eating']
    },
    {
      id: '3',
      title: 'Proper Squat Form Tutorial',
      description: 'Video tutorial demonstrating proper squat technique, common mistakes to avoid, and progression options.',
      type: 'video',
      category: 'exercise-guide',
      linkUrl: 'https://example.com/squat-tutorial',
      uploadDate: '2026-01-14',
      uploadedBy: 'Coach Michael',
      downloads: 0,
      views: 892,
      isPublic: true,
      tags: ['squat', 'form', 'legs', 'tutorial']
    },
    {
      id: '4',
      title: 'Stretching Routine Poster',
      description: 'Visual guide showing 15 essential stretches for flexibility and injury prevention. Perfect for post-workout cooldowns.',
      type: 'image',
      category: 'exercise-guide',
      fileName: 'stretching_poster.jpg',
      fileSize: '1.8 MB',
      uploadDate: '2026-01-15',
      uploadedBy: 'Admin Team',
      downloads: 156,
      views: 678,
      isPublic: true,
      tags: ['stretching', 'flexibility', 'cooldown']
    },
    {
      id: '5',
      title: 'Benefits of Hydration During Exercise',
      description: 'Informative article on the importance of staying hydrated during workouts and how much water you should drink.',
      type: 'link',
      category: 'health-tips',
      linkUrl: 'https://example.com/hydration-guide',
      uploadDate: '2026-01-16',
      uploadedBy: 'Admin Team',
      downloads: 0,
      views: 234,
      isPublic: true,
      tags: ['hydration', 'health', 'tips']
    },
    {
      id: '6',
      title: 'HIIT Cardio Workout - 20 Minutes',
      description: 'High-intensity interval training workout designed to burn calories and improve cardiovascular fitness in just 20 minutes.',
      type: 'video',
      category: 'workout-plan',
      linkUrl: 'https://example.com/hiit-20min',
      uploadDate: '2026-01-17',
      uploadedBy: 'Coach Sarah',
      downloads: 0,
      views: 1234,
      isPublic: true,
      tags: ['HIIT', 'cardio', 'fat-loss', '20-min']
    },
    {
      id: '7',
      title: 'Protein Requirements for Athletes',
      description: 'Detailed guide on protein requirements for different types of athletes and training goals.',
      type: 'document',
      category: 'nutrition',
      fileName: 'protein_guide.pdf',
      fileSize: '1.2 MB',
      uploadDate: '2026-01-18',
      uploadedBy: 'Admin Team',
      downloads: 98,
      views: 345,
      isPublic: true,
      tags: ['protein', 'nutrition', 'muscle-building']
    }
  ]);

  const handleCreateNew = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      type: 'document',
      category: 'workout-plan',
      linkUrl: '',
      isPublic: true,
      tags: []
    });
    setShowUploadModal(true);
  };

  const handleEdit = (resource: Resource) => {
    setFormData({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      linkUrl: resource.linkUrl || '',
      isPublic: resource.isPublic,
      tags: resource.tags
    });
    setShowUploadModal(true);
  };

  const handleSave = () => {
    if (formData.id) {
      // Update existing
      setResources(resources.map(r =>
        r.id === formData.id
          ? {
              ...r,
              title: formData.title,
              description: formData.description,
              type: formData.type,
              category: formData.category,
              linkUrl: formData.linkUrl || undefined,
              isPublic: formData.isPublic,
              tags: formData.tags
            }
          : r
      ));
      setSuccessMessage('Resource updated successfully!');
    } else {
      // Create new
      const newResource: Resource = {
        ...formData,
        id: Date.now().toString(),
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: 'Admin Team',
        downloads: 0,
        views: 0,
        fileName: formData.type !== 'link' ? 'uploaded_file.pdf' : undefined,
        fileSize: formData.type !== 'link' ? '1.5 MB' : undefined
      };
      setResources([newResource, ...resources]);
      setSuccessMessage('Resource added successfully!');
    }
    setShowUploadModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    setResourceToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (resourceToDelete) {
      setResources(resources.filter(r => r.id !== resourceToDelete));
      setShowDeleteModal(false);
      setResourceToDelete(null);
      setSuccessMessage('Resource deleted successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const getFilteredResources = () => {
    let filtered = resources;
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => r.type === activeTab);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredResources = getFilteredResources();

  const getDocumentCount = () => resources.filter(r => r.type === 'document').length;
  const getVideoCount = () => resources.filter(r => r.type === 'video').length;
  const getImageCount = () => resources.filter(r => r.type === 'image').length;
  const getLinkCount = () => resources.filter(r => r.type === 'link').length;
  const getTotalDownloads = () => resources.reduce((sum, r) => sum + r.downloads, 0);
  const getTotalViews = () => resources.reduce((sum, r) => sum + r.views, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText size={20} />;
      case 'video': return <Video size={20} />;
      case 'image': return <ImageIcon size={20} />;
      case 'link': return <LinkIcon size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'text-blue-400 bg-blue-500/20';
      case 'video': return 'text-purple-400 bg-purple-500/20';
      case 'image': return 'text-green-400 bg-green-500/20';
      case 'link': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
                <h1 className="text-2xl font-bold">Fitness Resources</h1>
                <p className="text-sm text-gray-400">Manage and share fitness-related content</p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-brand-red hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Add Resource
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
            <Folder className="text-brand-red mb-2" size={32} />
            <p className="text-3xl font-bold">{resources.length}</p>
            <p className="text-sm text-gray-400">Total Resources</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Download className="text-blue-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{getTotalDownloads()}</p>
            <p className="text-sm text-gray-400">Total Downloads</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Eye className="text-green-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{getTotalViews()}</p>
            <p className="text-sm text-gray-400">Total Views</p>
          </div>

          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Star className="text-yellow-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{resources.filter(r => r.isPublic).length}</p>
            <p className="text-sm text-gray-400">Public Resources</p>
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
              placeholder="Search resources by title, description, or tags..."
              className="w-full bg-brand-gray border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-red focus:outline-none"
            />
          </div>
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-brand-gray border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="workout-plan">Workout Plans</option>
              <option value="nutrition">Nutrition</option>
              <option value="exercise-guide">Exercise Guides</option>
              <option value="health-tips">Health Tips</option>
              <option value="other">Other</option>
            </select>
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
            All ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'document'
                ? 'bg-blue-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={18} />
            Documents ({getDocumentCount()})
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'video'
                ? 'bg-purple-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video size={18} />
            Videos ({getVideoCount()})
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'image'
                ? 'bg-green-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon size={18} />
            Images ({getImageCount()})
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'link'
                ? 'bg-yellow-500 text-brand-dark'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon size={18} />
            Links ({getLinkCount()})
          </button>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.length === 0 ? (
            <div className="col-span-full bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
              <Folder className="mx-auto mb-4 text-gray-600" size={64} />
              <h3 className="text-xl font-bold mb-2">No resources found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first resource'}
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <button
                  onClick={handleCreateNew}
                  className="bg-brand-red hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Resource
                </button>
              )}
            </div>
          ) : (
            filteredResources.map((resource) => (
              <div key={resource.id} className="bg-brand-gray rounded-2xl p-6 border border-white/10 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(resource.type)}`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  {!resource.isPublic && (
                    <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-3">{resource.description}</p>

                <div className="mb-4">
                  <span className="text-xs bg-brand-red/20 text-brand-red px-2 py-1 rounded">
                    {getCategoryLabel(resource.category)}
                  </span>
                </div>

                {resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {resource.fileName && (
                  <div className="bg-black/40 p-3 rounded-lg mb-4 text-xs">
                    <p className="text-gray-400 truncate mb-1">{resource.fileName}</p>
                    <p className="text-gray-500">{resource.fileSize}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-black/40 p-2 rounded text-center">
                    <Eye className="mx-auto mb-1 text-gray-400" size={14} />
                    <p className="font-semibold">{resource.views}</p>
                    <p className="text-gray-500">views</p>
                  </div>
                  <div className="bg-black/40 p-2 rounded text-center">
                    <Download className="mx-auto mb-1 text-gray-400" size={14} />
                    <p className="font-semibold">{resource.downloads}</p>
                    <p className="text-gray-500">downloads</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p>Uploaded: {new Date(resource.uploadDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}</p>
                  <p>By {resource.uploadedBy}</p>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
                  {resource.type !== 'link' ? (
                    <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
                      <Download size={16} />
                      Download
                    </button>
                  ) : (
                    <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
                      <Eye size={16} />
                      View
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(resource)}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload/Edit Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {formData.id ? 'Edit Resource' : 'Add New Resource'}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
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
                  placeholder="Enter resource title..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter resource description..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Resource Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  >
                    <option value="document">Document (PDF, DOC)</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="link">External Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  >
                    <option value="workout-plan">Workout Plan</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="exercise-guide">Exercise Guide</option>
                    <option value="health-tips">Health Tips</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {(formData.type === 'link' || formData.type === 'video') && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Link URL *</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://example.com/resource"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  />
                </div>
              )}

              {formData.type !== 'link' && formData.type !== 'video' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Upload File *</label>
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-brand-red/50 transition-colors cursor-pointer">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-400 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">
                      {formData.type === 'document' && 'PDF, DOC, DOCX (Max 10MB)'}
                      {formData.type === 'image' && 'JPG, PNG, GIF (Max 5MB)'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                  placeholder="e.g., beginner, strength, nutrition"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 bg-black/40 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPublic" className="text-sm cursor-pointer">
                  Make this resource publicly accessible to all users
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title || !formData.description}
                className="flex-1 bg-brand-red hover:bg-red-600 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formData.id ? 'Update' : 'Add'} Resource
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
              <h3 className="text-xl font-bold">Delete Resource</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this resource? This action cannot be undone.
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

export default ResourcesPage;
