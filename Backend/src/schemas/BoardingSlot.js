// tracks remaining capacity (max 10 animals) per day
const mongoose = require("mongoose");
const { Schema } = mongoose;

const boardingSlotSchema = new Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  animalCount: { type: Number, default: 0, required: true }, // combined dog + cat count for the day
  blocked: { type: Boolean, default: false, required: true }, // manually closed
  bookings: [{ type: Schema.Types.ObjectId, ref: "BoardingBooking" }],
}, { timestamps: true });

// prevents duplicate slot docs for the same date
boardingSlotSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("BoardingSlot", boardingSlotSchema);