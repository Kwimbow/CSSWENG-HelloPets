const mongoose = require("mongoose");

const connectDB = async function () {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // stop running if mongodb fails
  }
};

module.exports = connectDB;
