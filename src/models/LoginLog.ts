
import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, required: true },
  failureReason: { type: String }
});

export const LoginLog = mongoose.model('LoginLog', loginLogSchema);
