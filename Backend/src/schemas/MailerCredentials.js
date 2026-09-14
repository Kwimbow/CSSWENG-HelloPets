const mongoose = require("mongoose");

// singleton 
const MailerCredentialsSchema = new mongoose.Schema({
    singleton: { type: String, required: true, unique: true, default: "mailer" },
    gmailUser: { type: String, required: true },
    encryptedPass: { type: String, required: true }
}, { timestamps: true });

const MailerCredentials = mongoose.model("MailerCredentials", MailerCredentialsSchema, "mailer_credentials");

module.exports = { MailerCredentials };