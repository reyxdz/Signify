const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/signify', {}).then(() => {
    console.log('Connected to signify database');
}).catch((err) => {
    console.log('Error connecting to database', err);
});

// Schema for users of the app
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('users', UserSchema);

// Schema for signatures
const SignatureSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['premade', 'drawn'],
        required: true,
    },
    signature: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    initials: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Signature = mongoose.model('signatures', SignatureSchema);

// Schema for documents
const DocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        default: 'pdf',
    },
    size: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['pending', 'signed', 'rejected', 'draft'],
        default: 'draft',
    },
    description: {
        type: String,
        default: '',
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    modifiedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    }],
});

const Document = mongoose.model('documents', DocumentSchema);

// Schema for activity log
const ActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    type: {
        type: String,
        enum: ['document_uploaded', 'document_signed', 'signature_created', 'document_shared', 'action_required'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    details: {
        type: String,
    },
    relatedDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'documents',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Activity = mongoose.model('activities', ActivitySchema);

// Express setup
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));

// Sample route to check if the backend is working
app.get("/", (req, resp) => {
    resp.send("Signify backend is working");
});

// API to register a user
app.post("/register", async (req, resp) => {
    try {
        const { firstName, lastName, address, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return resp.status(400).send({ message: "Email already registered" });
        }

        // Hash password with bcryptjs
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const user = new User({
            firstName,
            lastName,
            address,
            email,
            password: hashedPassword,
        });

        let result = await user.save();
        console.log("User registered:", result.email);
        resp.status(201).send({ 
            message: "User registered successfully",
            user: {
                id: result._id,
                firstName: result.firstName,
                lastName: result.lastName,
                email: result.email,
            }
        });
    } catch (e) {
        console.error("Registration error:", e);
        resp.status(500).send({ message: "Something went wrong", error: e.message });
    }
});

// API to login a user
app.post("/login", async (req, resp) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return resp.status(401).send({ message: "Invalid email or password" });
        }

        // Compare passwords with bcryptjs
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return resp.status(401).send({ message: "Invalid email or password" });
        }

        // Fetch signature if it exists
        const signatureData = await Signature.findOne({ userId: user._id });

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log("User logged in:", email);
        resp.status(200).send({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                signature: signatureData,
            }
        });
    } catch (e) {
        console.error("Login error:", e);
        resp.status(500).send({ message: "Something went wrong", error: e.message });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ message: "No token provided" });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.id;
        next();
    } catch (e) {
        res.status(401).send({ message: "Invalid token" });
    }
};

// API to save user signature
app.post("/api/users/signature", verifyToken, async (req, resp) => {
    try {
        const { signature } = req.body;
        
        if (!signature) {
            return resp.status(400).send({ message: "Signature data is required" });
        }

        // Validate signature object structure
        if (!signature.type || !signature.signature || !signature.initials) {
            return resp.status(400).send({ message: "Invalid signature format" });
        }
        
        // Check if signature already exists for this user
        let existingSignature = await Signature.findOne({ userId: req.userId });
        
        let savedSignature;
        if (existingSignature) {
            // Update existing signature
            savedSignature = await Signature.findByIdAndUpdate(
                existingSignature._id,
                {
                    type: signature.type,
                    signature: signature.signature,
                    initials: signature.initials,
                    updatedAt: new Date(),
                },
                { new: true }
            );
            console.log("Signature updated for user:", req.userId);
        } else {
            // Create new signature
            const newSignature = new Signature({
                userId: req.userId,
                type: signature.type,
                signature: signature.signature,
                initials: signature.initials,
            });
            savedSignature = await newSignature.save();
            console.log("Signature created for user:", req.userId);
        }

        // Fetch updated user data
        const user = await User.findById(req.userId);
        
        resp.status(200).send({
            message: "Signature saved successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                signature: savedSignature,
            }
        });
    } catch (e) {
        console.error("Error saving signature:", e);
        resp.status(500).send({ message: "Something went wrong", error: e.message });
    }
});

// ==================== OVERVIEW API ENDPOINTS ====================

// Get overview statistics for dashboard
app.get("/api/overview/stats", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;

        // Fetch counts in parallel
        const [docCount, sigCount, sharedCount, signedCount] = await Promise.all([
            Document.countDocuments({ userId }),
            Signature.countDocuments({ userId }),
            Document.countDocuments({ userId, sharedWith: { $exists: true, $ne: [] } }),
            Document.countDocuments({ userId, status: 'signed' }),
        ]);

        // Calculate completion rate
        const completionRate = docCount > 0 ? Math.round((signedCount / docCount) * 100) : 0;

        resp.status(200).send({
            message: "Overview statistics retrieved successfully",
            data: {
                totalDocuments: docCount,
                totalSignatures: sigCount,
                sharedDocuments: sharedCount,
                completionRate: completionRate,
            }
        });
    } catch (error) {
        console.error("Error fetching overview stats:", error);
        resp.status(500).send({ message: "Error fetching statistics", error: error.message });
    }
});

// Get recent documents for overview
app.get("/api/documents/recent", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 5;

        const recentDocs = await Document.find({ userId })
            .sort({ modifiedAt: -1 })
            .limit(limit)
            .select('name fileName status modifiedAt createdAt uploadedAt');

        resp.status(200).send({
            message: "Recent documents retrieved successfully",
            data: recentDocs,
        });
    } catch (error) {
        console.error("Error fetching recent documents:", error);
        resp.status(500).send({ message: "Error fetching documents", error: error.message });
    }
});

// Get activity log for overview
app.get("/api/activity", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;

        const activities = await Activity.find({ userId })
            .sort({ timestamp: -1, createdAt: -1 })
            .limit(limit)
            .select('type title description details timestamp createdAt relatedDocumentId');

        resp.status(200).send({
            message: "Activity log retrieved successfully",
            data: activities,
        });
    } catch (error) {
        console.error("Error fetching activity:", error);
        resp.status(500).send({ message: "Error fetching activity", error: error.message });
    }
});

// Upload document
app.post("/api/documents/upload", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { name, fileName, fileType, size } = req.body;

        if (!name || !fileName) {
            return resp.status(400).send({ message: "Document name and fileName are required" });
        }

        const document = new Document({
            userId,
            name,
            fileName,
            fileType: fileType || 'pdf',
            size: size || 0,
            status: 'draft',
        });

        const savedDoc = await document.save();

        // Create activity log entry
        const activity = new Activity({
            userId,
            type: 'document_uploaded',
            title: `Document uploaded: ${name}`,
            details: `${fileType || 'PDF'} file uploaded`,
            relatedDocumentId: savedDoc._id,
        });

        await activity.save();

        resp.status(201).send({
            message: "Document uploaded successfully",
            data: savedDoc,
        });
    } catch (error) {
        console.error("Error uploading document:", error);
        resp.status(500).send({ message: "Error uploading document", error: error.message });
    }
});

// Share document
app.post("/api/documents/:documentId/share", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { shareWithEmail } = req.body;

        if (!shareWithEmail) {
            return resp.status(400).send({ message: "Email is required" });
        }

        // Find the user to share with
        const shareWithUser = await User.findOne({ email: shareWithEmail });
        if (!shareWithUser) {
            return resp.status(404).send({ message: "User not found" });
        }

        // Update document
        const updatedDoc = await Document.findByIdAndUpdate(
            documentId,
            { $addToSet: { sharedWith: shareWithUser._id } },
            { new: true }
        );

        // Create activity log
        const activity = new Activity({
            userId,
            type: 'document_shared',
            title: `Document shared with ${shareWithEmail}`,
            details: updatedDoc.name,
            relatedDocumentId: documentId,
        });

        await activity.save();

        resp.status(200).send({
            message: "Document shared successfully",
            data: updatedDoc,
        });
    } catch (error) {
        console.error("Error sharing document:", error);
        resp.status(500).send({ message: "Error sharing document", error: error.message });
    }
});

// Update document status
app.patch("/api/documents/:documentId/status", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { status } = req.body;

        if (!['pending', 'signed', 'rejected', 'draft'].includes(status)) {
            return resp.status(400).send({ message: "Invalid status" });
        }

        const updatedDoc = await Document.findByIdAndUpdate(
            documentId,
            { status, modifiedAt: new Date() },
            { new: true }
        );

        // Create activity log
        let activityType = 'document_uploaded';
        let activityTitle = `Document status updated to ${status}`;

        if (status === 'signed') {
            activityType = 'document_signed';
            activityTitle = 'Document signed successfully';
        }

        const activity = new Activity({
            userId,
            type: activityType,
            title: activityTitle,
            details: updatedDoc.name,
            relatedDocumentId: documentId,
        });

        await activity.save();

        resp.status(200).send({
            message: "Document status updated successfully",
            data: updatedDoc,
        });
    } catch (error) {
        console.error("Error updating document status:", error);
        resp.status(500).send({ message: "Error updating document", error: error.message });
    }
});

// Update document metadata
app.patch("/api/documents/:documentId/update", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { name, status, description } = req.body;

        if (!name || !name.trim()) {
            return resp.status(400).send({ message: "Document name is required" });
        }

        const updateData = {
            name: name.trim(),
            status: status || 'draft',
            description: description || '',
            modifiedAt: new Date(),
        };

        const updatedDoc = await Document.findByIdAndUpdate(
            documentId,
            updateData,
            { new: true }
        );

        if (!updatedDoc) {
            return resp.status(404).send({ message: "Document not found" });
        }

        // Create activity log entry
        const activity = new Activity({
            userId,
            type: 'document_uploaded',
            title: `Document updated: ${name}`,
            details: `Status changed to ${status}`,
            relatedDocumentId: documentId,
        });

        await activity.save();

        resp.status(200).send({
            message: "Document updated successfully",
            data: updatedDoc,
        });
    } catch (error) {
        console.error("Error updating document:", error);
        resp.status(500).send({ message: "Error updating document", error: error.message });
    }
});


app.listen(5000, () => {
    console.log("Signify Server is running on port 5000");
});