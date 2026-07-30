const mongoose = require("mongoose");

/*
- key corresponds to the id of the text element in the HTML
- value corresponds to the text content
*/

const LandingPageTextSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: [
            "featured-pet-name-breed",
            "featured-pet-description",
            "video-text-1",
            "video-text-2",
            "video-text-3"
        ]
    },
    value: { type: String, required: true }
});

const LandingPageText = mongoose.model("LandingPageText", LandingPageTextSchema, "landing_page_text");

module.exports = LandingPageText;