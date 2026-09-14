const { MailerCredentials } = require("../schemas/MailerCredentials");
const { encryptSecret } = require("./secret_encryption");

async function ensureMailerCredentialsSeeded() {
    const existing = await MailerCredentials.findOne({ singleton: "mailer" });
    if (existing) return;

    const { GMAIL_USER, GMAIL_PASS } = process.env;
    if (!GMAIL_USER || !GMAIL_PASS) return;

    await MailerCredentials.create({
        singleton: "mailer",
        gmailUser: GMAIL_USER,
        encryptedPass: encryptSecret(GMAIL_PASS),
    });
}

module.exports = { ensureMailerCredentialsSeeded };