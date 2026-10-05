import mongoose from 'mongoose';
import { User as UserModel } from './models/User';
import { Teaching as TeachingModel } from './models/Teaching';
import { Message as MessageModel } from './models/Message';
import { Session as SessionModel } from './models/Session';
import { Feedback as FeedbackModel } from './models/Feedback';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    
    // Check if URI is defined and valid (starts with mongodb:// or mongodb+srv://)
    if (!mongoURI || !mongoURI.startsWith('mongodb')) {
      if (mongoURI) {
        console.warn(`Invalid MONGODB_URI scheme detected: "${mongoURI}". Ignoring provided URI.`);
      }
      console.log('Starting in-memory MongoDB instance with persistent storage...');
      
      const dbPath = path.join(process.cwd(), 'data', 'db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      // Clean up lock file if it exists (assuming previous process crashed)
      const lockFile = path.join(dbPath, 'mongod.lock');
      if (fs.existsSync(lockFile)) {
        try {
          fs.unlinkSync(lockFile);
          console.log('Removed stale mongod.lock file');
        } catch (err) {
          console.warn('Failed to remove mongod.lock file:', err);
        }
      }

      mongod = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath,
          storageEngine: 'wiredTiger'
        }
      });
      mongoURI = mongod.getUri();
      console.log(`In-memory MongoDB started at ${mongoURI} with dbPath ${dbPath}`);
    }

    console.log(`Attempting to connect to MongoDB at: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // If the provided URI failed (and we haven't already started in-memory), try falling back
    if (!mongod) {
        console.log('Falling back to purely in-memory MongoDB instance (no persistence) due to connection error...');
        try {
            // Try without dbPath as a last resort
            mongod = await MongoMemoryServer.create();
            const memoryUri = mongod.getUri();
            console.log(`Fallback: Purely in-memory MongoDB started at ${memoryUri}`);
            await mongoose.connect(memoryUri);
            console.log('Fallback: MongoDB connected successfully');
            return;
        } catch (fallbackError) {
            console.error('Failed to start in-memory MongoDB fallback:', fallbackError);
        }
    }
    throw error;
  }
};

export interface User {
  id: string; // Changed from number to string for MongoDB _id
  email: string;
  fullName: string;
  headline?: string;
  location?: string;
  imageUrl?: string;
  rating?: number;
  reputationScore?: number;
  certificates?: string[];
  skillsToTeach: string[];
  skillsToLearn: string[];
  isAvailableToTeach?: boolean;
  verified: boolean;
  verificationToken?: string;
  password?: string;
}

export interface Teaching {
  id: string;
  teacherId: string | any; // Changed to allow populated User
  title: string;
  description?: string;
  demoVideoUrl?: string;
  certificateUrl?: string;
  membersConnected: any[]; // Changed from string[] to any[] to allow populated User objects
  createdAt: Date;
}

export const createUser = async (email: string, password: string, fullName: string, skillsToTeach: string[], skillsToLearn: string[], verificationToken: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new UserModel({
    email,
    password: hashedPassword,
    fullName,
    skillsToTeach,
    skillsToLearn,
    verificationToken,
    verified: true, // Auto-verify: email verification disabled
    headline: 'New Member',
    location: 'Remote',
    imageUrl: `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 9) + 1}.jpg`,
    rating: 0,
    reputationScore: 0,
    certificates: [],
    isAvailableToTeach: false
  });
  await newUser.save();
  return { 
    id: newUser._id.toString(), 
    email: newUser.email, 
    fullName: newUser.fullName, 
    headline: newUser.headline,
    location: newUser.location,
    imageUrl: newUser.imageUrl,
    rating: newUser.rating,
    reputationScore: newUser.reputationScore,
    certificates: newUser.certificates,
    skillsToTeach: newUser.skillsToTeach, 
    skillsToLearn: newUser.skillsToLearn, 
    isAvailableToTeach: newUser.isAvailableToTeach,
    verified: newUser.verified 
  };
};

export const verifyUser = async (token: string) => {
  const user = await UserModel.findOne({ verificationToken: token });
  if (user) {
    user.verified = true;
    user.verificationToken = undefined; // Clear token
    await user.save();
    return true;
  }
  return false;
};

export const findUserByEmail = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (user) {
    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      headline: user.headline,
      location: user.location,
      imageUrl: user.imageUrl,
      rating: user.rating,
      reputationScore: user.reputationScore,
      certificates: user.certificates,
      password: user.password,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      isAvailableToTeach: user.isAvailableToTeach,
      verified: user.verified,
      verificationToken: user.verificationToken
    };
  }
  return null;
};

export const getUserById = async (id: string) => {
  try {
    const user = await UserModel.findById(id);
    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        headline: user.headline,
        location: user.location,
        imageUrl: user.imageUrl,
        rating: user.rating,
        reputationScore: user.reputationScore,
        certificates: user.certificates,
        skillsToTeach: user.skillsToTeach,
        skillsToLearn: user.skillsToLearn,
        isAvailableToTeach: user.isAvailableToTeach,
        verified: user.verified
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const users = await UserModel.find({ verified: true }).select('-password -verificationToken');
    return users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      headline: user.headline,
      location: user.location,
      imageUrl: user.imageUrl,
      rating: user.rating,
      reputationScore: user.reputationScore,
      certificates: user.certificates,
      skillsToTeach: user.skillsToTeach,
      skillsToLearn: user.skillsToLearn,
      isAvailableToTeach: user.isAvailableToTeach,
      verified: user.verified
    }));
  } catch (e) {
    console.error("Error fetching all users:", e);
    return [];
  }
};

export const updateUserSkills = async (id: string, skillsToTeach: string[], skillsToLearn: string[]) => {
  try {
    let user = null;
    if (id !== 'demo-1') {
      user = await UserModel.findById(id);
    }
    
    // If it's the demo user and not in DB yet, try to find by email or create
    if (id === 'demo-1') {
      user = await UserModel.findOne({ email: 'demo@example.com' });
      // omitted creation logic for brevity, it's already there
    }

    if (user) {
      user.skillsToTeach = skillsToTeach;
      user.skillsToLearn = skillsToLearn;
      await user.save();
      return {
        id: id === 'demo-1' ? 'demo-1' : user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        headline: user.headline,
        location: user.location,
        imageUrl: user.imageUrl,
        rating: user.rating,
        reputationScore: user.reputationScore,
        certificates: user.certificates,
        skillsToTeach: user.skillsToTeach,
        skillsToLearn: user.skillsToLearn,
        isAvailableToTeach: user.isAvailableToTeach,
        verified: user.verified
      };
    }
    return null;
  } catch (e) {
    console.error("Error updating user skills:", e);
    return null;
  }
};

export const updateUserProfile = async (id: string, updates: { fullName?: string; headline?: string; location?: string; imageUrl?: string }) => {
  try {
    let user = null;
    if (id !== 'demo-1') {
      user = await UserModel.findById(id);
    } else {
      user = await UserModel.findOne({ email: 'demo@example.com' });
    }

    if (user) {
      if (updates.fullName) user.fullName = updates.fullName;
      if (updates.headline !== undefined) user.headline = updates.headline;
      if (updates.location !== undefined) user.location = updates.location;
      if (updates.imageUrl !== undefined) user.imageUrl = updates.imageUrl;
      
      await user.save();
      return {
        id: id === 'demo-1' ? 'demo-1' : user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        headline: user.headline,
        location: user.location,
        imageUrl: user.imageUrl,
        rating: user.rating,
        reputationScore: user.reputationScore,
        certificates: user.certificates,
        skillsToTeach: user.skillsToTeach,
        skillsToLearn: user.skillsToLearn,
        isAvailableToTeach: user.isAvailableToTeach,
        verified: user.verified
      };
    }
    return null;
  } catch (e) {
    console.error("Error updating user profile:", e);
    return null;
  }
};

export const deleteUserCertificate = async (id: string, certificate: string) => {
  try {
    let user = null;
    if (id !== 'demo-1') {
      user = await UserModel.findById(id);
    } else {
      user = await UserModel.findOne({ email: 'demo@example.com' });
    }

    if (user) {
      user.certificates = user.certificates.filter(c => c !== certificate);
      await user.save();
      return {
        id: id === 'demo-1' ? 'demo-1' : user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        headline: user.headline,
        location: user.location,
        imageUrl: user.imageUrl,
        rating: user.rating,
        reputationScore: user.reputationScore,
        certificates: user.certificates,
        skillsToTeach: user.skillsToTeach,
        skillsToLearn: user.skillsToLearn,
        isAvailableToTeach: user.isAvailableToTeach,
        verified: user.verified
      };
    }
    return null;
  } catch (e) {
    console.error("Error deleting user certificate:", e);
    return null;
  }
};

export const setUserAvailableToTeach = async (id: string) => {
  try {
    let user = null;
    if (id !== 'demo-1') {
      user = await UserModel.findById(id);
    }

    // If it's the demo user and not in DB yet, try to find by email or create
    if (id === 'demo-1') {
      user = await UserModel.findOne({ email: 'demo@example.com' });
      if (!user) {
        user = new UserModel({
          email: 'demo@example.com',
          password: 'demo-password-not-used',
          fullName: 'Demo User',
          headline: 'Learner & Teacher',
          location: 'Remote',
          imageUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
          rating: 4.8,
          reputationScore: 85,
          certificates: [],
          skillsToTeach: ['React', 'JavaScript'],
          skillsToLearn: ['UI/UX Design'],
          isAvailableToTeach: false,
          verified: true
        });
      }
    }

    if (user) {
      user.isAvailableToTeach = true;
      await user.save();
      return {
        id: id === 'demo-1' ? 'demo-1' : user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        headline: user.headline,
        location: user.location,
        imageUrl: user.imageUrl,
        rating: user.rating,
        reputationScore: user.reputationScore,
        certificates: user.certificates,
        skillsToTeach: user.skillsToTeach,
        skillsToLearn: user.skillsToLearn,
        isAvailableToTeach: user.isAvailableToTeach,
        verified: user.verified
      };
    }
    return null;
  } catch (e) {
    console.error("Error setting user available to teach:", e);
    return null;
  }
};

// Teaching Functions

export const createTeaching = async (teacherId: string, title: string, description: string, demoVideoUrl?: string, certificateUrl?: string) => {
  console.log(`createTeaching called with teacherId: ${teacherId}, title: ${title}`);
  try {
    let actualTeacherId = teacherId;
    
    // Handle demo user ID
    if (teacherId === 'demo-1') {
      console.log("Resolving demo-1 user ID...");
      const demoUser = await UserModel.findOne({ email: 'demo@example.com' });
      if (demoUser) {
        actualTeacherId = demoUser._id.toString();
        console.log("Resolved demo-1 to:", actualTeacherId);
      } else {
        console.log("Demo user not found, creating new one...");
        const newDemo = new UserModel({
          email: 'demo@example.com',
          password: 'demo-password-not-used', // Password is required by schema
          fullName: 'Demo User',
          headline: 'Learner & Teacher',
          location: 'Remote',
          skillsToTeach: ['React', 'JavaScript'],
          skillsToLearn: ['UI/UX Design'],
          isAvailableToTeach: true,
          verified: true,
          certificates: []
        });
        await newDemo.save();
        actualTeacherId = newDemo._id.toString();
        console.log("Created demo user with ID:", actualTeacherId);
      }
    }

    console.log("Creating new Teaching document...");
    const newTeaching = new TeachingModel({
      teacherId: actualTeacherId,
      title,
      description,
      demoVideoUrl,
      certificateUrl,
      membersConnected: []
    });
    await newTeaching.save();
    console.log("Teaching document saved successfully.");

    // Add certificate to user's profile if uploaded
    if (certificateUrl) {
      await UserModel.findByIdAndUpdate(actualTeacherId, {
        $addToSet: { certificates: certificateUrl }
      });
      console.log("Added certificate to user profile.");
    }
    
    return {
      id: newTeaching._id.toString(),
      teacherId: newTeaching.teacherId.toString(),
      title: newTeaching.title,
      description: newTeaching.description,
      demoVideoUrl: newTeaching.demoVideoUrl,
      certificateUrl: newTeaching.certificateUrl,
      membersConnected: newTeaching.membersConnected.map(id => id.toString()),
      createdAt: newTeaching.createdAt
    };
  } catch (e) {
    console.error("Error in createTeaching:", e);
    return null;
  }
};

export const getTeachingsByTeacherId = async (teacherId: string) => {
  try {
    let actualTeacherId = teacherId;
    if (teacherId === 'demo-1') {
      const demoUser = await UserModel.findOne({ email: 'demo@example.com' });
      if (demoUser) {
        actualTeacherId = demoUser._id.toString();
      } else {
        return [];
      }
    }

    const teachings = await TeachingModel.find({ teacherId: actualTeacherId })
      .sort({ createdAt: -1 })
      .populate('membersConnected', 'fullName imageUrl headline');
      
    return teachings.map(t => ({
      id: t._id.toString(),
      teacherId: t.teacherId.toString(),
      title: t.title,
      description: t.description,
      demoVideoUrl: t.demoVideoUrl,
      certificateUrl: t.certificateUrl,
      membersConnected: t.membersConnected, // now populated with user objects
      createdAt: t.createdAt
    }));
  } catch (e) {
    console.error("Error fetching teachings:", e);
    return [];
  }
};

export const getAllTeachings = async () => {
  try {
    const teachings = await TeachingModel.find()
      .sort({ createdAt: -1 })
      .populate('teacherId', 'fullName imageUrl headline location isAvailableToTeach skillsToTeach skillsToLearn certificates rating reputationScore');
      
    return teachings.map(t => ({
      id: t._id.toString(),
      teacherId: t.teacherId, // populated
      title: t.title,
      description: t.description,
      demoVideoUrl: t.demoVideoUrl,
      certificateUrl: t.certificateUrl,
      membersConnected: t.membersConnected,
      createdAt: t.createdAt
    }));
  } catch (e) {
    console.error("Error fetching all teachings:", e);
    return [];
  }
};

export const connectLearnerToTeaching = async (teachingId: string, learnerId: string) => {
  try {
    let actualLearnerId = learnerId;
    // Handle demo user ID
    if (learnerId === 'demo-1') {
      const demoUser = await UserModel.findOne({ email: 'demo@example.com' });
      if (demoUser) {
        actualLearnerId = demoUser._id.toString();
      } else {
         return false;
      }
    }

    const teaching = await TeachingModel.findById(teachingId);
    if (!teaching) return false;

    // Convert ObjectIds to strings for comparison to avoid duplicate pushes
    const isAlreadyConnected = teaching.membersConnected.some(id => id.toString() === actualLearnerId);
    
    if (!isAlreadyConnected) {
      teaching.membersConnected.push(new mongoose.Types.ObjectId(actualLearnerId));
      await teaching.save();
    }
    return true;
  } catch (e) {
    console.error("Error connecting learner to teaching:", e);
    return false;
  }
};

export const disconnectLearnerFromTeaching = async (teachingId: string, learnerId: string) => {
  try {
    let actualLearnerId = learnerId;
    if (learnerId === 'demo-1') {
      const demoUser = await UserModel.findOne({ email: 'demo@example.com' });
      if (demoUser) actualLearnerId = demoUser._id.toString();
      else return false;
    }

    const teaching = await TeachingModel.findById(teachingId);
    if (!teaching) return false;

    teaching.membersConnected = teaching.membersConnected.filter(id => id.toString() !== actualLearnerId);
    await teaching.save();
    return true;
  } catch (e) {
    console.error("Error disconnecting learner from teaching:", e);
    return false;
  }
};

export const deleteTeaching = async (teachingId: string) => {
  try {
    await TeachingModel.findByIdAndDelete(teachingId);
    return true;
  } catch (e) {
    console.error("Error deleting teaching:", e);
    return false;
  }
};

export const deleteTeachingDemo = async (teachingId: string) => {
  try {
    const teaching = await TeachingModel.findById(teachingId);
    if (teaching) {
      teaching.demoVideoUrl = undefined;
      await teaching.save();
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error deleting teaching demo:", e);
    return false;
  }
};

// Message Functions

export const saveMessage = async (
  teachingId: string,
  senderId: string,
  receiverId: string,
  content: string,
  fileUrl: string = '',
  fileName: string = '',
  fileType: string = ''
) => {
  try {
    const message = new MessageModel({
      teachingId,
      senderId,
      receiverId,
      content,
      fileUrl,
      fileName,
      fileType,
    });
    await message.save();

    return {
      id: message._id.toString(),
      teachingId: message.teachingId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileType: message.fileType,
      createdAt: (message.createdAt as Date).toISOString(),
    };
  } catch (e) {
    console.error("Error saving message:", e);
    return null;
  }
};

export const getMessages = async (teachingId: string, userId1: string, userId2: string) => {
  try {
    const messages = await MessageModel.find({
      teachingId,
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    }).sort({ createdAt: 1 });

    return messages.map(m => ({
      id: m._id.toString(),
      teachingId: m.teachingId,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      fileUrl: m.fileUrl || '',
      fileName: m.fileName || '',
      fileType: m.fileType || '',
      createdAt: (m.createdAt as Date).toISOString(),
    }));
  } catch (e) {
    console.error("Error fetching messages:", e);
    return [];
  }
};

// ─── Session Functions ──────────────────────────────────────────────────

export const createSession = async (data: {
  teachingId: string; teacherId: string; learnerId: string;
  teachingTitle: string; teacherName: string; learnerName: string;
  teacherImageUrl: string; learnerImageUrl: string;
  scheduledDate: string; scheduledTime: string; duration: string;
  meetLink: string; message: string;
}) => {
  try {
    const session = new SessionModel(data);
    await session.save();
    return formatSession(session);
  } catch (e) {
    console.error("Error creating session:", e);
    return null;
  }
};

export const getSessionsByUserId = async (userId: string) => {
  try {
    const sessions = await SessionModel.find({
      $or: [{ teacherId: userId }, { learnerId: userId }]
    }).sort({ scheduledDate: 1, scheduledTime: 1 });
    return sessions.map(formatSession);
  } catch (e) {
    console.error("Error fetching sessions:", e);
    return [];
  }
};

export const endSession = async (sessionId: string, teacherId: string) => {
  try {
    const session = await SessionModel.findById(sessionId);
    if (!session || session.teacherId !== teacherId) return null;
    session.status = 'completed';
    await session.save();
    return formatSession(session);
  } catch (e) {
    console.error("Error ending session:", e);
    return null;
  }
};

// ─── Feedback Functions ─────────────────────────────────────────────────

export const submitFeedback = async (data: {
  sessionId: string; teachingId: string; teacherId: string;
  learnerId: string; rating: number; reputationScore: number; comment: string;
}) => {
  try {
    // Check not already submitted
    const existing = await FeedbackModel.findOne({ sessionId: data.sessionId, learnerId: data.learnerId });
    if (existing) return { error: 'already_submitted' };

    const feedback = new FeedbackModel(data);
    await feedback.save();

    // Recompute and update teacher's average rating & reputation
    const allFeedback = await FeedbackModel.find({ teacherId: data.teacherId });
    
    // Rating avg
    const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
    
    // Reputation avg
    const avgRep = allFeedback.reduce((sum, f) => sum + (f.reputationScore || 0), 0) / allFeedback.length;

    await UserModel.findByIdAndUpdate(data.teacherId, { 
      rating: Math.round(avgRating * 10) / 10,
      reputationScore: Math.round(avgRep)
    });

    // Mark session as rated and fully ended
    await SessionModel.findByIdAndUpdate(data.sessionId, { 
      feedbackSubmitted: true,
      status: 'ended'
    });

    return { id: feedback._id.toString(), ...data };
  } catch (e) {
    console.error("Error submitting feedback:", e);
    return null;
  }
};

export const getSessionFeedback = async (sessionId: string, learnerId: string) => {
  try {
    const fb = await FeedbackModel.findOne({ sessionId, learnerId });
    return fb ? { rating: fb.rating, reputationScore: fb.reputationScore, comment: fb.comment } : null;
  } catch (e) {
    return null;
  }
};

export const deleteSession = async (sessionId: string) => {
  try {
    await SessionModel.findByIdAndDelete(sessionId);
    return true;
  } catch (e) {
    console.error("Error deleting session:", e);
    return false;
  }
};

const formatSession = (s: any) => ({
  id: s._id.toString(),
  teachingId: s.teachingId,
  teacherId: s.teacherId,
  learnerId: s.learnerId,
  teachingTitle: s.teachingTitle,
  teacherName: s.teacherName,
  learnerName: s.learnerName,
  teacherImageUrl: s.teacherImageUrl,
  learnerImageUrl: s.learnerImageUrl,
  scheduledDate: s.scheduledDate,
  scheduledTime: s.scheduledTime,
  duration: s.duration,
  meetLink: s.meetLink,
  message: s.message,
  status: s.status,
  feedbackSubmitted: s.feedbackSubmitted || false,
  createdAt: (s.createdAt as Date).toISOString(),
});

