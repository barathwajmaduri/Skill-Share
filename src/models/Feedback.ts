import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  teachingId: { type: String, required: true },
  teacherId: { type: String, required: true },
  learnerId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reputationScore: { type: Number, required: true, min: 0, max: 100 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const Feedback = mongoose.model('Feedback', feedbackSchema);
