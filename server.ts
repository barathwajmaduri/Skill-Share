import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import { 
  connectDB, 
  createUser, 
  verifyUser, 
  findUserByEmail, 
  getUserById, 
  getAllUsers,
  updateUserSkills,
  updateUserProfile,
  setUserAvailableToTeach,
  createTeaching,
  getTeachingsByTeacherId,
  getAllTeachings,
  connectLearnerToTeaching,
  disconnectLearnerFromTeaching,
  deleteUserCertificate,
  deleteTeaching,
  deleteTeachingDemo,
  saveMessage,
  getMessages,
  createSession,
  getSessionsByUserId,
  endSession,
  submitFeedback,
  getSessionFeedback,
  deleteSession
} from './src/db';
import { LoginLog } from "./src/models/LoginLog";
import crypto from "crypto";
import fs from 'fs';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import nodemailer from 'nodemailer';

// Configure Brevo SMTP Transporter
// Brevo SMTP relay works on port 587 (not blocked by Render)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER || '',  // Your Brevo account email
    pass: process.env.BREVO_SMTP_KEY || '',   // Your Brevo SMTP Key (not account password)
  },
});

// Define Port for Cloud Deployment
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
console.log(`[DEBUG] Uploads directory path: ${uploadDir}`);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`[DEBUG] Created uploads directory at: ${uploadDir}`);
} else {
  console.log(`[DEBUG] Uploads directory already exists at: ${uploadDir}`);
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log(`[DEBUG] Multer fileFilter: fieldname=${file.fieldname}, originalname=${file.originalname}, mimetype=${file.mimetype}`);
    cb(null, true);
  }
});

 async function startServer() {
  const app = express();

  // Connect to MongoDB
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to MongoDB. Server will start but DB operations will fail.', err);
  }

  fs.writeFileSync('server_started.txt', `started at ${new Date().toISOString()}`);

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));
  
  // Serve static files from the React app in production
  if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(process.cwd(), 'dist'))) {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }
  
  // Trust proxy for IP extraction if behind nginx/proxy
  app.set('trust proxy', true);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Routes
  app.post("/api/register", async (req, res) => {
    console.log("Registration request received:", req.body);
    try {
      const { email, password, fullName, skillsToTeach, skillsToLearn } = req.body;
      
      if (!email || !password || !fullName) {
        console.log("Registration failed: Missing fields");
        return res.status(400).json({ error: "Missing required fields" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("Registration failed: Invalid email format");
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (password.length < 6) {
        console.log("Registration failed: Password too short");
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        console.log("Registration failed: User already exists:", email);
        return res.status(409).json({ error: "This email is already registered. Please log in." });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = await createUser(email, password, fullName, skillsToTeach || [], skillsToLearn || [], verificationToken);
      
      // Send real email
      const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/verify?token=${verificationToken}`;
      
      try {
        console.log(`Sending verification email to ${email} via Brevo SMTP...`);
        await transporter.sendMail({
          from: `"SkillShare" <${process.env.BREVO_SMTP_USER || 'skillshare0726@gmail.com'}>`  ,
          to: email,
          subject: 'Verify your SkillShare Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #059669;">Welcome to SkillShare, ${fullName}! 🎉</h2>
              <p style="color: #334155; font-size: 16px;">We're excited to have you join our community. Please click the button below to verify your email address and activate your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify Account</a>
              </div>
              <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
              <p style="color: #64748b; font-size: 14px; word-break: break-all;"><a href="${verifyUrl}" style="color: #059669;">${verifyUrl}</a></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          `
        });
        console.log(`Verification email successfully sent to: ${email}`);
      } catch (emailError) {
        console.error("Error sending verification email via Brevo SMTP:", emailError);
      }

      res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/verify", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).send("Missing verification token");
      }

      const success = await verifyUser(token);
      if (success) {
        res.redirect("/?verified=true");
      } else {
        res.status(400).send("Invalid or expired verification token");
      }
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.post("/api/login", async (req, res) => {
    console.log("Login request received:", req.body.email);
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
      if (!email || !password) {
        console.log("Login failed: Missing email or password");
        return res.status(400).json({ error: "Missing email or password" });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        console.log("Login failed: User not found for email:", email);
        return res.status(401).json({ error: "Incorrect email or password." });
      }

      console.log(`User found: ${user.email}, verified: ${user.verified} (type: ${typeof user.verified})`);

      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        console.log("Login failed: Incorrect password for email:", email);
        return res.status(401).json({ error: "Incorrect email or password." });
      }

      // Successfully authenticated
      // Log success
      await new LoginLog({
        userId: user.id,
        email,
        ip,
        userAgent,
        success: true
      }).save();

      console.log("Login successful for:", email);
      const { password: _, verificationToken: __, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Fetch all users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Fetch user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id/skills", async (req, res) => {
    try {
      const userId = req.params.id;
      const { skillsToTeach, skillsToLearn } = req.body;
      
      const updatedUser = await updateUserSkills(userId, skillsToTeach, skillsToLearn);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found or failed to update" });
      }

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Update user skills error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id/profile", upload.single('image'), async (req, res) => {
    try {
      const { fullName, headline, location, imageUrl: providedImageUrl } = req.body;
      let finalImageUrl = providedImageUrl;

      if (req.file) {
        finalImageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await updateUserProfile(req.params.id, { 
        fullName, 
        headline, 
        location, 
        imageUrl: finalImageUrl 
      });
      if (!updatedUser) return res.status(404).json({ error: "User not found" });
      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/users/:id/certificates", async (req, res) => {
    try {
      const { certificate } = req.body;
      const updatedUser = await deleteUserCertificate(req.params.id, certificate);
      if (!updatedUser) return res.status(404).json({ error: "User not found" });
      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Delete certificate error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Message Routes
  app.post("/api/chat/upload", upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      fileUrl, 
      fileName: req.file.originalname, 
      fileType: req.file.mimetype 
    });
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { teachingId, senderId, receiverId, content, fileUrl, fileName, fileType } = req.body;
      if (!teachingId || !senderId || !receiverId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const message = await saveMessage(teachingId, senderId, receiverId, content || '', fileUrl, fileName, fileType);
      res.status(201).json({ message });
    } catch (error) {
      console.error("Save message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/messages/:teachingId/:userId1/:userId2", async (req, res) => {
    try {
      const { teachingId, userId1, userId2 } = req.params;
      const messages = await getMessages(teachingId, userId1, userId2);
      res.json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/download/:filename", (req, res) => {
    const encodedFilename = req.params.filename;
    const filename = decodeURIComponent(encodedFilename);
    const filePath = path.join(uploadDir, filename);
    
    console.log(`[Download] Requested: ${filename}, Path: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`[Download] File not found: ${filePath}`);
      return res.status(404).send("File not found");
    }
    
    const stat = fs.statSync(filePath);
    const fileExt = path.extname(filename).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (fileExt === '.pdf') contentType = 'application/pdf';
    else if (fileExt === '.doc') contentType = 'application/msword';
    else if (fileExt === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (fileExt === '.mp4') contentType = 'video/mp4';
    else if (fileExt === '.webm') contentType = 'video/webm';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    fileStream.on('error', (err) => {
      console.error('[Download] Stream error:', err);
    });
  });

  // Session Routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const session = await createSession(req.body);
      if (!session) return res.status(500).json({ error: "Failed to create session" });
      res.status(201).json({ session });
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sessions/user/:userId", async (req, res) => {
    try {
      const sessions = await getSessionsByUserId(req.params.userId);
      res.json({ sessions });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/sessions/:id/end", async (req, res) => {
    try {
      const { teacherId } = req.body;
      const session = await endSession(req.params.id, teacherId);
      if (!session) return res.status(403).json({ error: "Not authorized or session not found" });
      res.json({ session });
    } catch (error) {
      console.error("End session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const success = await deleteSession(req.params.id);
      if (!success) return res.status(404).json({ error: "Session not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Feedback Routes
  app.post("/api/feedback", async (req, res) => {
    try {
      const result = await submitFeedback(req.body);
      if (!result) return res.status(500).json({ error: "Failed to submit feedback" });
      if ('error' in result && result.error === 'already_submitted') {
        return res.status(409).json({ error: "Feedback already submitted" });
      }
      res.status(201).json({ feedback: result });
    } catch (error) {
      console.error("Submit feedback error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/feedback/session/:sessionId/:learnerId", async (req, res) => {
    try {
      const fb = await getSessionFeedback(req.params.sessionId, req.params.learnerId);
      res.json({ feedback: fb });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users/:id/teach", async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedUser = await setUserAvailableToTeach(userId);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found or failed to update" });
      }

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Set user available to teach error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Teaching Routes
  app.get("/api/teachings/user/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const teachings = await getTeachingsByTeacherId(userId);
      res.json({ teachings });
    } catch (error) {
      console.error("Fetch user teachings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/teachings", async (req, res) => {
    try {
      const teachings = await getAllTeachings();
      res.json({ teachings });
    } catch (error) {
      console.error("Fetch all teachings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/teachings/:id/connect", async (req, res) => {
    try {
      const teachingId = req.params.id;
      const { learnerId } = req.body;
      
      if (!learnerId) {
        return res.status(400).json({ error: "Missing learnerId" });
      }

      const success = await connectLearnerToTeaching(teachingId, learnerId);
      
      if (!success) {
        return res.status(404).json({ error: "Teaching not found or user already connected" });
      }

      res.json({ message: "Successfully connected to teaching" });
    } catch (error) {
      console.error("Connect to teaching error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/teachings/:id/disconnect", async (req, res) => {
    try {
      const teachingId = req.params.id;
      const { learnerId } = req.body;
      if (!learnerId) return res.status(400).json({ error: "Missing learnerId" });

      const success = await disconnectLearnerFromTeaching(teachingId, learnerId);
      if (!success) return res.status(404).json({ error: "Teaching not found or user not connected" });

      res.json({ message: "Successfully disconnected from teaching" });
    } catch (error) {
      console.error("Disconnect from teaching error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/teachings", (req, res, next) => {
    console.log("\n[DEBUG] /api/teachings POST request received");
    console.log("[DEBUG] Content-Type:", req.headers['content-type']);
    next();
  }, upload.fields([{ name: 'demoVideo', maxCount: 1 }, { name: 'certificate', maxCount: 1 }]), async (req, res) => {
    console.log("[DEBUG] Multer processing complete. Body:", JSON.stringify(req.body));
    try {
      const { teacherId, title, description } = req.body;
      
      let demoVideoUrl = undefined;
      let certificateUrl = undefined;
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      console.log("[DEBUG] Files object keys:", files ? Object.keys(files) : "null/undefined");

      if (files?.demoVideo?.[0]) {
        const file = files.demoVideo[0];
        // Multer diskStorage already saved the file to the uploads/ directory
        // and generated a unique filename available at file.filename
        demoVideoUrl = `/uploads/${file.filename}`;
        console.log("[DEBUG] Demo video saved by Multer:", demoVideoUrl);
      } else {
        console.log("[DEBUG] No demoVideo file found in req.files. Check field name in frontend.");
        return res.status(400).json({ error: "Demo video is required. Please ensure you selected a video file." });
      }

      if (files?.certificate?.[0]) {
        const file = files.certificate[0];
        // Multer diskStorage already saved the file to the uploads/ directory
        certificateUrl = `/uploads/${file.filename}`;
        console.log("[DEBUG] Certificate saved by Multer:", certificateUrl);
      }

      if (!teacherId || !title) {
        console.log("[DEBUG] Validation failed: teacherId or title missing. Body:", req.body);
        return res.status(400).json({ error: "Missing required fields: teacherId and title are required." });
      }

      console.log("[DEBUG] Calling createTeaching in DB...");
      const newTeaching = await createTeaching(teacherId, title, description, demoVideoUrl, certificateUrl);
      
      if (!newTeaching) {
        console.log("[DEBUG] createTeaching returned null");
        return res.status(500).json({ error: "Failed to create teaching record in database." });
      }

      console.log("[DEBUG] Teaching created successfully:", newTeaching.id);
      res.status(201).json({ teaching: newTeaching });
    } catch (error) {
      console.error("[ERROR] /api/teachings route error:", error);
      res.status(500).json({ error: "Internal server error during teaching submission." });
    }
  });

  app.delete("/api/teachings/:id", async (req, res) => {
    try {
      const teachingId = req.params.id;
      const success = await deleteTeaching(teachingId);
      
      if (!success) {
        return res.status(404).json({ error: "Teaching not found or failed to delete" });
      }

      res.json({ message: "Teaching deleted successfully" });
    } catch (error) {
      console.error("Delete teaching error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/teachings/:id/demo", async (req, res) => {
    try {
      const teachingId = req.params.id;
      const success = await deleteTeachingDemo(teachingId);
      
      if (!success) {
        return res.status(404).json({ error: "Teaching not found or failed to delete demo" });
      }

      res.json({ message: "Demo video deleted successfully" });
    } catch (error) {
      console.error("Delete teaching demo error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Catch-all route to serve React index.html in production
    // This MUST be the last route registered
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    fs.writeFileSync('server_listening.txt', `listening at ${new Date().toISOString()}`);
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (e) => {
    fs.writeFileSync('server_error.txt', `error: ${e.message}`);
    console.error('Server error:', e);
  });
}

startServer();
