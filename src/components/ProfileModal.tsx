import React from 'react';
import { User } from '../db';
import { X, Star, ShieldCheck, Award, Briefcase, MapPin, Mail, LogOut, GraduationCap, BookOpen, CheckCircle2, Trash2 } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout?: () => void;
  onUpdateUser?: (user: User) => void;
}

export default function ProfileModal({ user, onClose, onLogout, onUpdateUser }: ProfileModalProps) {
  const handleDeleteCertificate = async (cert: string) => {
    if (!confirm(`Are you sure you want to delete the certificate "${cert}"?`)) return;

    try {
      const response = await fetch(`/api/users/${user.id}/certificates`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate: cert })
      });

      if (response.ok) {
        const data = await response.json();
        if (onUpdateUser) {
          onUpdateUser(data.user);
        }
      } else {
        alert('Failed to delete certificate');
      }
    } catch (error) {
      console.error('Delete certificate error:', error);
      alert('An error occurred while deleting the certificate');
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-jakarta">
      <div className="absolute inset-0 bg-earthy-dark/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Cover Photo & Avatar */}
        <div className="h-32 bg-gradient-to-r from-earthy-green to-earthy-dark relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-8 pb-8 pt-0 flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-6">
            <div className="-mt-12 shrink-0">
              <img 
                src={user.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`} 
                alt={user.fullName} 
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover bg-white"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-2xl font-fraunces font-bold text-slate-900 break-words">{user.fullName}</h2>
                {user.isAvailableToTeach && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-earthy-green/10 text-earthy-green text-xs font-bold rounded-md whitespace-nowrap" title="Verified Teacher">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-slate-600 font-medium mt-1.5 break-words line-clamp-2">{user.headline || 'Learner & Teacher'}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="w-4 h-4" /> {user.location || 'Remote'}</span>
                <span className="flex items-center gap-1 break-all"><Mail className="w-4 h-4" /> {user.email}</span>
              </div>
            </div>
            <div className="flex gap-2 pb-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-earthy-dark text-white rounded-xl font-bold hover:bg-black transition-colors shadow-sm">
                <Briefcase className="w-4 h-4" /> Hire Me
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-amber-500 mb-1">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold text-xl text-amber-600">{user.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <span className="text-xs font-bold text-amber-700/70 uppercase tracking-wider">Instructor Rating</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-emerald-500 mb-1">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold text-xl text-emerald-600">{user.reputationScore || '95'}</span>
              </div>
              <span className="text-xs font-bold text-emerald-700/70 uppercase tracking-wider">Reputation Score</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 text-blue-500 mb-1">
                <Award className="w-5 h-5" />
                <span className="font-bold text-xl text-blue-600">{user.certificates?.length ?? 0}</span>
              </div>
              <span className="text-xs font-bold text-blue-700/70 uppercase tracking-wider">Certificates</span>
            </div>
          </div>

          <div className="space-y-8">
            {/* Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-earthy-green" /> Verified Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.skillsToTeach && user.skillsToTeach.length > 0 ? (
                    user.skillsToTeach.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-earthy-green/10 text-earthy-green rounded-lg text-sm font-bold border border-earthy-green/20">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No expertise listed yet.</span>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-earthy-rust" /> Currently Learning
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
                    user.skillsToLearn.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-earthy-rust/10 text-earthy-rust rounded-lg text-sm font-bold border border-earthy-rust/20">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Not learning anything currently.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Certificates */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" /> Certifications & Achievements
              </h3>
              <div className="space-y-3">
                {user.certificates && user.certificates.length > 0 ? (
                  user.certificates.map((cert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 group">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{cert}</p>
                          <p className="text-xs text-slate-500">Verified by SkillShare Community</p>
                        </div>
                      </div>
                      {onLogout && (
                        <button 
                          onClick={() => handleDeleteCertificate(cert)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Certificate"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <Award className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-slate-400 font-medium text-sm">No certificates uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {onLogout && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
