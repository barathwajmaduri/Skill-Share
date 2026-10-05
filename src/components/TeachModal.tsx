import React, { useState } from 'react';
import { User } from '../db';
import { X, Upload, CheckCircle2, Video, FileText } from 'lucide-react';

interface TeachModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

export default function TeachModal({ user, onClose, onSave }: TeachModalProps) {
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [demoVideoFile, setDemoVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleDemoVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDemoVideoFile(e.target.files[0]);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill || !demoVideoFile) return;

    setIsSubmitting(true);
    setError(null);
    try {
      console.log('Submitting teaching application...');
      const formData = new FormData();
      formData.append('teacherId', user.id);
      formData.append('title', selectedSkill);
      formData.append('description', `Teaching session for ${selectedSkill}`);
      formData.append('demoVideo', demoVideoFile);
      if (certificateFile) {
        formData.append('certificate', certificateFile);
      }

      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (const [key, value] of (formData as any).entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch('/api/teachings', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        // Also update user status to available to teach if not already
        if (!user.isAvailableToTeach) {
             const userResponse = await fetch(`/api/users/${user.id}/teach`, { method: 'POST' });
             if (userResponse.ok) {
               const userData = await userResponse.json();
               onSave(userData.user);
             }
        }
        
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 font-jakarta">
        <div className="absolute inset-0 bg-earthy-dark/40 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-earthy-green/10 text-earthy-green rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-fraunces font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-600 mb-6">
            Thank you for applying to teach <strong>{selectedSkill}</strong>. We will review your demo video and get back to you shortly.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-earthy-dark text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 font-jakarta">
      <div className="absolute inset-0 bg-earthy-dark/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-fraunces font-bold text-slate-900">Start Teaching</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {user.skillsToTeach && user.skillsToTeach.length > 0 ? (
            <form id="teach-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Select a skill you want to teach *
                </label>
                <select 
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-earthy-green focus:ring-1 focus:ring-earthy-green transition-all"
                  required
                >
                  <option value="" disabled>Choose a skill...</option>
                  {user.skillsToTeach.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              {selectedSkill && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  {/* Certificate Upload */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <label className="block text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-earthy-dark" />
                      Upload Certificate (Optional)
                    </label>
                    <p className="text-xs text-slate-500 mb-3">Boost your credibility by uploading a relevant certificate.</p>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        id="certificate-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleCertificateChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="certificate-upload"
                        className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:border-earthy-green hover:text-earthy-green hover:bg-earthy-green/5 cursor-pointer transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        {certificateFile ? certificateFile.name : 'Choose file...'}
                      </label>
                    </div>
                  </div>

                  {/* Demo Video Upload */}
                  <div className="p-4 border border-earthy-green/30 rounded-xl bg-earthy-green/5">
                    <label className="block text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Video className="w-4 h-4 text-earthy-green" />
                      1-Minute Demo Video *
                    </label>
                    <p className="text-xs text-slate-600 mb-3">Upload a short video demonstrating your teaching style for this skill. This builds trust with potential learners.</p>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        id="video-upload"
                        accept="video/*"
                        onChange={handleDemoVideoChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="video-upload"
                        className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-lg text-sm font-medium cursor-pointer transition-all ${demoVideoFile ? 'border-earthy-green text-earthy-green bg-earthy-green/10' : 'border-slate-300 text-slate-600 hover:border-earthy-green hover:text-earthy-green hover:bg-earthy-green/5'}`}
                      >
                        <Upload className="w-4 h-4" />
                        {demoVideoFile ? demoVideoFile.name : 'Upload Demo Video'}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No skills listed</h3>
              <p className="text-slate-500 mb-6">You need to add skills you want to teach to your profile first.</p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {user.skillsToTeach && user.skillsToTeach.length > 0 && (
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button 
              onClick={onClose}
              type="button"
              className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              form="teach-form"
              type="submit"
              disabled={!selectedSkill || !demoVideoFile || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-earthy-green text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
