import React, { useState, useEffect } from 'react';
import { User } from '../db';
import { Trash2, Video, Users, FileText, Calendar, PlayCircle, ChevronDown, ChevronUp, MessageCircle, Phone, Clock, CheckCircle2, Star, ExternalLink } from 'lucide-react';
import ChatModal from './ChatModal';
import MeetSchedulerModal from './MeetSchedulerModal';
import FeedbackModal from './FeedbackModal';

interface Teaching {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  demoVideoUrl?: string;
  certificateUrl?: string;
  membersConnected: User[];
  createdAt: Date;
}

interface Session {
  id: string;
  teachingId: string;
  teacherId: string;
  learnerId: string;
  teachingTitle: string;
  teacherName: string;
  learnerName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  meetLink: string;
  status: 'scheduled' | 'ended';
}

interface MyTeachingsScreenProps {
  user: User;
}

export function MyTeachingsScreen({ user }: MyTeachingsScreenProps) {
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<{ teaching: Teaching; learner: User } | null>(null);
  const [meetTarget, setMeetTarget] = useState<{ teaching: Teaching; learner: User } | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ session: Session } | null>(null);

  useEffect(() => {
    fetchAll();
  }, [user.id]);

  const fetchAll = async () => {
    try {
      const [teachingsRes, sessionsRes] = await Promise.all([
        fetch(`/api/teachings/user/${user.id}`),
        fetch(`/api/sessions/user/${user.id}`)
      ]);
      if (teachingsRes.ok) {
        const data = await teachingsRes.json();
        setTeachings(data.teachings);
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionForLearner = (teachingId: string, learnerId: string) =>
    sessions.find(s => s.teachingId === teachingId && s.learnerId === learnerId) || null;

  const handleEndSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this session?')) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: user.id }),
      });
      if (res.ok) {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'ended' } : s));
      }
    } catch (err) {
      console.error('End session error:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  const handleDeleteTeaching = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teaching?')) return;
    try {
      const response = await fetch(`/api/teachings/${id}`, { method: 'DELETE' });
      if (response.ok) setTeachings(teachings.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting teaching:', error);
    }
  };

  const handleDeleteDemo = async (id: string) => {
    if (!confirm('Are you sure you want to delete the demo video?')) return;
    try {
      const response = await fetch(`/api/teachings/${id}/demo`, { method: 'DELETE' });
      if (response.ok) {
        setTeachings(teachings.map(t => t.id === id ? { ...t, demoVideoUrl: undefined } : t));
      }
    } catch (error) {
      console.error('Error deleting demo:', error);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const isMeetingTime = (scheduledDate: string, scheduledTime: string) => {
    const meetingDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    return new Date() >= meetingDateTime;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Teachings</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your classes, sessions and demo videos</p>
        </div>
      </div>

      {teachings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No teachings yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">Apply to teach from the Dashboard to start sharing your knowledge.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teachings.map((teaching) => {
            const isExpanded = expandedId === teaching.id;
            return (
              <div key={teaching.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : teaching.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{teaching.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(teaching.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {teaching.membersConnected?.length || 0} Learners</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTeaching(teaching.id); }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Teaching"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-gray-700 mb-8 max-w-3xl">{teaching.description || "No description provided."}</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Media */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Video className="w-4 h-4" /> Demo Video
                          </h4>
                          <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden group">
                            {teaching.demoVideoUrl ? (
                              <>
                                <video src={teaching.demoVideoUrl} controls className="w-full h-full object-cover" />
                                <button
                                  onClick={() => handleDeleteDemo(teaching.id)}
                                  className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md text-white rounded-lg hover:bg-red-500/80 transition-opacity opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white/60 text-sm flex items-center gap-2"><PlayCircle className="w-5 h-5" /> No video uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {teaching.certificateUrl && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Certificate
                            </h4>
                            <a
                              href={teaching.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-all text-indigo-600 font-medium"
                            >
                              <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="w-5 h-5" /></div>
                              View Uploaded Certificate
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right: Learners + Sessions */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Learners & Sessions
                        </h4>
                        <div className="space-y-3">
                          {teaching.membersConnected && teaching.membersConnected.length > 0 ? teaching.membersConnected.map(learner => {
                            const session = getSessionForLearner(teaching.id, learner.id);
                            return (
                              <div key={learner.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                                {/* Learner Row */}
                                <div className="flex items-center justify-between p-4">
                                  <div className="flex items-center gap-3">
                                    <img src={learner.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`} alt={learner.fullName} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
                                    <div>
                                      <p className="font-semibold text-gray-900">{learner.fullName}</p>
                                      <p className="text-xs text-gray-500">{learner.headline || `Learning ${teaching.title}`}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        const normalizedLearner = { ...learner, id: learner.id || (learner as any)._id };
                                        setChatTarget({ teaching, learner: normalizedLearner });
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-semibold"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" /> Chat
                                    </button>
                                    <button
                                      onClick={() => {
                                        const normalizedLearner = { ...learner, id: learner.id || (learner as any)._id };
                                        setMeetTarget({ teaching, learner: normalizedLearner });
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors font-semibold"
                                    >
                                      <Phone className="w-3.5 h-3.5" /> Meet
                                    </button>
                                  </div>
                                </div>

                                {/* Session Status Banner */}
                                {session && (
                                  <div className={`px-4 py-3 border-t text-xs flex items-center justify-between gap-2 ${
                                    session.status === 'ended'
                                      ? 'bg-gray-100 border-gray-200'
                                      : 'bg-indigo-50 border-indigo-100'
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      {session.status === 'ended' ? (
                                        <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                                      ) : (
                                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                                      )}
                                      <span className={`font-semibold ${session.status === 'ended' ? 'text-gray-500' : 'text-indigo-700'}`}>
                                        {session.status === 'ended' ? 'Session Ended' : `Scheduled: ${formatDate(session.scheduledDate)} at ${session.scheduledTime}`}
                                        {session.status !== 'ended' && ` · ${session.duration} min`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {session.status !== 'ended' && (
                                        <>
                                          {isMeetingTime(session.scheduledDate, session.scheduledTime) && (
                                            <a href={session.meetLink} target="_blank" rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
                                            >
                                              <ExternalLink className="w-3 h-3" /> Join Now
                                            </a>
                                          )}
                                          <button
                                            onClick={() => handleEndSession(session.id)}
                                            className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md font-semibold hover:bg-red-100 transition-colors"
                                            title="End Session"
                                          >
                                            End
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSession(session.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Session"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                      {session.status === 'ended' && (
                                        <button
                                          onClick={() => handleDeleteSession(session.id)}
                                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete Session Record"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }) : (
                            <div className="text-center py-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm font-medium text-gray-900">No learners connected yet</p>
                              <p className="text-xs text-gray-500 mt-1">Your teaching is visible in the Discover tab.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {chatTarget && (
        <ChatModal
          teachingId={chatTarget.teaching.id}
          currentUser={user}
          otherUser={chatTarget.learner}
          teachingTitle={chatTarget.teaching.title}
          onClose={() => setChatTarget(null)}
        />
      )}

      {meetTarget && (
        <MeetSchedulerModal
          teaching={meetTarget.teaching}
          learner={meetTarget.learner}
          teacher={user}
          onScheduled={fetchAll}
          onClose={() => setMeetTarget(null)}
        />
      )}

      {feedbackTarget && (
        <FeedbackModal
          sessionId={feedbackTarget.session.id}
          teachingId={feedbackTarget.session.teachingId}
          teacherId={feedbackTarget.session.teacherId}
          learnerId={feedbackTarget.session.learnerId}
          teacherName={feedbackTarget.session.teacherName}
          teachingTitle={feedbackTarget.session.teachingTitle}
          onClose={() => setFeedbackTarget(null)}
          onSubmitted={() => setFeedbackTarget(null)}
        />
      )}
    </div>
  );
}
