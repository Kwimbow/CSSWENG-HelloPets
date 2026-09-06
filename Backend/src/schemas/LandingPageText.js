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
    "video-text-3": "Clean Bathing!",
    "contact-address": "Unit 2, RLX2 Sierra Valley (Beside Uniqlo & Fightyard)\nTuesdays - Sundays 9:30 AM - 6:30 PM",
    "contact-phone": "0919 777 6655"
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