// tracks remaining capacity (max 9 dogs, max 3 cats) per day
const mongoose = require("mongoose");
const { Schema } = mongoose;

const boardingSlotSchema = new Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  dogCount: { type: Number, default: 0, required: true },
  catCount: { type: Number, default: 0, required: true },
  blocked: { type: Boolean, default: false, required: true }, // manually closed
  bookings: [{ type: Schema.Types.ObjectId, ref: "BoardingBooking" }],
}, { timestamps: true });

// prevents duplicate slot docs for the same date
boardingSlotSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("BoardingSlot", boardingSlotSchema);