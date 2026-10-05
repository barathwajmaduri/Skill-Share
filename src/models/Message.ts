import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  teachingId: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileType: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Index for fast queries
messageSchema.index({ teachingId: 1, senderId: 1, receiverId: 1 });

export const Message = mongoose.model('Message', messageSchema);
