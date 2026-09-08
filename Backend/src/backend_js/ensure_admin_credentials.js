const { AdminCredentials } = require("../schemas/AdminCredentials");
const { hashPassword } = require("./password_hashing");

async function ensureAdminCredentialsExist() {
	const initialPassword = process.env.ADMIN_PASSWORD || "123456";

	await AdminCredentials.updateOne(
		{ singleton: "admin" },
		{ $setOnInsert: { singleton: "admin", passwordHash: hashPassword(initialPassword) } },
		{ upsert: true },
	);
}

module.exports = { ensureAdminCredentialsExist };