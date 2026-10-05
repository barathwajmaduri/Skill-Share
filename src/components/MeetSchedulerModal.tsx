import React, { useState } from 'react';
import { User } from '../db';
import { X, Video, Calendar, Clock, Link2, Check } from 'lucide-react';

interface Teaching {
  id: string;
  title: string;
}

interface MeetSchedulerModalProps {
  teaching: Teaching;
  learner: User;
  teacher: User;
  onClose: () => void;
  onScheduled?: () => void;
}

export default function MeetSchedulerModal({ teaching, learner, teacher, onClose, onScheduled }: MeetSchedulerModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];
  
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('1 hour');
  const [message, setMessage] = useState(`Hi ${learner.fullName.split(' ')[0]}, let's meet to discuss ${teaching.title}!`);
  const [scheduled, setScheduled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meetLink, setMeetLink] = useState('');

  const handleSchedule = async () => {
    setSaving(true);
    try {
      // Generate unique Jitsi meet link
      const titleSlug = teaching.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      const dateSlug = date.replace(/-/g, '');
      const timeSlug = time.replace(':', '');
      const link = `https://meet.jit.si/SkillShare-${titleSlug}-${dateSlug}-${timeSlug}`;
      
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teachingId: teaching.id,
          teacherId: teacher.id,
          learnerId: learner.id,
          teachingTitle: teaching.title,
          teacherName: teacher.fullName,
          learnerName: learner.fullName,
          teacherImageUrl: teacher.imageUrl || '',
          learnerImageUrl: learner.imageUrl || '',
          scheduledDate: date,
          scheduledTime: time,
          duration,
          meetLink: link,
          message,
        }),
      });

      setMeetLink(link);
      setScheduled(true);
      if (onScheduled) onScheduled();
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(meetLink);
  };

  const openMeet = () => {
    window.open(meetLink, '_blank');
  };

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-jakarta">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Video className="w-5 h-5" /> Schedule a Meet
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={learner.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`}
              alt={learner.fullName}
              className="w-9 h-9 rounded-full border-2 border-white/30 object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="font-semibold text-sm">{learner.fullName}</p>
              <p className="text-xs text-white/70">{teaching.title}</p>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {!scheduled ? (
            <div className="space-y-5">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Time Picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 1 hour, 45 mins, 2 hours..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message to Learner</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSchedule}
                disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Calendar className="w-4 h-4" /> Confirm Schedule</>
                )}
              </button>
            </div>
          ) : (
            /* Scheduled Confirmation */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Meeting Scheduled!</h3>
              <p className="text-slate-500 text-sm mb-6">
                {formatDisplayDate(date)} at {time} · {duration}
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Meeting Link</p>
                <p className="text-sm text-indigo-600 font-mono break-all">{meetLink}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  <Link2 className="w-4 h-4" /> Copy Link
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
