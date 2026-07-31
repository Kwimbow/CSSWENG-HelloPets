// fixed, 1-hour slots for every appointment that can also be manually blocked by admin
const mongoose = require("mongoose");
const { Schema } = mongoose;

const slotSchema = new Schema({
	date: { type: String, required: true }, // "YYYY-MM-DD"
	time: { type: String, required: true }, // "HH:MM", one of the fixed hourly slots
	status: {
		type: String,
		enum: ["open", "booked", "blocked"],
		default: "open",
		required: true
	},
	booking: {
		type: Schema.Types.ObjectId,
		ref: "Booking",
		default: null
	}
}, { timestamps: true });

// prevents duplicate slot docs for the same date+time
slotSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema);