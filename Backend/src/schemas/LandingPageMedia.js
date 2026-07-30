const mongoose = require("mongoose");

/*
- key corresponds to the id of the text element in the HTML
- path corresponds to the file path (route) of the image/video
*/

const LandingPageMediaSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: [
            "featured-pet-img",
            "video-img-1",
            "video-img-2",
            "video-img-3"
        ]
    },
    path: {
        type: String,
        required: true
    }
});

const LandingPageMedia = mongoose.model("LandingPageMedia", LandingPageMediaSchema, "landing_page_media");

module.exports = LandingPageMedia;