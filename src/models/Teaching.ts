import mongoose from 'mongoose';

const teachingSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  demoVideoUrl: { type: String }, // URL or path to the video
  certificateUrl: { type: String }, // URL or path to the certificate
  membersConnected: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Students
  createdAt: { type: Date, default: Date.now },
});

export const Teaching = mongoose.model('Teaching', teachingSchema);
