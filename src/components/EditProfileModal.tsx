import React, { useState } from 'react';
import { User } from '../db';
import { X, Save, User as UserIcon, Type, MapPin, Image as ImageIcon } from 'lucide-react';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

export default function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [headline, setHeadline] = useState(user.headline || '');
  const [location, setLocation] = useState(user.location || '');
  const [imageUrl, setImageUrl] = useState(user.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(user.imageUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('headline', headline);
      formData.append('location', location);
      formData.append('imageUrl', imageUrl);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.user);
        onClose();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('A network error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-jakarta">
      <div className="absolute inset-0 bg-earthy-dark/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-xl font-fraunces font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-earthy-green" /> Edit Profile
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-400" /> Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earthy-green/50 focus:border-earthy-green transition-all text-slate-900"
                placeholder="Your full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-400" /> Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earthy-green/50 focus:border-earthy-green transition-all text-slate-900"
                placeholder="E.g., Senior Designer at Google"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earthy-green/50 focus:border-earthy-green transition-all text-slate-900"
                placeholder="E.g., San Francisco, CA or Remote"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" /> Profile Picture
              </label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="relative group">
                  <img 
                    src={imagePreview || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm bg-white"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center pointer-events-none">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-2">JPG, PNG or GIF. Max 5MB.</p>
                  <label className="inline-block px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 sm:gap-4 sticky bottom-0 z-10">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            form="edit-profile-form"
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3 px-4 bg-earthy-green text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save className="w-4 h-4" /> Save Profile</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
