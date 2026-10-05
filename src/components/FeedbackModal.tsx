import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  sessionId: string;
  teachingId: string;
  teacherId: string;
  learnerId: string;
  teacherName: string;
  teachingTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function FeedbackModal({
  sessionId, teachingId, teacherId, learnerId,
  teacherName, teachingTitle, onClose, onSubmitted
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reputationScore, setReputationScore] = useState(80); // Default good reputation
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, teachingId, teacherId, learnerId, rating, reputationScore, comment }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
        setTimeout(() => { onSubmitted(); onClose(); }, 2000);
      }
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 font-jakarta">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Rate Your Session</h2>
              <p className="text-sm text-white/80 mt-1">with {teacherName}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs mt-2 bg-white/20 px-3 py-1.5 rounded-full inline-block">{teachingTitle}</p>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-bold text-slate-900 text-lg">Thank you!</p>
              <p className="text-slate-500 text-sm mt-1">Your feedback helps improve teaching quality.</p>
            </div>
          ) : (
            <>
              {/* Star Rating */}
              <p className="text-sm font-bold text-slate-700 mb-3 text-center">How was your experience?</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 ${
                        star <= (hovered || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200 fill-slate-50'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <p className="text-center text-sm font-bold text-amber-500 mb-2">{labels[hovered || rating]}</p>
              )}

              {/* Reputation Score */}
              <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700">Reputation Score</label>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                    reputationScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                    reputationScore >= 50 ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {reputationScore}/100
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={reputationScore}
                  onChange={(e) => setReputationScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Poor</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Excellent</span>
                </div>
              </div>

              {/* Comment */}
              <div className="mt-4">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Leave a comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 resize-none transition-all"
                  placeholder={`What did you think about ${teacherName.split(' ')[0]}'s teaching?`}
                />
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
