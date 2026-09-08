const mongoose = require("mongoose");

// SINGLETON. ONLY ONE DOCU (only one admin acc)
const AdminCredentialsSchema = new mongoose.Schema({
    singleton: { type: String, required: true, unique: true, default: "admin" },
    passwordHash: { type: String, required: true }
}, { timestamps: true });

const AdminCredentials = mongoose.model("AdminCredentials", AdminCredentialsSchema, "admin_credentials");

module.exports = { AdminCredentials };