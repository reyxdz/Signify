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
mongoose.connect('mongodb://localhost:27017/signify', {}).then(async () => {
    console.log('Connected to signify database');
    
    // Fix: Drop and recreate the publishLink index to ensure sparse constraint
    try {
        await mongoose.connection.collection('documents').dropIndex('publishLink_1');
        console.log('Dropped old publishLink index');
    } catch (err) {
        // Index might not exist, which is fine
        if (err.code !== 27) {
            console.log('Note: publishLink index did not exist or could not be dropped');
        }
    }
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

// Schema for documents - Updated with enhanced fields
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
    fileData: {
        type: Buffer,
        default: null,
    },
    status: {
        type: String,
        enum: ['draft', 'pending_signatures', 'completed', 'expired', 'cancelled'],
        default: 'draft',
    },
    notes: {
        type: String,
        default: null,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    signingDeadline: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    cancellationReason: {
        type: String,
        default: null,
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
        index: true,
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    }],
    // Publishing information
    publishedStatus: {
        type: String,
        enum: ['draft', 'published', 'expired'],
        default: 'draft',
    },
    publishedAt: {
        type: Date,
        default: null,
    },
    publishLink: {
        type: String,
        default: null,
    },
    publishLinkExpiry: {
        type: Date,
        default: null,
    },
    publishedRecipients: [{
        recipientEmail: String,
        recipientName: String,
        notifiedAt: Date,
    }],
});

// Create indexes for documents
DocumentSchema.index({ userId: 1 });
DocumentSchema.index({ userId: 1, expiresAt: 1 });
DocumentSchema.index({ status: 1 });

const Document = mongoose.model('documents', DocumentSchema);

// Schema for document recipients - NEW
const DocumentRecipientsSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'documents',
        required: true,
    },
    recipientEmail: {
        type: String,
        required: true,
    },
    recipientName: {
        type: String,
        default: null,
    },
    signatureToken: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'viewed', 'signed', 'declined', 'expired'],
        default: 'pending',
    },
    order: {
        type: Number,
        default: 0,
    },
    signedAt: {
        type: Date,
        default: null,
    },
    viewedAt: {
        type: Date,
        default: null,
    },
    lastAccessedAt: {
        type: Date,
        default: null,
    },
    accessCount: {
        type: Number,
        default: 0,
    },
    remindersSent: [{
        sentAt: {
            type: Date,
            default: Date.now,
        },
        type: {
            type: String,
            enum: ['initial', 'reminder', 'final'],
            default: 'reminder',
        },
    }],
    declineReason: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Create indexes for document recipients
DocumentRecipientsSchema.index({ documentId: 1 });
DocumentRecipientsSchema.index({ documentId: 1, status: 1 });

const DocumentRecipients = mongoose.model('documentRecipients', DocumentRecipientsSchema);

// Schema for individual document tools/fields - NEW
const DocumentToolSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'documents',
        required: true,
    },
    toolId: {
        type: String,
        required: true,
    },
    toolType: {
        type: String,
        enum: [
            'my_signature', 'my_initial', 'my_email', 'my_fullname',
            'recipient_signature', 'recipient_initial', 'recipient_email', 'recipient_fullname'
        ],
        required: true,
    },
    toolLabel: {
        type: String,
        default: null,
    },
    position: {
        x: {
            type: Number,
            required: true,
        },
        y: {
            type: Number,
            required: true,
        },
        page: {
            type: Number,
            default: 1,
        },
    },
    dimensions: {
        width: {
            type: Number,
            required: true,
        },
        height: {
            type: Number,
            required: true,
        },
    },
    styling: {
        fontFamily: {
            type: String,
            default: 'Arial',
        },
        fontSize: {
            type: Number,
            default: 12,
        },
        fontColor: {
            type: String,
            default: '#000000',
        },
        fontStyles: {
            bold: {
                type: Boolean,
                default: false,
            },
            italic: {
                type: Boolean,
                default: false,
            },
            underline: {
                type: Boolean,
                default: false,
            },
        },
    },
    value: {
        type: String,
        default: null,
    },
    // Multi-recipient support: array of recipients assigned to this tool
    assignedRecipients: [
        {
            recipientId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'documentRecipients',
                required: true,
            },
            recipientEmail: {
                type: String,
                required: true,
            },
            recipientName: {
                type: String,
                default: null,
            },
            status: {
                type: String,
                enum: ['pending', 'signed', 'declined'],
                default: 'pending',
            },
            signatureData: {
                type: String,
                default: null,
            },
            signedAt: {
                type: Date,
                default: null,
            },
            _id: false, // Prevent automatic _id for subdocuments
        },
    ],
    // Legacy single recipient support (backward compatibility)
    assignedToRecipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'documentRecipients',
        default: null,
    },
    signatureData: {
        type: String,
        default: null,
    },
    signedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Create indexes for document tools
DocumentToolSchema.index({ documentId: 1 });
DocumentToolSchema.index({ documentId: 1, toolId: 1 });
DocumentToolSchema.index({ assignedToRecipientId: 1 });

const DocumentTool = mongoose.model('documentTool', DocumentToolSchema);

// Legacy DocumentTools schema for backward compatibility (stores all tools as array)
const DocumentToolsSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'documents',
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    tools: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const DocumentTools = mongoose.model('documentToolsLegacy', DocumentToolsSchema);

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

// API to get user's signature
app.get("/api/users/signature", verifyToken, async (req, resp) => {
    try {
        const signature = await Signature.findOne({ userId: req.userId });
        
        if (!signature) {
            return resp.status(404).send({ message: "No signature found for this user" });
        }

        resp.status(200).send({
            message: "Signature retrieved successfully",
            data: signature
        });
    } catch (error) {
        console.error("Error fetching signature:", error);
        resp.status(500).send({ message: "Error fetching signature", error: error.message });
    }
});

// API to get current user data
app.get("/api/users/profile", verifyToken, async (req, resp) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return resp.status(404).send({ message: "User not found" });
        }

        // Fetch signature if it exists
        const signatureData = await Signature.findOne({ userId: user._id });

        resp.status(200).send({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                signature: signatureData,
            }
        });
    } catch (e) {
        console.error("Error fetching user profile:", e);
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

// Get all documents (owned + as recipient)
app.get("/api/documents/all", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;

        // Get owned documents
        const ownedDocs = await Document.find({ userId })
            .sort({ modifiedAt: -1 });

        resp.status(200).send({
            message: "Documents retrieved successfully",
            data: ownedDocs,
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        resp.status(500).send({ message: "Error fetching documents", error: error.message });
    }
});

// Get documents shared with the user (where user is a recipient)
app.get("/api/documents/shared-with-me", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('email');
        const userEmail = user?.email?.toLowerCase();

        console.log("Fetching shared documents for user email:", userEmail);

        // Get documents where user is a recipient (case-insensitive)
        const recipientDocs = await DocumentRecipients.find({ 
            recipientEmail: { $regex: `^${userEmail}$`, $options: 'i' }
        })
            .populate('documentId', '_id name fileName status modifiedAt createdAt publishedAt size userId')
            .populate('documentId.userId', 'firstName lastName email')
            .sort({ modifiedAt: -1 });

        console.log("Found recipient documents:", recipientDocs.length);

        // Format recipient documents
        const recipientDocsFormatted = recipientDocs.map(r => {
            const docObj = r.documentId.toObject();
            const ownerName = docObj.userId?.firstName && docObj.userId?.lastName 
                ? `${docObj.userId.firstName} ${docObj.userId.lastName}`
                : docObj.userId?.email || 'Unknown';
            
            return {
                ...docObj,
                recipientStatus: r.status,
                ownerName: ownerName,
            };
        });

        resp.status(200).send({
            message: "Shared documents retrieved successfully",
            data: recipientDocsFormatted,
        });
    } catch (error) {
        console.error("Error fetching shared documents:", error);
        resp.status(500).send({ message: "Error fetching shared documents", error: error.message });
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
        const { name, fileName, fileType, size, fileData } = req.body;

        console.log("Upload request received:", { 
            name, 
            fileName, 
            fileType, 
            size, 
            hasFileData: !!fileData, 
            fileDataLength: fileData ? fileData.length : 0,
            fileDataType: typeof fileData
        });

        if (!name || !fileName) {
            return resp.status(400).send({ message: "Document name and fileName are required" });
        }

        if (!fileData) {
            console.warn("WARNING: No fileData provided in upload request");
            return resp.status(400).send({ message: "File data is required" });
        }

        // Convert base64 to Buffer if fileData is provided
        let binaryData = null;
        try {
            console.log("Converting fileData from base64 to buffer, input length:", fileData.length);
            binaryData = Buffer.from(fileData, 'base64');
            console.log("Converted buffer size:", binaryData.length);
        } catch (err) {
            console.error("Error converting base64 to buffer:", err);
            return resp.status(400).send({ message: "Invalid file data format", error: err.message });
        }

        const document = new Document({
            userId,
            name,
            fileName,
            fileType: fileType || 'pdf',
            size: size || 0,
            fileData: binaryData,
            status: 'draft',
        });

        console.log("Saving document to database...");
        const savedDoc = await document.save();
        console.log("Document saved successfully:", savedDoc._id, "with fileData size:", savedDoc.fileData ? savedDoc.fileData.length : 0);

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

// ==================== END OVERVIEW API ENDPOINTS ====================

// Sign document with signature placement
app.post("/api/documents/:documentId/sign", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { signatures } = req.body;

        if (!signatures || Object.keys(signatures).length === 0) {
            return resp.status(400).send({ message: "At least one signature is required" });
        }

        const document = await Document.findById(documentId);
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        // Get user email for recipient matching
        const user = await User.findById(userId);
        if (!user) {
            return resp.status(404).send({ message: "User not found" });
        }

        // Check if user is recipient
        const recipient = await DocumentRecipients.findOne({
            documentId: documentId,
            recipientEmail: { $regex: `^${user.email}$`, $options: 'i' }
        });

        if (!recipient) {
            return resp.status(403).send({ message: "Unauthorized to sign this document - not a recipient" });
        }

        // Update each tool with the signature data for this recipient
        const updatedFields = [];
        for (const [fieldId, signatureData] of Object.entries(signatures)) {
            const tool = await DocumentTool.findById(fieldId);
            if (tool) {
                // Find the recipient in assignedRecipients array
                const recipientIndex = tool.assignedRecipients.findIndex(r => r.recipientId.toString() === recipient._id.toString());
                
                if (recipientIndex !== -1) {
                    // Update the specific recipient's signature in the array
                    tool.assignedRecipients[recipientIndex].signatureData = signatureData;
                    tool.assignedRecipients[recipientIndex].status = 'signed';
                    tool.assignedRecipients[recipientIndex].signedAt = new Date();
                    
                    // Also update legacy fields if this is the only recipient
                    if (tool.assignedRecipients.length === 1) {
                        tool.signatureData = signatureData;
                        tool.signedAt = new Date();
                        tool.value = 'Signed';
                    }
                    
                    await tool.save();
                    updatedFields.push(fieldId);
                }
            }
        }

        // Update recipient status to signed
        recipient.status = 'signed';
        recipient.signedAt = new Date();
        recipient.lastAccessedAt = new Date();
        recipient.accessCount = (recipient.accessCount || 0) + 1;
        await recipient.save();

        // Check if all recipients have signed
        const allRecipients = await DocumentRecipients.find({ documentId: documentId });
        const allSigned = allRecipients.every(r => r.status === 'signed');

        if (allSigned) {
            document.status = 'completed';
            document.completedAt = new Date();
            await document.save();
        }

        // Create activity log
        const activity = new Activity({
            userId,
            type: 'document_signed',
            title: `Signed document: ${document.name}`,
            description: `Recipient ${user.email} signed the document`,
            details: Object.keys(signatures).length + ' field(s) signed',
            relatedDocumentId: documentId,
        });

        await activity.save();

        console.log("Document signed by recipient:", documentId, "Recipient:", user.email, "Updated fields:", updatedFields.length);
        resp.status(200).send({
            message: "Document signed successfully",
            data: {
                status: recipient.status,
                signedAt: recipient.signedAt,
                updatedFields: updatedFields.length,
            }
        });
    } catch (error) {
        console.error("Error signing document:", error);
        resp.status(500).send({ message: "Error signing document", error: error.message });
    }
});

// Get document details
app.get("/api/documents/:documentId", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;

        const document = await Document.findById(documentId);
        
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        console.log("Document fetch - has fileData:", !!document.fileData, "fileData type:", typeof document.fileData);

        // Verify document belongs to user or is shared with user or user is recipient
        let hasAccess = document.userId.toString() === userId.toString() || document.sharedWith.includes(userId);
        
        // Check if user is a recipient
        if (!hasAccess) {
            const user = await User.findById(userId);
            if (user) {
                const recipient = await DocumentRecipients.findOne({
                    documentId: documentId,
                    recipientEmail: { $regex: `^${user.email}$`, $options: 'i' }
                });
                hasAccess = !!recipient;
            }
        }
        
        if (!hasAccess) {
            return resp.status(403).send({ message: "Unauthorized to access this document" });
        }

        // Convert fileData to base64 for JSON transmission
        const documentObj = document.toObject();
        if (documentObj.fileData) {
            console.log("Converting fileData to base64");
            // Handle both Buffer and Mongoose Binary types
            let binaryData = documentObj.fileData;
            if (typeof binaryData === 'object' && binaryData.buffer) {
                binaryData = binaryData.buffer;
            }
            if (Buffer.isBuffer(binaryData)) {
                documentObj.fileData = binaryData.toString('base64');
                console.log("fileData converted to base64, length:", documentObj.fileData.length);
            } else {
                console.log("WARNING: fileData is not a buffer, type:", typeof binaryData);
                documentObj.fileData = null;
            }
        } else {
            console.log("No fileData found in document");
        }

        // Fetch and enhance tools with signature data
        const documentTools = await DocumentTools.findOne({ documentId: documentId });
        let tools = documentTools ? documentTools.tools : [];
        
        // Get current user's email for finding their signature in assignedRecipients
        const currentUser = await User.findById(userId);
        const currentUserEmail = currentUser ? currentUser.email : null;
        
        if (tools && tools.length > 0) {
            for (let i = 0; i < tools.length; i++) {
                const toolId = tools[i].id;
                try {
                    // Try to find DocumentTool by toolId field (for legacy tool IDs)
                    // or by _id (for new ObjectId-based tools)
                    let docTool = await DocumentTool.findOne({ 
                        documentId: documentId,
                        toolId: toolId
                    });
                    
                    // If not found by toolId, try by _id if it's a valid ObjectId
                    if (!docTool && mongoose.Types.ObjectId.isValid(toolId)) {
                        docTool = await DocumentTool.findById(toolId);
                    }
                    
                    if (docTool) {
                        let signatureData = null;
                        
                        // First check assignedRecipients array for current user's signature
                        if (currentUserEmail && docTool.assignedRecipients && docTool.assignedRecipients.length > 0) {
                            const userRecipient = docTool.assignedRecipients.find(r => 
                                r.recipientEmail && r.recipientEmail.toLowerCase() === currentUserEmail.toLowerCase()
                            );
                            if (userRecipient && userRecipient.signatureData) {
                                signatureData = userRecipient.signatureData;
                            }
                        }
                        
                        // Fall back to legacy signatureData field
                        if (!signatureData && docTool.signatureData) {
                            signatureData = docTool.signatureData;
                        }
                        
                        if (signatureData) {
                            // Update the tool with signature data
                            tools[i].tool = tools[i].tool || {};
                            tools[i].tool.value = signatureData;
                        }
                    }
                } catch (error) {
                    console.log('Error fetching DocumentTool for toolId:', toolId, error.message);
                    // Continue without signature data if fetch fails
                }
            }
        }
        
        documentObj.tools = tools;

        resp.status(200).send({
            message: "Document retrieved successfully",
            data: documentObj,
        });
    } catch (error) {
        console.error("Error fetching document:", error);
        resp.status(500).send({ message: "Error fetching document", error: error.message });
    }
});

// API to save document tools/fields
app.post("/api/documents/:documentId/tools", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { tools } = req.body;

        console.log("Saving tools for document:", { documentId, userId, toolsCount: tools?.length });

        if (!tools || !Array.isArray(tools)) {
            return resp.status(400).send({ message: "Tools array is required" });
        }

        // Verify document belongs to user
        const document = await Document.findById(documentId);
        if (!document) {
            console.error("Document not found:", documentId);
            return resp.status(404).send({ message: "Document not found" });
        }

        if (document.userId.toString() !== userId) {
            console.error("User not authorized:", { documentUserId: document.userId.toString(), requestUserId: userId });
            return resp.status(403).send({ message: "Not authorized to update this document" });
        }

        // Update or create document tools
        let documentTools = await DocumentTools.findOneAndUpdate(
            { documentId: documentId },
            {
                documentId: documentId,
                userId: userId,
                tools: tools,
                updatedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log("Document tools saved for:", documentId);
        resp.status(200).send({
            message: "Tools saved successfully",
            tools: documentTools.tools
        });
    } catch (error) {
        console.error("Error saving document tools:", error);
        resp.status(500).send({ message: "Error saving tools", error: error.message });
    }
});

// API to get document tools/fields
app.get("/api/documents/:documentId/tools", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;

        // Verify document belongs to user or user is recipient
        const document = await Document.findById(documentId);
        if (!document) {
            return resp.status(403).send({ message: "Not authorized to access this document" });
        }

        let hasAccess = document.userId.toString() === userId.toString();
        
        // Check if user is a recipient
        if (!hasAccess) {
            const user = await User.findById(userId);
            if (user) {
                const recipient = await DocumentRecipients.findOne({
                    documentId: documentId,
                    recipientEmail: { $regex: `^${user.email}$`, $options: 'i' }
                });
                hasAccess = !!recipient;
            }
        }
        
        if (!hasAccess) {
            return resp.status(403).send({ message: "Not authorized to access this document" });
        }

        const documentTools = await DocumentTools.findOne({ documentId: documentId });
        let tools = documentTools ? documentTools.tools : [];
        
        // Get current user's email for finding their signature in assignedRecipients
        const currentUser = await User.findById(userId);
        const currentUserEmail = currentUser ? currentUser.email : null;
        
        console.log(`GET /api/documents/${documentId}/tools - User: ${currentUserEmail}, Found ${tools.length} tools`);

        // Enhance tools with signature data from DocumentTool records
        if (tools && tools.length > 0) {
            console.log(`Looking for signature data for user: ${currentUserEmail}`);
            
            for (let i = 0; i < tools.length; i++) {
                const toolId = tools[i].id;
                try {
                    // Try to find DocumentTool by toolId field (for legacy tool IDs)
                    // or by _id (for new ObjectId-based tools)
                    let docTool = await DocumentTool.findOne({ 
                        documentId: documentId,
                        toolId: toolId
                    });
                    
                    // If not found by toolId, try by _id if it's a valid ObjectId
                    if (!docTool && mongoose.Types.ObjectId.isValid(toolId)) {
                        docTool = await DocumentTool.findById(toolId);
                    }
                    
                    if (docTool) {
                        let signatureData = null;
                        console.log(`Found DocumentTool for toolId ${toolId}:`, {
                          hasAssignedRecipients: !!docTool.assignedRecipients,
                          recipientCount: docTool.assignedRecipients?.length || 0,
                          hasLegacySignatureData: !!docTool.signatureData
                        });
                        
                        // First check assignedRecipients array for current user's signature
                        if (currentUserEmail && docTool.assignedRecipients && docTool.assignedRecipients.length > 0) {
                            const userRecipient = docTool.assignedRecipients.find(r => 
                                r.recipientEmail && r.recipientEmail.toLowerCase() === currentUserEmail.toLowerCase()
                            );
                            if (userRecipient && userRecipient.signatureData) {
                                console.log(`Found signature data for user ${currentUserEmail} in toolId ${toolId}`);
                                signatureData = userRecipient.signatureData;
                            }
                        }
                        
                        // Fall back to legacy signatureData field
                        if (!signatureData && docTool.signatureData) {
                            signatureData = docTool.signatureData;
                        }
                        
                        if (signatureData) {
                            // Update the tool with signature data
                            tools[i].tool = tools[i].tool || {};
                            tools[i].tool.value = signatureData;
                        }
                    }
                } catch (error) {
                    console.log('Error fetching DocumentTool for toolId:', toolId, error.message);
                    // Continue without signature data if fetch fails
                }
            }
        }

        // Log the final tools being returned
        const toolsWithSignatures = tools.filter(t => t.tool && t.tool.value);
        console.log(`Returning ${tools.length} tools (${toolsWithSignatures.length} with signature data)`);
        toolsWithSignatures.forEach(t => {
            console.log(`  - Tool ${t.id} (${t.tool.label}): has signature data (length: ${t.tool.value.length})`);
        });

        resp.status(200).send({
            tools: tools
        });
    } catch (error) {
        console.error("Error fetching document tools:", error);
        resp.status(500).send({ message: "Error fetching tools", error: error.message });
    }
});

// Assign multiple recipients to a document tool (field)
// POST /api/documents/:documentId/tools/:toolId/recipients
app.post("/api/documents/:documentId/tools/:toolId/recipients", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId, toolId } = req.params;
        const { recipients } = req.body; // Array of { recipientEmail, recipientName, recipientId }

        if (!recipients || !Array.isArray(recipients)) {
            return resp.status(400).send({ message: "Recipients array is required" });
        }

        // Verify document belongs to user
        const document = await Document.findById(documentId);
        if (!document || document.userId.toString() !== userId) {
            return resp.status(403).send({ message: "Not authorized to update this document" });
        }

        // Get the tools array from legacy storage
        let documentTools = await DocumentTools.findOne({ documentId: documentId });
        if (!documentTools) {
            return resp.status(404).send({ message: "Document tools not found" });
        }

        // Find the specific tool
        const toolIndex = documentTools.tools.findIndex(t => t.id === toolId);
        if (toolIndex === -1) {
            return resp.status(404).send({ message: "Tool not found" });
        }

        // Format recipients array for the tool
        const assignedRecipients = recipients.map(r => ({
            recipientId: r.recipientId,
            recipientEmail: r.recipientEmail,
            recipientName: r.recipientName || null,
            status: 'pending',
            signatureData: null,
            signedAt: null,
        }));

        // Update tool with new recipients
        documentTools.tools[toolIndex].assignedRecipients = assignedRecipients;
        
        // Also update legacy single recipient field for backward compatibility (use first recipient)
        if (recipients.length > 0) {
            documentTools.tools[toolIndex].assignedRecipient = {
                _id: recipients[0].recipientId,
                recipientEmail: recipients[0].recipientEmail,
                recipientName: recipients[0].recipientName,
            };
        }

        await documentTools.save();

        resp.status(200).send({
            message: "Recipients assigned successfully",
            tool: documentTools.tools[toolIndex],
        });
    } catch (error) {
        console.error("Error assigning recipients to tool:", error);
        resp.status(500).send({ message: "Error assigning recipients", error: error.message });
    }
});

// Remove a recipient from a document tool
// DELETE /api/documents/:documentId/tools/:toolId/recipients/:recipientEmail
app.delete("/api/documents/:documentId/tools/:toolId/recipients/:recipientEmail", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId, toolId, recipientEmail } = req.params;

        // Verify document belongs to user
        const document = await Document.findById(documentId);
        if (!document || document.userId.toString() !== userId) {
            return resp.status(403).send({ message: "Not authorized to update this document" });
        }

        const documentTools = await DocumentTools.findOne({ documentId: documentId });
        if (!documentTools) {
            return resp.status(404).send({ message: "Document tools not found" });
        }

        const toolIndex = documentTools.tools.findIndex(t => t.id === toolId);
        if (toolIndex === -1) {
            return resp.status(404).send({ message: "Tool not found" });
        }

        // Remove recipient from array
        const tool = documentTools.tools[toolIndex];
        if (tool.assignedRecipients && Array.isArray(tool.assignedRecipients)) {
            tool.assignedRecipients = tool.assignedRecipients.filter(r => r.recipientEmail !== recipientEmail);
        }

        await documentTools.save();

        resp.status(200).send({
            message: "Recipient removed successfully",
            tool: documentTools.tools[toolIndex],
        });
    } catch (error) {
        console.error("Error removing recipient from tool:", error);
        resp.status(500).send({ message: "Error removing recipient", error: error.message });
    }
});

// Delete document
app.delete("/api/documents/:documentId", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;

        const document = await Document.findById(documentId);
        
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        // Verify document belongs to user
        if (document.userId.toString() !== userId.toString()) {
            return resp.status(403).send({ message: "Unauthorized to delete this document" });
        }

        await Document.findByIdAndDelete(documentId);

        // Create activity log
        const activity = new Activity({
            userId,
            type: 'document_uploaded',
            title: 'Document deleted',
            description: `Deleted document: ${document.name}`,
            details: 'Document permanently removed',
            relatedDocumentId: documentId,
        });

        await activity.save();

        console.log("Document deleted:", documentId, "User:", userId);
        resp.status(200).send({
            message: "Document deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting document:", error);
        resp.status(500).send({ message: "Error deleting document", error: error.message });
    }
});

// Publish document to recipients
// POST /api/documents/:documentId/publish
app.post("/api/documents/:documentId/publish", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { recipients, expiresIn = 30 } = req.body; // expiresIn in days

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return resp.status(400).send({ message: "Recipients array is required" });
        }

        const document = await Document.findById(documentId);
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        if (document.userId.toString() !== userId) {
            return resp.status(403).send({ message: "Not authorized to publish this document" });
        }

        // Generate unique publish link (using document ID + random token)
        const publishToken = require('crypto').randomBytes(16).toString('hex');
        const publishLink = `${publishToken}`;

        // Set expiration date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiresIn);

        // Update document with publishing info
        document.publishedStatus = 'published';
        document.publishedAt = new Date();
        document.publishLink = publishLink;
        document.publishLinkExpiry = expiryDate;
        document.status = 'pending_signatures';
        document.expiresAt = expiryDate;
        document.publishedRecipients = recipients.map(r => ({
            recipientEmail: r.recipientEmail,
            recipientName: r.recipientName,
            notifiedAt: new Date(),
        }));

        await document.save();

        // Create DocumentRecipients records for each recipient
        for (const recipient of recipients) {
            const signatureToken = require('crypto').randomBytes(16).toString('hex');
            const docRecipient = new DocumentRecipients({
                documentId: documentId,
                recipientEmail: recipient.recipientEmail.toLowerCase(),
                recipientName: recipient.recipientName,
                signatureToken: signatureToken,
                status: 'pending',
                order: recipients.indexOf(recipient),
            });
            await docRecipient.save();
        }

        // Create activity log
        const activity = new Activity({
            userId,
            type: 'document_shared',
            title: 'Document published',
            description: `Published document to ${recipients.length} recipient(s)`,
            details: `Recipients: ${recipients.map(r => r.recipientEmail).join(', ')}`,
            relatedDocumentId: documentId,
        });

        await activity.save();

        resp.status(200).send({
            message: "Document published successfully",
            publishLink: publishLink,
            expiresAt: expiryDate,
            recipients: recipients,
        });
    } catch (error) {
        console.error("Error publishing document:", error);
        resp.status(500).send({ message: "Error publishing document", error: error.message });
    }
});

// Unpublish document (expire it)
// POST /api/documents/:documentId/unpublish
app.post("/api/documents/:documentId/unpublish", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;

        const document = await Document.findById(documentId);
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        if (document.userId.toString() !== userId) {
            return resp.status(403).send({ message: "Not authorized to unpublish this document" });
        }

        // Mark as expired
        document.publishedStatus = 'expired';
        document.status = 'expired';
        document.publishLinkExpiry = new Date(); // Expire immediately
        document.expiresAt = new Date();

        await document.save();

        // Create activity log
        const activity = new Activity({
            userId,
            type: 'document_signed',
            title: 'Document unpublished',
            description: `Unpublished document and marked recipients' copies as expired`,
            relatedDocumentId: documentId,
        });

        await activity.save();

        resp.status(200).send({
            message: "Document unpublished successfully",
        });
    } catch (error) {
        console.error("Error unpublishing document:", error);
        resp.status(500).send({ message: "Error unpublishing document", error: error.message });
    }
});

// ==================== END DOCUMENT ENDPOINTS ====================

// ==================== DOCUMENT RECIPIENTS ENDPOINTS ====================

// Generate a unique signature token for recipient
function generateSignatureToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

// Add recipients to a document
app.post("/api/documents/:documentId/recipients", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { recipients, expiresAt, signingDeadline } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return resp.status(400).send({ message: "Recipients array is required" });
        }

        // Verify document belongs to user
        const document = await Document.findById(documentId);
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        if (document.userId.toString() !== userId.toString()) {
            return resp.status(403).send({ message: "Not authorized to update this document" });
        }

        // Lock document from further edits - change status to pending_signatures
        document.status = 'pending_signatures';
        document.expiresAt = expiresAt || null;
        document.signingDeadline = signingDeadline || null;
        await document.save();

        // Create recipient records with unique tokens
        const createdRecipients = [];
        for (let i = 0; i < recipients.length; i++) {
            const recipient = new DocumentRecipients({
                documentId: documentId,
                recipientEmail: recipients[i].email,
                recipientName: recipients[i].name || null,
                signatureToken: generateSignatureToken(),
                order: i,
            });
            const savedRecipient = await recipient.save();
            createdRecipients.push(savedRecipient);
        }

        // Create activity log
        const activity = new Activity({
            userId,
            type: 'action_required',
            title: `Document sent for signatures (${recipients.length} recipients)`,
            description: `${document.name} is waiting for ${recipients.length} signature(s)`,
            relatedDocumentId: documentId,
        });
        await activity.save();

        console.log("Recipients added to document:", documentId, "Count:", recipients.length);
        resp.status(201).send({
            message: "Recipients added successfully",
            data: createdRecipients,
        });
    } catch (error) {
        console.error("Error adding recipients:", error);
        resp.status(500).send({ message: "Error adding recipients", error: error.message });
    }
});

// Get all recipients for a document
app.get("/api/documents/:documentId/recipients", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;

        // Verify document belongs to user
        const document = await Document.findById(documentId);
        if (!document || document.userId.toString() !== userId.toString()) {
            return resp.status(403).send({ message: "Not authorized to access this document" });
        }

        const recipients = await DocumentRecipients.find({ documentId: documentId })
            .sort({ order: 1 });

        resp.status(200).send({
            message: "Recipients retrieved successfully",
            data: recipients,
        });
    } catch (error) {
        console.error("Error fetching recipients:", error);
        resp.status(500).send({ message: "Error fetching recipients", error: error.message });
    }
});

// Search for available emails by query (for recipient assignment)
app.get("/api/emails/search", verifyToken, async (req, resp) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return resp.status(400).send({ message: "Search query is required" });
        }

        // Search for users by email
        const users = await User.find({
            email: { $regex: q, $options: 'i' } // Case-insensitive search
        })
        .select('email firstName lastName')
        .limit(10); // Limit results to 10

        const emails = users.map(user => ({
            email: user.email,
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
            userId: user._id,
        }));

        resp.status(200).send({
            message: "Emails found",
            data: emails,
        });
    } catch (error) {
        console.error("Error searching emails:", error);
        resp.status(500).send({ message: "Error searching emails", error: error.message });
    }
});

// Get recipient by signature token (for public access during signing)
app.get("/api/recipients/:signatureToken", async (req, resp) => {
    try {
        const { signatureToken } = req.params;

        const recipient = await DocumentRecipients.findOne({ signatureToken });
        if (!recipient) {
            return resp.status(404).send({ message: "Recipient not found or link expired" });
        }

        // Check if document has expired
        const document = await Document.findById(recipient.documentId);
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        if (document.status === 'cancelled' || document.status === 'expired') {
            return resp.status(410).send({ message: "Document is no longer available for signing" });
        }

        if (document.expiresAt && document.expiresAt < new Date()) {
            // Mark recipient as expired
            recipient.status = 'expired';
            await recipient.save();
            return resp.status(410).send({ message: "Signing link has expired" });
        }

        // Update access tracking
        recipient.lastAccessedAt = new Date();
        recipient.accessCount += 1;
        if (!recipient.viewedAt) {
            recipient.viewedAt = new Date();
            recipient.status = 'viewed';
        }
        await recipient.save();

        // Return document and tools for this recipient
        const tools = await DocumentTool.find({
            documentId: recipient.documentId,
            $or: [
                { assignedToRecipientId: recipient._id },
                { toolType: { $in: ['my_signature', 'my_initial', 'my_email', 'my_fullname'] } },
            ],
        });

        resp.status(200).send({
            message: "Recipient access granted",
            data: {
                recipient,
                document: {
                    _id: document._id,
                    name: document.name,
                    status: document.status,
                    expiresAt: document.expiresAt,
                    signingDeadline: document.signingDeadline,
                },
                tools,
            },
        });
    } catch (error) {
        console.error("Error accessing recipient signing page:", error);
        resp.status(500).send({ message: "Error accessing document", error: error.message });
    }
});

// Mark recipient as declined
app.post("/api/recipients/:signatureToken/decline", async (req, resp) => {
    try {
        const { signatureToken } = req.params;
        const { declineReason } = req.body;

        const recipient = await DocumentRecipients.findOneAndUpdate(
            { signatureToken },
            {
                status: 'declined',
                declineReason: declineReason || null,
            },
            { new: true }
        );

        if (!recipient) {
            return resp.status(404).send({ message: "Recipient not found" });
        }

        // Create activity log
        const activity = new Activity({
            type: 'action_required',
            title: `Recipient declined to sign`,
            description: `${recipient.recipientEmail} declined signing`,
            relatedDocumentId: recipient.documentId,
        });
        // Note: userId will be null for anonymous recipient decline, but that's okay for audit purposes

        console.log("Recipient declined:", recipient._id);
        resp.status(200).send({
            message: "Decline recorded successfully",
            data: recipient,
        });
    } catch (error) {
        console.error("Error declining signature:", error);
        resp.status(500).send({ message: "Error recording decline", error: error.message });
    }
});

// Submit signature for a recipient
app.post("/api/recipients/:signatureToken/sign", async (req, resp) => {
    try {
        const { signatureToken } = req.params;
        const { signatures } = req.body;

        if (!signatures || Object.keys(signatures).length === 0) {
            return resp.status(400).send({ message: "At least one signature is required" });
        }

        const recipient = await DocumentRecipients.findOne({ signatureToken });
        if (!recipient) {
            return resp.status(404).send({ message: "Recipient not found or link expired" });
        }

        // Check document expiration
        const document = await Document.findById(recipient.documentId);
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        if (document.expiresAt && document.expiresAt < new Date()) {
            recipient.status = 'expired';
            await recipient.save();
            return resp.status(410).send({ message: "Signing link has expired" });
        }

        if (document.signingDeadline && document.signingDeadline < new Date()) {
            return resp.status(410).send({ message: "Signing deadline has passed" });
        }

        // Update each tool with the signature data for this recipient
        const updatedFields = [];
        for (const [fieldId, signatureData] of Object.entries(signatures)) {
            const tool = await DocumentTool.findById(fieldId);
            if (tool) {
                // Find the recipient in assignedRecipients array
                const recipientIndex = tool.assignedRecipients.findIndex(r => r.recipientId.toString() === recipient._id.toString());
                
                if (recipientIndex !== -1) {
                    // Update the specific recipient's signature in the array
                    tool.assignedRecipients[recipientIndex].signatureData = signatureData;
                    tool.assignedRecipients[recipientIndex].status = 'signed';
                    tool.assignedRecipients[recipientIndex].signedAt = new Date();
                    
                    // Also update legacy fields if this is the only recipient
                    if (tool.assignedRecipients.length === 1) {
                        tool.signatureData = signatureData;
                        tool.signedAt = new Date();
                        tool.value = 'Signed';
                    }
                    
                    await tool.save();
                    updatedFields.push(fieldId);
                }
            }
        }

        // Mark recipient as signed
        recipient.status = 'signed';
        recipient.signedAt = new Date();
        await recipient.save();

        // Check if all recipients have signed
        const allRecipients = await DocumentRecipients.find({ documentId: recipient.documentId });
        const allSigned = allRecipients.every(r => r.status === 'signed');

        if (allSigned) {
            document.status = 'completed';
            document.completedAt = new Date();
            await document.save();

            // Create activity log for document completion
            const activity = new Activity({
                relatedDocumentId: recipient.documentId,
                type: 'document_signed',
                title: 'Document fully signed and completed',
                details: `All ${allRecipients.length} recipients have signed`,
            });
            // Note: This log will have null userId, but documents are tracked by relatedDocumentId
            await activity.save();
        }

        console.log("Signature submitted for recipient:", recipient._id, "Updated fields:", updatedFields.length);
        resp.status(200).send({
            message: "Signature submitted successfully",
            data: {
                recipient,
                documentCompleted: allSigned,
                updatedFields: updatedFields.length,
            },
        });
    } catch (error) {
        console.error("Error submitting signature:", error);
        resp.status(500).send({ message: "Error submitting signature", error: error.message });
    }
});

// Cancel document (sender only)
app.post("/api/documents/:documentId/cancel", verifyToken, async (req, resp) => {
    try {
        const userId = req.userId;
        const { documentId } = req.params;
        const { cancellationReason } = req.body;

        // Verify document belongs to user
        const document = await Document.findById(documentId);
        if (!document) {
            return resp.status(404).send({ message: "Document not found" });
        }

        if (document.userId.toString() !== userId.toString()) {
            return resp.status(403).send({ message: "Not authorized to cancel this document" });
        }

        // Mark all recipient tokens as expired
        await DocumentRecipients.updateMany(
            { documentId: documentId },
            { status: 'expired' }
        );

        // Cancel document
        document.status = 'cancelled';
        document.cancelledBy = userId;
        document.cancelledAt = new Date();
        document.cancellationReason = cancellationReason || null;
        await document.save();

        // Create activity log
        const activity = new Activity({
            userId,
            type: 'action_required',
            title: 'Document cancelled',
            description: `Cancelled: ${document.name}`,
            details: cancellationReason || 'No reason provided',
            relatedDocumentId: documentId,
        });
        await activity.save();

        console.log("Document cancelled:", documentId, "By user:", userId);
        resp.status(200).send({
            message: "Document cancelled successfully",
            data: document,
        });
    } catch (error) {
        console.error("Error cancelling document:", error);
        resp.status(500).send({ message: "Error cancelling document", error: error.message });
    }
});

// ==================== END DOCUMENT RECIPIENTS ENDPOINTS ====================

// Start the server
app.listen(5000, () => {
    console.log("Signify Server is running on port 5000");
});