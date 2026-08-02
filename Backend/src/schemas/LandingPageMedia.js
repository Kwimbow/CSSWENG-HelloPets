const mongoose = require("mongoose");

/*
- key corresponds to the id of the text element in the HTML
- path corresponds to the file path (route) of the image/video
*/

const landingPageMediaDefaultVals = {
    "featured-pet-img": "/Logos/dog.jpg",
    "video-img-1": "/Logos/placeholder.png",
    "video-img-2": "/Logos/placeholder.png",
    "video-img-3": "/Logos/placeholder.png",
};

const landingPageMediaKeys = Object.keys(landingPageMediaDefaultVals);

const LandingPageMediaSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: landingPageMediaKeys
    },
    path: {
        type: String,
        required: true
    }
});

const LandingPageMedia = mongoose.model("LandingPageMedia", LandingPageMediaSchema, "landing_page_media");

module.exports = { LandingPageMedia, landingPageMediaDefaultVals, landingPageMediaKeys };