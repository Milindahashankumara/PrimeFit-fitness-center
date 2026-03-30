'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/app/lib/api';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Edit,
  Save,
  Camera,
  Lock,
  Bell,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  zipCode: string;
  emergencyContact: string;
  emergencyPhone: string;
  fitnessGoals: string[];
  medicalConditions: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

const ProfilePage = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'preferences' | 'security'>('personal');
  const [showSuccess, setShowSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    address: '123 Fitness Street',
    city: 'Los Angeles',
    zipCode: '90001',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+1 (555) 987-6543',
    fitnessGoals: ['Weight Loss', 'Muscle Building', 'Endurance'],
    medicalConditions: 'None',
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    }
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const loadedProfile: UserProfile = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || '',
          address: user.address || '',
          city: user.city || '',
          zipCode: user.zipCode || '',
          emergencyContact: user.emergencyContact || '',
          emergencyPhone: user.emergencyPhone || '',
          fitnessGoals: user.fitnessGoals || [],
          medicalConditions: user.medicalConditions || '',
          preferences: user.preferences || {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true
          }
        };
        setProfile(loadedProfile);
        setEditedProfile(loadedProfile);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handlePreferenceChange = (field: keyof UserProfile['preferences']) => {
    setEditedProfile({
      ...editedProfile,
      preferences: {
        ...editedProfile.preferences,
        [field]: !editedProfile.preferences[field]
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Prepare update data, filtering out empty strings for enum fields
      const updates: any = {
        name: editedProfile.name,
        phone: editedProfile.phone,
        address: editedProfile.address,
        city: editedProfile.city,
        zipCode: editedProfile.zipCode,
        emergencyContact: editedProfile.emergencyContact,
        emergencyPhone: editedProfile.emergencyPhone,
        fitnessGoals: editedProfile.fitnessGoals,
        medicalConditions: editedProfile.medicalConditions,
        preferences: editedProfile.preferences
      };

      // Only include optional fields if they have values
      if (editedProfile.dateOfBirth) {
        updates.dateOfBirth = editedProfile.dateOfBirth;
      }
      if (editedProfile.gender && editedProfile.gender !== '') {
        updates.gender = editedProfile.gender;
      }

      // Call API to update profile in database
      const updatedUser = await AuthAPI.updateProfile(updates);

      // Update local state with response from server
      setProfile(editedProfile);
      setIsEditing(false);
      setShowSuccess(true);
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const fitnessGoalOptions = [
    'Weight Loss', 'Muscle Building', 'Endurance', 'Flexibility', 
    'Strength Training', 'General Fitness', 'Sports Performance'
  ];

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
              <h1 className="text-2xl font-bold">My Profile</h1>
              <p className="text-sm text-gray-400">Manage your account settings</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">Profile updated successfully!</p>
          </div>
        )}
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <p className="font-semibold text-red-400">{error}</p>
          </div>
        )}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-brand-gray rounded-2xl p-6 border border-white/10 sticky top-24">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-brand-red rounded-full flex items-center justify-center text-4xl font-bold mx-auto">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <button className="absolute bottom-0 right-1/2 translate-x-16 bg-white text-brand-dark p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <Camera size={18} />
                </button>
              </div>

              <div className="text-center mb-6">
                <h3 className="font-bold text-xl mb-1">{profile.name}</h3>
                <p className="text-sm text-gray-400">{profile.email}</p>
                <div className="mt-4 bg-black/40 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">Member Since</p>
                  <p className="font-semibold">January 2026</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'personal' ? 'bg-brand-red text-white' : 'hover:bg-white/10'
                  }`}
                >
                  <User size={20} />
                  <span>Personal Info</span>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'preferences' ? 'bg-brand-red text-white' : 'hover:bg-white/10'
                  }`}
                >
                  <Bell size={20} />
                  <span>Preferences</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'security' ? 'bg-brand-red text-white' : 'hover:bg-white/10'
                  }`}
                >
                  <Shield size={20} />
                  <span>Security</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-brand-gray rounded-2xl p-8 border border-white/10">
              {/* Header Actions */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">
                  {activeTab === 'personal' && 'Personal Information'}
                  {activeTab === 'preferences' && 'Notification Preferences'}
                  {activeTab === 'security' && 'Security Settings'}
                </h2>
                {activeTab === 'personal' && (
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-4 py-2 bg-brand-red hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              Save Changes
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-brand-red hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Edit size={18} />
                        Edit Profile
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={isEditing ? editedProfile.name : profile.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="email"
                            value={isEditing ? editedProfile.email : profile.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="tel"
                            value={isEditing ? editedProfile.phone : profile.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Date of Birth</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="date"
                            value={isEditing ? editedProfile.dateOfBirth : profile.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Gender</label>
                        <select
                          value={isEditing ? editedProfile.gender : profile.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Street Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={isEditing ? editedProfile.address : profile.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">City</label>
                        <input
                          type="text"
                          value={isEditing ? editedProfile.city : profile.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={isEditing ? editedProfile.zipCode : profile.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Contact Name</label>
                        <input
                          type="text"
                          value={isEditing ? editedProfile.emergencyContact : profile.emergencyContact}
                          onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Contact Phone</label>
                        <input
                          type="tel"
                          value={isEditing ? editedProfile.emergencyPhone : profile.emergencyPhone}
                          onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fitness Goals */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Fitness Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {fitnessGoalOptions.map((goal) => (
                        <button
                          key={goal}
                          onClick={() => {
                            if (isEditing) {
                              const goals = editedProfile.fitnessGoals.includes(goal)
                                ? editedProfile.fitnessGoals.filter(g => g !== goal)
                                : [...editedProfile.fitnessGoals, goal];
                              handleInputChange('fitnessGoals', goals);
                            }
                          }}
                          disabled={!isEditing}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            (isEditing ? editedProfile.fitnessGoals : profile.fitnessGoals).includes(goal)
                              ? 'bg-brand-red text-white'
                              : 'bg-black/40 border border-white/10 hover:border-brand-red'
                          } disabled:opacity-60`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Medical Conditions</h3>
                    <textarea
                      value={isEditing ? editedProfile.medicalConditions : profile.medicalConditions}
                      onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Any medical conditions or injuries we should know about..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white disabled:opacity-60 focus:border-brand-red focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="text-brand-red" size={24} />
                        <div>
                          <p className="font-semibold">Email Notifications</p>
                          <p className="text-sm text-gray-400">Receive updates via email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePreferenceChange('emailNotifications')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          editedProfile.preferences.emailNotifications ? 'bg-brand-red' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            editedProfile.preferences.emailNotifications ? 'translate-x-7' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="text-brand-red" size={24} />
                        <div>
                          <p className="font-semibold">SMS Notifications</p>
                          <p className="text-sm text-gray-400">Receive updates via text</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePreferenceChange('smsNotifications')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          editedProfile.preferences.smsNotifications ? 'bg-brand-red' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            editedProfile.preferences.smsNotifications ? 'translate-x-7' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="text-brand-red" size={24} />
                        <div>
                          <p className="font-semibold">Push Notifications</p>
                          <p className="text-sm text-gray-400">Receive push notifications</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePreferenceChange('pushNotifications')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          editedProfile.preferences.pushNotifications ? 'bg-brand-red' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            editedProfile.preferences.pushNotifications ? 'translate-x-7' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full bg-brand-red hover:bg-red-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-black/40 p-6 rounded-lg">
                    <h3 className="font-semibold mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="password"
                            placeholder="Enter current password"
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="password"
                            placeholder="Enter new password"
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-red focus:outline-none"
                          />
                        </div>
                      </div>

                      <button className="w-full bg-brand-red hover:bg-red-700 py-3 rounded-lg font-semibold transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/40 p-6 rounded-lg">
                    <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400 mb-4">Add an extra layer of security to your account</p>
                    <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-semibold transition-colors">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="bg-red-500/20 border border-red-500 p-6 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-500 shrink-0" size={24} />
                      <div>
                        <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-sm text-gray-300 mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
