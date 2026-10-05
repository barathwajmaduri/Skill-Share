import React, { useState } from 'react';
import { User } from '../db';
import { BookOpen, GraduationCap, MapPin, Edit3, Users, Calendar, ArrowRight, Settings, Video, CheckCircle2, MessageCircle, Clock, ExternalLink, Star, Trash2 } from 'lucide-react';
import ProfileModal from './ProfileModal';
import EditProfileModal from './EditProfileModal';
import EditSkillsModal from './EditSkillsModal';
import TeachModal from './TeachModal';
import FeedbackModal from './FeedbackModal';

interface DashboardScreenProps {
  onNavigate: (view: 'login' | 'onboarding' | 'dashboard' | 'discovery') => void;
  user: User | null;
  onLogout: () => void;
  onUpdateUser?: (user: User) => void;
}

export default function DashboardScreen({ onNavigate, user, onLogout, onUpdateUser }: DashboardScreenProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditSkillsOpen, setIsEditSkillsOpen] = useState(false);
  const [isTeachModalOpen, setIsTeachModalOpen] = useState(false);
  const [connections, setConnections] = useState<{
    asTeacher: { id: string; title: string; learnerCount: number }[];
    asLearner: { id: string; title: string; teacher: { fullName: string; imageUrl: string; headline: string } }[];
  }>({ asTeacher: [], asLearner: [] });
  const [sessions, setSessions] = useState<any[]>([]);
  const [feedbackTarget, setFeedbackTarget] = useState<any | null>(null);
  const demoUser: User = {
    id: 'demo-1',
    email: 'demo@example.com',
    fullName: 'Demo User',
    headline: 'Learner & Teacher',
    location: 'Remote',
    imageUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
    rating: 0,
    reputationScore: 0,
    certificates: ['Frontend Development Fundamentals', 'Advanced UI/UX Patterns'],
    skillsToTeach: ['React', 'JavaScript'],
    skillsToLearn: ['UI/UX Design'],
    isAvailableToTeach: false,
    verified: true
  };

  const [currentUser, setCurrentUser] = useState<User | null>(user || demoUser);

  // Update local user state when props change
  React.useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      // Fetch demo user from backend to persist changes
      fetch('/api/users')
        .then(async res => {
          if (!res.ok) throw new Error('Failed to fetch users');
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error('Invalid JSON response:', text.substring(0, 100));
            throw new Error('Invalid JSON response');
          }
        })
        .then(data => {
          const demo = data.users.find((u: User) => u.email === 'demo@example.com');
          if (demo) {
            setCurrentUser({ ...demo, id: 'demo-1' });
          } else {
            setCurrentUser(demoUser);
          }
        })
        .catch((err) => {
          console.error('Error fetching demo user:', err);
          setCurrentUser(demoUser);
        });
    }
  }, [user]);

  // Fetch real current connections
  React.useEffect(() => {
    const effectiveId = currentUser?.id;
    if (!effectiveId) return;
    fetch('/api/teachings')
      .then(async res => {
        if (!res.ok) return;
        const data = await res.json();
        const allTeachings = data.teachings || [];

        const asTeacher = allTeachings
          .filter((t: any) => t.teacherId?.id === effectiveId || t.teacherId?._id === effectiveId)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            learnerCount: t.membersConnected?.length || 0,
          }));

        const asLearner = allTeachings
          .filter((t: any) =>
            t.membersConnected?.some((m: any) => m.id === effectiveId || m._id === effectiveId)
          )
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            teacher: {
              fullName: t.teacherId?.fullName || 'Unknown Teacher',
              imageUrl: t.teacherId?.imageUrl || '',
              headline: t.teacherId?.headline || 'Teacher',
            },
          }));

        setConnections({ asTeacher, asLearner });
      })
      .catch(err => console.error('Error fetching connections:', err));
  }, [currentUser?.id]);

  // Fetch real upcoming sessions
  React.useEffect(() => {
    const id = currentUser?.id;
    if (!id) return;
    fetch(`/api/sessions/user/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setSessions(data.sessions || []); })
      .catch(err => console.error('Error fetching sessions:', err));
  }, [currentUser?.id]);

  const formatSessionDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const isMeetingTime = (scheduledDate: string, scheduledTime: string) => {
    const meetingDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    return new Date() >= meetingDateTime;
  };

  const handleSaveSkills = (skillsToTeach: string[], skillsToLearn: string[]) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        skillsToTeach,
        skillsToLearn
      };
      setCurrentUser(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
    } else {
      // Handle demo user state update
      const updatedDemoUser = {
        id: 'demo-1',
        email: 'demo@example.com',
        fullName: 'Demo User',
        headline: 'Learner & Teacher',
        location: 'Remote',
        imageUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
        rating: 0,
        reputationScore: 0,
        certificates: [],
        skillsToTeach,
        skillsToLearn,
        verified: true
      };
      setCurrentUser(updatedDemoUser);
      if (onUpdateUser) onUpdateUser(updatedDemoUser);
    }
  };

  const handleSaveTeach = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    if (onUpdateUser) onUpdateUser(updatedUser);
  };

  const handleSaveProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    if (onUpdateUser) onUpdateUser(updatedUser);
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to mark this session as completed?')) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: currentUser?.id }),
      });
      if (res.ok) {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed' } : s));
      }
    } catch (err) {
      console.error('Complete session error:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session record?')) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-earthy-cream font-jakarta">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="font-fraunces text-2xl text-earthy-dark cursor-pointer" onClick={() => onNavigate('dashboard')}>
              SkillShare
            </h1>
            <nav className="hidden md:flex gap-6">
              <button onClick={() => onNavigate('dashboard')} className="text-earthy-dark font-bold border-b-2 border-earthy-dark py-5">Dashboard</button>
              <button onClick={() => onNavigate('discovery')} className="text-slate-500 hover:text-earthy-dark font-medium py-5 transition-colors">Discovery</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{currentUser?.fullName || 'User'}</span>
              <span className="text-xs text-slate-500">{currentUser?.headline || 'Learner & Teacher'}</span>
            </div>
            <img 
              src={currentUser?.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-slate-100 cursor-pointer hover:border-earthy-green transition-colors"
              onClick={() => setIsProfileOpen(true)}
              title="View Profile"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-fraunces text-earthy-dark">Welcome back, {currentUser?.fullName?.split(' ')[0] || 'there'}!</h2>
          <p className="text-slate-600 mt-2">Here's what's happening with your skill sharing journey today.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile & Skills */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <h3 
                  className="font-bold text-lg text-slate-900 cursor-pointer hover:text-earthy-green transition-colors"
                  onClick={() => setIsProfileOpen(true)}
                >
                  My Profile
                </h3>
                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="text-slate-400 hover:text-earthy-dark bg-slate-50 p-2 rounded-full transition-colors flex items-center justify-center"
                  title="Edit Profile Details"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={currentUser?.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full border-4 border-slate-50 cursor-pointer hover:border-earthy-green/50 transition-colors"
                  onClick={() => setIsProfileOpen(true)}
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 cursor-pointer hover:text-earthy-green transition-colors" onClick={() => setIsProfileOpen(true)}>{currentUser?.fullName}</h4>
                    {currentUser?.isAvailableToTeach && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-earthy-green/10 text-earthy-green text-xs font-bold rounded-md" title="Verified Teacher">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{currentUser?.headline || 'Learner & Teacher'}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{currentUser?.location || 'Remote'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 border-t border-slate-100 pt-5 relative">
                <button 
                  onClick={() => setIsEditSkillsOpen(true)}
                  className="absolute top-5 right-0 text-slate-400 hover:text-earthy-green transition-colors"
                  title="Edit Skills"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> I can teach
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentUser?.skillsToTeach && currentUser.skillsToTeach.length > 0 ? (
                      currentUser.skillsToTeach.map(skill => (
                        <span key={skill} className="px-2.5 py-1 bg-earthy-green/10 text-earthy-green rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No skills listed yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> I want to learn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentUser?.skillsToLearn && currentUser.skillsToLearn.length > 0 ? (
                      currentUser.skillsToLearn.map(skill => (
                        <span key={skill} className="px-2.5 py-1 bg-earthy-rust/10 text-earthy-rust rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No skills listed yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-earthy-green/10 rounded-2xl p-6 border border-earthy-green/20">
              <h3 className="font-bold text-earthy-dark mb-2">Ready to connect?</h3>
              <p className="text-sm text-earthy-dark/80 mb-4">Browse the community to find your next mentor or student.</p>
              <div className="space-y-3">
                <button 
                  onClick={() => setIsTeachModalOpen(true)}
                  className="w-full py-2.5 bg-earthy-dark text-white rounded-xl text-sm font-bold shadow-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Apply to Teach
                </button>
                <button 
                  onClick={() => onNavigate('discovery')}
                  className="w-full py-2.5 bg-white text-earthy-green rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 border border-earthy-green/20"
                >
                  <Users className="w-4 h-4" />
                  Go to Discovery
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Activity & Sessions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-earthy-dark" />
                  Sessions
                </h3>
                <span className="text-xs font-bold text-slate-400">{sessions.length} total</span>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-bold text-slate-500">No sessions scheduled</p>
                  <p className="text-sm text-slate-400 mt-1">Use the "Meet" button in My Teachings to schedule a session.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s: any) => {
                    const isTeacher = s.teacherId === currentUser?.id;
                    const isEnded = s.status === 'ended';
                    return (
                      <div key={s.id} className={`p-4 rounded-xl border transition-colors ${
                        isEnded ? 'border-slate-100 bg-slate-50' : 'border-slate-100 hover:border-earthy-green/30'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl shrink-0 ${isTeacher ? 'bg-earthy-green/10 text-earthy-green' : 'bg-earthy-rust/10 text-earthy-rust'}`}>
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isTeacher ? 'text-earthy-green' : 'text-earthy-rust'}`}>
                                {isTeacher ? `Teaching · ${s.learnerName}` : `Learning from · ${s.teacherName}`}
                              </p>
                              <p className="font-bold text-slate-900 truncate text-sm">{s.teachingTitle}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                          {s.status === 'ended' ? (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-md flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Ended
                                </span>
                                {s.feedbackSubmitted && (
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Feedback Submitted
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : s.status === 'completed' ? (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-100">
                                  <CheckCircle2 className="w-3 h-3" /> Completed
                                </span>
                                {!isTeacher && !s.feedbackSubmitted && (
                                  <button
                                    onClick={() => setFeedbackTarget(s)}
                                    className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors"
                                  >
                                    <Star className="w-3 h-3" /> Rate Teacher
                                  </button>
                                )}
                                {!isTeacher && s.feedbackSubmitted && (
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Submitted
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 border border-indigo-100">
                                  <Calendar className="w-3 h-3" /> Scheduled
                                </span>
                                {isTeacher && (
                                  <button
                                    onClick={() => handleCompleteSession(s.id)}
                                    className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                    title="Mark this session as finished"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Session
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {formatSessionDate(s.scheduledDate)} {s.scheduledTime}
                                </span>
                                {isMeetingTime(s.scheduledDate, s.scheduledTime) && (
                                  <a href={s.meetLink} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Join Now
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                            <button
                              onClick={() => handleDeleteSession(s.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Session Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Current Connections */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-earthy-dark" />
                  Current Connections
                </h3>
                <button onClick={() => onNavigate('discovery')} className="text-sm font-bold text-earthy-green hover:underline">Discover More</button>
              </div>

              {connections.asTeacher.length === 0 && connections.asLearner.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-bold text-slate-500">No connections yet</p>
                  <p className="text-sm text-slate-400 mt-1">Connect with a teacher in the Discovery tab to get started.</p>
                  <button onClick={() => onNavigate('discovery')} className="mt-4 px-4 py-2 bg-earthy-green text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                    Go to Discovery
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.asTeacher.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-earthy-green/5">
                      <div className="w-9 h-9 bg-earthy-green/10 rounded-full flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-earthy-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{t.title}</p>
                        <p className="text-xs text-earthy-green font-medium">Teaching · {t.learnerCount} learner{t.learnerCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                  {connections.asLearner.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-earthy-rust/5">
                      <img
                        src={t.teacher.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`}
                        alt={t.teacher.fullName}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{t.title}</p>
                        <p className="text-xs text-earthy-rust font-medium truncate">Enrolled · {t.teacher.fullName}</p>
                      </div>
                      <button
                        onClick={() => onNavigate('discovery')}
                        className="p-1.5 text-earthy-rust hover:bg-earthy-rust/10 rounded-full transition-colors shrink-0"
                        title="Go to Discovery"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {isProfileOpen && (
        <ProfileModal 
          user={currentUser || demoUser} 
          onClose={() => setIsProfileOpen(false)} 
          onLogout={onLogout} 
        />
      )}

      {isEditProfileOpen && (
        <EditProfileModal 
          user={currentUser || demoUser} 
          onClose={() => setIsEditProfileOpen(false)} 
          onSave={handleSaveProfile} 
        />
      )}

      {isEditSkillsOpen && (
        <EditSkillsModal 
          user={currentUser || demoUser}
          onClose={() => setIsEditSkillsOpen(false)}
          onSave={handleSaveSkills}
        />
      )}

      {isTeachModalOpen && (
        <TeachModal
          user={currentUser || demoUser}
          onClose={() => setIsTeachModalOpen(false)}
          onSave={handleSaveTeach}
        />
      )}

      {feedbackTarget && currentUser && (
        <FeedbackModal
          sessionId={feedbackTarget.id}
          teachingId={feedbackTarget.teachingId}
          teacherId={feedbackTarget.teacherId}
          learnerId={currentUser.id}
          teacherName={feedbackTarget.teacherName}
          teachingTitle={feedbackTarget.teachingTitle}
          onClose={() => setFeedbackTarget(null)}
          onSubmitted={() => {
            setFeedbackTarget(null);
            
            // Refresh sessions list
            if (currentUser?.id) {
              fetch(`/api/sessions/user/${currentUser.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => { if (data) setSessions(data.sessions || []); })
                .catch(() => {});
              
              // Refresh user data (for updated ratings/reputation)
              fetch('/api/users')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                  if (data && data.users) {
                    const updated = data.users.find((u: any) => u.id === currentUser.id || u._id === currentUser.id);
                    if (updated && onUpdateUser) onUpdateUser(updated);
                  }
                })
                .catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}
