import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  teachingId: { type: String, required: true },
  teacherId: { type: String, required: true },
  learnerId: { type: String, required: true },
  teachingTitle: { type: String, required: true },
  teacherName: { type: String, required: true },
  learnerName: { type: String, required: true },
  teacherImageUrl: { type: String, default: '' },
  learnerImageUrl: { type: String, default: '' },
  scheduledDate: { type: String, required: true },   // "2026-03-07"
  scheduledTime: { type: String, required: true },   // "10:00"
  duration: { type: String, required: true },        // "60"
  meetLink: { type: String, required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'ended'], default: 'scheduled' },
  feedbackSubmitted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

sessionSchema.index({ teacherId: 1, learnerId: 1, status: 1 });

export const Session = mongoose.model('Session', sessionSchema);
