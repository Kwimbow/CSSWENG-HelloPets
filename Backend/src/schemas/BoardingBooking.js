const mongoose = require("mongoose");
const { Schema } = mongoose;

const boardingBookingSchema = new Schema(
  {
    startDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endDate: { type: String, required: true },
    endTime: { type: String, required: true },

    petSelection: { type: String, enum: ["dog", "cat"], required: true },
    petName: { type: String, required: true, trim: true },
    petWeight: { type: String, required: true },
    petBreed: { type: String, default: null },
    customer: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      mobileNumber: { type: String, required: true },
    },
    optionalNotes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BoardingBooking", boardingBookingSchema);