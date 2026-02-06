const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");

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
        const user = new User(req.body);
        let result = await user.save();
        if (result) {
            delete result.password; // Don't send password back
            resp.status(201).send(result);
        }
    } catch (e) {
        resp.status(500).send({ message: "Something went wrong", error: e.message });
    }
});

// Start the server
app.listen(5000, () => {
    console.log("Signify Server is running on port 5000");
});