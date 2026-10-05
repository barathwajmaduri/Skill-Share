
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  headline: { type: String, default: 'Learner & Teacher' },
  location: { type: String, default: 'Remote' },
  imageUrl: { type: String, default: 'https://randomuser.me/api/portraits/lego/1.jpg' },
  rating: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 0 },
  certificates: { type: [String], default: [] },
  skillsToTeach: { type: [String], default: [] },
  skillsToLearn: { type: [String], default: [] },
  isAvailableToTeach: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
