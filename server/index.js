const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/signify', {
    // Remove deprecated options - they're handled automatically in newer versions
}).then(() => {
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

// Express setup
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000' // React frontend URL
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstName,
            lastName,
            address,
            email,
            password: hashedPassword,
        });

        let result = await user.save();
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

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return resp.status(401).send({ message: "INvalid email or password" });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        resp.status(200).send({
            message: "Sign in successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            }
        });
    } catch (e) {
        resp.status(500).send({ message: "Something went wrong", error: e.message });
    }
})

// Start the server
app.listen(5000, () => {
    console.log("Signify Server is running on port 5000");
});