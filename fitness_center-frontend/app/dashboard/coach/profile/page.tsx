'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI, CoachesAPI } from '@/app/lib/api';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Award,
  Edit,
  Save,
  Camera,
  Plus,
  X,
  CheckCircle,
  DollarSign,
  Clock,
  Target,
  Shield,
  Star,
  TrendingUp
} from 'lucide-react';

interface CoachProfile {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  specializations?: string[];
  certifications?: string[];
  experience?: number;
  hourlyRate?: number;
  achievements?: string[];
  languages?: string[];
  sessionTypes?: {
    personal: boolean;
    group: boolean;
    online: boolean;
  };
  rating?: number;
  reviewCount?: number;
  activeClients?: number;
}

const CoachProfilePage = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCertification, setNewCertification] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  const [profile, setProfile] = useState<CoachProfile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    specializations: [],
    certifications: [],
    experience: 0,
    hourlyRate: 0,
    achievements: [],
    languages: ['English'],
    sessionTypes: {
      personal: true,
      group: false,
      online: false
    },
    rating: 0,
    reviewCount: 0,
    activeClients: 0
  });

  const [editedProfile, setEditedProfile] = useState<CoachProfile>(profile);

  // Load coach profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user data
      const currentUser = await AuthAPI.getCurrentUser();
      if (!currentUser || currentUser.role !== 'coach') {
        router.push('/auth/login');
        return;
      }

      // Set profile from user data
      const profileData: CoachProfile = {
        _id: currentUser._id,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        specializations: currentUser.specializations || [],
        certifications: currentUser.certifications || [],
        experience: currentUser.experience || 0,
        hourlyRate: currentUser.hourlyRate || 0,
        achievements: currentUser.achievements || [],
        languages: currentUser.languages || ['English'],
        sessionTypes: currentUser.sessionTypes || {
          personal: true,
          group: false,
          online: false
        },
        rating: currentUser.rating || 0,
        reviewCount: currentUser.reviewCount || 0,
        activeClients: currentUser.activeClients || 0
      };

      setProfile(profileData);
      setEditedProfile(profileData);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile');
      setLoading(false);
    }
  };

  const availableSpecializations = [
    'Strength Training', 'HIIT', 'Cardio', 'Yoga', 'Pilates', 
    'CrossFit', 'Boxing', 'Nutrition Coaching', 'Weight Loss', 
    'Muscle Building', 'Flexibility', 'Sports Performance'
  ];

  const availableLanguages = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 
    'Japanese', 'Portuguese', 'Italian', 'Arabic'
  ];

  const handleInputChange = (field: keyof CoachProfile, value: any) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleSpecializationToggle = (spec: string) => {
    const currentSpecs = editedProfile.specializations || [];
    const specializations = currentSpecs.includes(spec)
      ? currentSpecs.filter(s => s !== spec)
      : [...currentSpecs, spec];
    handleInputChange('specializations', specializations);
  };

  const handleLanguageToggle = (lang: string) => {
    const currentLangs = editedProfile.languages || [];
    const languages = currentLangs.includes(lang)
      ? currentLangs.filter(l => l !== lang)
      : [...currentLangs, lang];
    handleInputChange('languages', languages);
  };

  const handleSessionTypeToggle = (type: 'personal' | 'group' | 'online') => {
    const currentTypes = editedProfile.sessionTypes || { personal: false, group: false, online: false };
    handleInputChange('sessionTypes', {
      ...currentTypes,
      [type]: !currentTypes[type]
    });
  };

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      const currentCerts = editedProfile.certifications || [];
      handleInputChange('certifications', [...currentCerts, newCertification.trim()]);
      setNewCertification('');
      setShowCertModal(false);
    }
  };

  const handleRemoveCertification = (cert: string) => {
    handleInputChange('certifications', editedProfile.certifications?.filter(c => c !== cert) || []);
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      const currentAchievements = editedProfile.achievements || [];
      handleInputChange('achievements', [...currentAchievements, newAchievement.trim()]);
      setNewAchievement('');
      setShowAchievementModal(false);
    }
  };

  const handleRemoveAchievement = (achievement: string) => {
    handleInputChange('achievements', editedProfile.achievements?.filter(a => a !== achievement) || []);
  };

  const handleSave = async () => {
    try {
      if (!profile._id) {
        alert('Profile ID not found');
        return;
      }

      setLoading(true);
      
      // Update coach profile via API
      const updates = {
        name: editedProfile.name,
        phone: editedProfile.phone,
        bio: editedProfile.bio,
        specializations: editedProfile.specializations,
        certifications: editedProfile.certifications,
        experience: editedProfile.experience,
        hourlyRate: editedProfile.hourlyRate,
        achievements: editedProfile.achievements,
        languages: editedProfile.languages,
        sessionTypes: editedProfile.sessionTypes
      };

      await CoachesAPI.update(profile._id, updates);
      
      // Reload profile to get updated data
      await loadProfile();
      
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile: ' + err.message);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500 rounded-xl p-4 z-50 max-w-md">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-gray border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:text-brand-red transition-colors">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Coach Profile</h1>
                <p className="text-sm text-gray-400">Manage your professional profile</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-brand-red hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Edit size={18} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">Profile updated successfully!</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10 sticky top-24">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-brand-red rounded-full flex items-center justify-center text-4xl font-bold mx-auto">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-1/2 translate-x-16 bg-white text-brand-dark p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <Camera size={18} />
                  </button>
                )}
              </div>

              <div className="text-center mb-6">
                <h3 className="font-bold text-2xl mb-1">{profile.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{profile.email}</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Star className="text-yellow-400 fill-yellow-400" size={20} />
                  <span className="text-xl font-bold">4.9</span>
                  <span className="text-gray-400">(127 reviews)</span>
                </div>

                <div className="bg-black/40 p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="text-brand-red" size={20} />
                    <span className="text-2xl font-bold text-brand-red">LKR {profile.hourlyRate}</span>
                    <span className="text-gray-400">/hour</span>
                  </div>
                  <p className="text-xs text-gray-400">{profile.experience} years experience</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Active Clients</span>
                  <span className="font-bold">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Sessions</span>
                  <span className="font-bold">1,840</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Success Rate</span>
                  <span className="font-bold text-green-400">96%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Mode Actions */}
            {isEditing && (
              <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4 flex items-center justify-between">
                <p className="text-blue-400 font-semibold">You are in edit mode</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-brand-red hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="text-brand-red" size={24} />
                Basic Information
              </h2>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={isEditing ? editedProfile.name : profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={isEditing ? editedProfile.email : profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={isEditing ? editedProfile.phone : profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      value={isEditing ? (editedProfile.experience ?? '') : (profile.experience ?? '')}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleInputChange('experience', v === '' ? '' : parseInt(v, 10));
                      }}
                      disabled={!isEditing}
                      min="0"
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Hourly Rate (LKR)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={isEditing ? (editedProfile.hourlyRate ?? '') : (profile.hourlyRate ?? '')}
                        onChange={(e) => {
                          const v = e.target.value;
                          handleInputChange('hourlyRate', v === '' ? '' : parseInt(v, 10));
                        }}
                        disabled={!isEditing}
                        min="0"
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Professional Bio</label>
                  <textarea
                    value={isEditing ? editedProfile.bio : profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={5}
                    placeholder="Tell clients about your experience, approach, and what makes you unique..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {((isEditing ? editedProfile.bio : profile.bio) || '').length} / 500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="text-brand-red" size={24} />
                Specializations
              </h2>
              <div className="flex flex-wrap gap-2">
                {availableSpecializations.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => isEditing && handleSpecializationToggle(spec)}
                    disabled={!isEditing}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      (isEditing ? editedProfile.specializations : profile.specializations)?.includes(spec)
                        ? 'bg-brand-red text-white'
                        : 'bg-black/40 border border-white/10 hover:border-brand-red'
                    } disabled:cursor-default`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="text-brand-red" size={24} />
                  Certifications
                </h2>
                {isEditing && (
                  <button
                    onClick={() => setShowCertModal(true)}
                    className="bg-brand-red hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Certification
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(isEditing ? editedProfile.certifications : profile.certifications)?.map((cert) => (
                  <div key={cert} className="flex items-center justify-between bg-black/40 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span>{cert}</span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveCertification(cert)}
                        className="text-red-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Award className="text-brand-red" size={24} />
                  Achievements & Recognition
                </h2>
                {isEditing && (
                  <button
                    onClick={() => setShowAchievementModal(true)}
                    className="bg-brand-red hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Achievement
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(isEditing ? editedProfile.achievements : profile.achievements)?.map((achievement) => (
                  <div key={achievement} className="bg-black/40 p-4 rounded-lg border-l-4 border-brand-red">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <TrendingUp className="text-brand-red shrink-0 mt-1" size={20} />
                        <span className="text-sm">{achievement}</span>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveAchievement(achievement)}
                          className="text-red-400 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => isEditing && handleLanguageToggle(lang)}
                    disabled={!isEditing}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      (isEditing ? editedProfile.languages : profile.languages)?.includes(lang)
                        ? 'bg-brand-red text-white'
                        : 'bg-black/40 border border-white/10 hover:border-brand-red'
                    } disabled:cursor-default`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Types */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="text-brand-red" size={24} />
                Session Types Offered
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                  <div>
                    <p className="font-semibold">Personal Training</p>
                    <p className="text-sm text-gray-400">One-on-one sessions</p>
                  </div>
                  <button
                    onClick={() => isEditing && handleSessionTypeToggle('personal')}
                    disabled={!isEditing}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      (isEditing ? editedProfile.sessionTypes : profile.sessionTypes)?.personal
                        ? 'bg-brand-red'
                        : 'bg-gray-600'
                    } disabled:cursor-default`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        (isEditing ? editedProfile.sessionTypes : profile.sessionTypes)?.personal
                          ? 'translate-x-7'
                          : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                  <div>
                    <p className="font-semibold">Group Sessions</p>
                    <p className="text-sm text-gray-400">Small group training</p>
                  </div>
                  <button
                    onClick={() => isEditing && handleSessionTypeToggle('group')}
                    disabled={!isEditing}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      (isEditing ? editedProfile.sessionTypes : profile.sessionTypes)?.group
                        ? 'bg-brand-red'
                        : 'bg-gray-600'
                    } disabled:cursor-default`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        (isEditing ? editedProfile.sessionTypes : profile.sessionTypes)?.group
                          ? 'translate-x-7'
                          : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                  <div>
                    <p className="font-semibold">Online Sessions</p>
                    <p className="text-sm text-gray-400">Virtual training via video</p>
                  </div>
                  <button
                    onClick={() => isEditing && handleSessionTypeToggle('online')}
                    disabled={!isEditing}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      (isEditing ? editedProfile.sessionTypes : profile.sessionTypes)?.online
                        ? 'bg-brand-red'
                        : 'bg-gray-600'
                    } disabled:cursor-default`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        (isEditing ? editedProfile.sessionTypes : profile.sessionTypes)?.online
                          ? 'translate-x-7'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Certification Modal */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Add Certification</h3>
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder="e.g., ACE Personal Trainer Certification"
              className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCertModal(false);
                  setNewCertification('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCertification}
                disabled={!newCertification.trim()}
                className="flex-1 bg-brand-red hover:bg-red-700 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Achievement Modal */}
      {showAchievementModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-md w-full p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Add Achievement</h3>
            <input
              type="text"
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              placeholder="e.g., Top Trainer of the Year 2025"
              className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAchievementModal(false);
                  setNewAchievement('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAchievement}
                disabled={!newAchievement.trim()}
                className="flex-1 bg-brand-red hover:bg-red-700 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachProfilePage;
