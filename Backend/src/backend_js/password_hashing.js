const crypto = require("crypto");

function hashPassword(plainPassword) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(plainPassword, storedHash) {
    if (!storedHash || typeof storedHash !== "string") return false;

    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;

    const hashBuffer = Buffer.from(hash, "hex");
    const candidateBuffer = crypto.scryptSync(plainPassword, salt, 64);

    if (hashBuffer.length !== candidateBuffer.length) return false;

    return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
}

module.exports = { hashPassword, verifyPassword };