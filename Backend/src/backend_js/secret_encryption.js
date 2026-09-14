const crypto = require("crypto");

function getKey() {
    const keyStr = process.env.ENCRYPTION_KEY;
    if (!keyStr) {
        throw new Error("ENCRYPTION_KEY is not set in the environment.");
    }

    const key = /^[0-9a-fA-F]{64}$/.test(keyStr)
        ? Buffer.from(keyStr, "hex")
        : Buffer.from(keyStr, "base64");

    if (key.length !== 32) {
        throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes.");
    }

    return key;
}

function encryptSecret(plainText) {
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(storedValue) {
    const key = getKey();
    const [ivHex, authTagHex, encryptedHex] = storedValue.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error("Malformed encrypted value.");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
}

module.exports = { encryptSecret, decryptSecret };