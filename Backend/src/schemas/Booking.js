const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    petSelection: { type: String, enum: ["dog", "cat"], required: true },
    petName: { type: String, required: true, trim: true },
    petWeight: { type: String, required: true },
    petBreed: { type: String, default: null },
    selectedService: { type: String, required: true },
    addOnServices: { type: [String], default: [] },
    aLaCarteServices: { type: [String], default: [] },
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

module.exports = mongoose.model("Booking", bookingSchema);
