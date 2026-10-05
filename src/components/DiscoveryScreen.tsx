import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MapPin, BookOpen, GraduationCap, UserPlus, CheckCircle2, ShieldCheck, Video, Award, MessageCircle, Star } from 'lucide-react';
import { User, Teaching } from '../db';
import ProfileModal from './ProfileModal';
import ChatModal from './ChatModal';

interface PopulatedTeaching extends Omit<Teaching, 'teacherId' | 'membersConnected'> {
  teacherId: User;
  membersConnected: string[] | User[]; // Depending on if it's fully populated everywhere, usually array of IDs or Objects
}

interface DiscoveryScreenProps {
  onNavigate: (view: 'login' | 'onboarding' | 'dashboard' | 'discovery') => void;
  user: User | null;
  onLogout?: () => void;
}

export default function DiscoveryScreen({ onNavigate, user, onLogout }: DiscoveryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'react' | 'design' | 'python'>('all');
  const [teachings, setTeachings] = useState<PopulatedTeaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [chatTeaching, setChatTeaching] = useState<{ teaching: PopulatedTeaching } | null>(null);

  useEffect(() => {
    const fetchTeachingsData = async () => {
      try {
        const response = await fetch('/api/teachings');
        if (response.ok) {
          const data = await response.json();
          // Show all teachings as requested: "show the all users teaching that they have applied"
          setTeachings(data.teachings);
        } else {
          console.error('Failed to fetch teachings:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch teachings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachingsData();
  }, [user]);

  const handleConnect = async (e: React.MouseEvent, teachingId: string, isDisconnect: boolean = false) => {
    e.stopPropagation();
    if (!user) {
      alert('Please log in to connect with mentors.');
      return;
    }
    setConnecting(teachingId);
    try {
      const endpoint = isDisconnect ? `/api/teachings/${teachingId}/disconnect` : `/api/teachings/${teachingId}/connect`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ learnerId: user.id }),
      });
      if (response.ok) {
        // Refresh teachings to update UI
        const res = await fetch('/api/teachings');
        const data = await res.json();
        setTeachings(data.teachings || []);
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${isDisconnect ? 'disconnect' : 'connect'}`);
      }
    } catch (error) {
      console.error(`${isDisconnect ? 'Disconnect' : 'Connect'} error:`, error);
      alert('An error occurred. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  // Filter teachings based on search query and active filter
  const filteredTeachings = teachings.filter(t => {
    const teacherName = t.teacherId?.fullName || '';
    const title = t.title || '';
    const description = t.description || '';
    const teacherSkills = t.teacherId?.skillsToTeach || [];

    // "search any skill there it has to show that skill related teachings by other users"
    const matchesSearch = 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacherSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'react' && !title.toLowerCase().includes('react')) return false;
    if (activeFilter === 'design' && (!title.toLowerCase().includes('design') && !title.toLowerCase().includes('ui'))) return false;
    if (activeFilter === 'python' && !title.toLowerCase().includes('python')) return false;

    return true;
  });

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
              <button onClick={() => onNavigate('dashboard')} className="text-slate-500 hover:text-earthy-dark font-medium py-5 transition-colors">Dashboard</button>
              <button onClick={() => onNavigate('discovery')} className="text-earthy-dark font-bold border-b-2 border-earthy-dark py-5">Discovery</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user?.fullName || 'User'}</span>
              <span className="text-xs text-slate-500">{user?.headline || 'Learner & Teacher'}</span>
            </div>
            <img 
              src={user?.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-slate-100 cursor-pointer hover:border-earthy-green transition-colors"
              onClick={() => setIsProfileOpen(true)}
              title="View Profile"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      <main className="pt-8 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-fraunces text-earthy-dark mb-2">Discover Teachings</h1>
          <p className="text-earthy-dark/70">Find skills you want to learn and connect directly with mentors offering them.</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by skill, title, or mentor name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earthy-green/50 focus:border-earthy-green transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${activeFilter === 'all' ? 'bg-earthy-dark text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              All Skills
            </button>
            <button 
              onClick={() => setActiveFilter('react')}
              className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${activeFilter === 'react' ? 'bg-earthy-green text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              React
            </button>
            <button 
              onClick={() => setActiveFilter('design')}
              className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${activeFilter === 'design' ? 'bg-earthy-rust text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              UI/UX Design
            </button>
            <button 
              onClick={() => setActiveFilter('python')}
              className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${activeFilter === 'python' ? 'bg-earthy-blue text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Python
            </button>
          </div>
        </div>

        {/* Feed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-earthy-green mx-auto mb-4"></div>
                <p className="text-slate-500">Loading teachings...</p>
              </div>
            ) : filteredTeachings.length > 0 ? (
              filteredTeachings.map((teaching, index) => {
                const isConnected = user && teaching.membersConnected.some(m => {
                  if (typeof m === 'string') return m === user.id;
                  return m.id === user.id || (m as any)._id?.toString() === user.id;
                });
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={teaching.id} 
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => teaching.teacherId && setSelectedUser(teaching.teacherId)}
                  >
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Avatar of the Teacher */}
                      <img 
                        src={teaching.teacherId?.imageUrl || `https://randomuser.me/api/portraits/lego/${(index % 9) + 1}.jpg`} 
                        alt={teaching.teacherId?.fullName} 
                        className="w-16 h-16 rounded-full object-cover border-4 border-slate-50 shadow-sm shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Teaching Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2.5 py-1 bg-earthy-green/10 text-earthy-green rounded-md text-xs font-bold uppercase tracking-wide">
                                Class: {teaching.title}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-earthy-green transition-colors">
                              Mentor: {teaching.teacherId?.fullName || 'Unknown Mentor'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-xs mt-1 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{teaching.teacherId?.location || 'Remote'}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{(teaching.teacherId?.rating || 0).toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{teaching.teacherId?.reputationScore || 0}%</span>
                              </div>
                            </div>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 border-t border-slate-100 pt-3">Mentor Specializations:</p>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              {teaching.teacherId?.skillsToTeach?.length ? (
                                teaching.teacherId.skillsToTeach.map((skill, idx) => {
                                  const isMatch = searchQuery && skill.toLowerCase().includes(searchQuery.toLowerCase());
                                  return (
                                    <span 
                                      key={idx} 
                                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                                        isMatch 
                                          ? 'bg-earthy-rust text-white shadow-sm ring-2 ring-earthy-rust/30' 
                                          : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                                      }`}
                                    >
                                      {skill}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-slate-400 italic">No specializations listed</span>
                              )}
                            </div>
                          </div>
                          
                          {user && (teaching.teacherId?.id === user.id || teaching.teacherId?._id === user.id) ? (
                            <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-sm font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Your Session
                            </div>
                          ) : (
                            <button 
                              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
                                isConnected 
                                  ? 'bg-earthy-rust/10 text-earthy-rust hover:bg-earthy-rust/20' 
                                  : 'bg-earthy-dark text-white hover:bg-black'
                              }`}
                              onClick={(e) => handleConnect(e, teaching.id, isConnected)}
                              disabled={connecting === teaching.id}
                            >
                              <UserPlus className="w-4 h-4" />
                              {connecting === teaching.id ? (isConnected ? 'Disconnecting...' : 'Connecting...') : isConnected ? 'Connected (Disconnect)' : 'Connect'}
                            </button>
                          )}
                        </div>
  
                        <p className="text-slate-600 font-medium text-sm mb-4 line-clamp-2">
                          {teaching.description || "No description provided."}
                        </p>
  
                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-50">
                          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {teaching.membersConnected.length} Learners Enrolled</span>
                          {teaching.demoVideoUrl && <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-earthy-green" /> Demo Video Available</span>}
                          {teaching.certificateUrl && <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-earthy-green" /> Certified Teacher</span>}
                        </div>
                      </div>
                    </div>
                    {isConnected && (
                      <div 
                        className="mt-5 pt-5 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-earthy-green" /> Mentor Verification
                        </h4>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          {teaching.demoVideoUrl ? (
                            <a 
                              href={teaching.demoVideoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-earthy-green hover:text-earthy-green transition-colors shadow-sm"
                            >
                              <Video className="w-4 h-4" /> Watch Demo
                            </a>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed">
                              <Video className="w-4 h-4" /> No Demo
                            </div>
                          )}

                          {teaching.certificateUrl ? (
                            <a 
                              href={teaching.certificateUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-500 hover:text-blue-500 transition-colors shadow-sm"
                            >
                              <Award className="w-4 h-4" /> Certificate
                            </a>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed">
                              <Award className="w-4 h-4" /> No Certificate
                            </div>
                          )}

                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const teacher = teaching.teacherId as any;
                              const normalizedTeacher = { ...teacher, id: teacher.id || teacher._id };
                              // We need to ensure the teaching object passed to setChatTeaching has the teacher populated and IDs normalized
                              setChatTeaching({ teaching: { ...teaching, id: teaching.id || (teaching as any)._id, teacherId: normalizedTeacher } }); 
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-earthy-green text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" /> Start Chat
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No profiles found</h3>
                <p className="text-slate-500">Try adjusting your search or filters to find more people.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">Trending Skills</h3>
              <div className="space-y-3">
                {['React', 'UI/UX Design', 'Python', 'Digital Marketing', 'Public Speaking'].map((skill, i) => (
                  <div key={skill} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm text-slate-600 group-hover:text-earthy-dark transition-colors">{skill}</span>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{120 - i * 15} learners</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-earthy-green/10 p-6 rounded-2xl border border-earthy-green/20">
              <h3 className="font-bold text-earthy-dark mb-2">Share your expertise</h3>
              <p className="text-sm text-earthy-dark/80 mb-4">Update your profile with skills you can teach to appear in more searches.</p>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="w-full py-2 bg-white text-earthy-green rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Update Profile
              </button>
            </div>
          </div>

        </div>
      </main>

      {chatTeaching && user && chatTeaching.teaching.teacherId && (
        <ChatModal
          teachingId={chatTeaching.teaching.id}
          currentUser={user}
          otherUser={chatTeaching.teaching.teacherId as User}
          teachingTitle={chatTeaching.teaching.title}
          onClose={() => setChatTeaching(null)}
        />
      )}

      {selectedUser && (
        <ProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      {isProfileOpen && (
        <ProfileModal 
          user={user || {
            id: 'demo-1',
            email: 'demo@example.com',
            fullName: 'Demo User',
            headline: 'Learner & Teacher',
            location: 'Remote',
            imageUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
            rating: 4.8,
            reputationScore: 85,
            certificates: ['Frontend Development Fundamentals', 'Advanced UI/UX Patterns'],
            skillsToTeach: ['React', 'JavaScript'],
            skillsToLearn: ['UI/UX Design'],
            isAvailableToTeach: false,
            verified: true
          }} 
          onClose={() => setIsProfileOpen(false)} 
          onLogout={onLogout} 
        />
      )}
    </div>
  );
}
