const mongoose = require("mongoose");

/*
- key corresponds to the id of the text element in the HTML
- value corresponds to the text content
*/

const landingPageTextDefaultVals = {
    "featured-pet-name-breed": "DogName, Shihtzu",
    "featured-pet-description": "✨ From Shaggy  to Swagger ✨ Summer lovin’ and getting ready to feel fresh for the sunny days ahead! ☀️🐾  Summer-ready and going steady.",
    "video-text-1": "Clean Interior!",
    "video-text-2": "Sanitized Tools!",
    "video-text-3": "Clean Bathing!"
};

const landingPageTextKeys = Object.keys(landingPageTextDefaultVals);

const LandingPageTextSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: landingPageTextKeys
    },
    value: { type: String, required: true }
});

const LandingPageText = mongoose.model("LandingPageText", LandingPageTextSchema, "landing_page_text");

module.exports = { LandingPageText, landingPageTextDefaultVals, landingPageTextKeys };