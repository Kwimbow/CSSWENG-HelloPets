const express = require("express");
const path = require("path");
require("dotenv").config();
const session = require("express-session");
const fileUpload = require("express-fileupload");

// can make this more secure later
adminUsername = process.env.ADMIN_USERNAME || "admin";
adminPassword = process.env.ADMIN_PASSWORD || "123456";

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// middleware for parsing requests
app.use(express.urlencoded({extended: false})); // for form data
app.use(express.json());
app.use(fileUpload());

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
    })
);

const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/hello-pets-db";
mongoose.connect(MONGODB_URI);

const { LandingPageMedia, landingPageMediaDefaultVals, landingPageMediaKeys } = require("./schemas/LandingPageMedia");
const { LandingPageText, landingPageTextDefaultVals, landingPageTextKeys } = require("./schemas/LandingPageText");

const adminAuthenticated = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.redirect("/admin/login");
    }
}

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "Index.html"))
});

// Gets any changes to the landing page that were edited through "Manage Page"
// Returns a JSON
app.get("/landing-page-edits", async (req, res) => {
    const allMedia = await LandingPageMedia.find().lean();
    const allText = await LandingPageText.find().lean();

    const media = {};
    for (const obj of allMedia) {
        media[obj.key] = obj.path;
    }

    for (const [key, value] of Object.entries(landingPageMediaDefaultVals)) {
        // if the image has not been edited
        if (!Object.hasOwn(media, key)) {
            media[key] = value;
        }
    }

    const text = {};
    for (const obj of allText) {
        text[obj.key] = obj.value;
    }

    for (const [key, value] of Object.entries(landingPageTextDefaultVals)) {
        // if the text has not been edited
        if (!Object.hasOwn(text, key)) {
            text[key] = value;
        }
    }

    res.json({ media, text });
});

app.get("/booking", async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "Booking.html"))
});

app.post("/submit-booking", async (req, res) => {
    console.log(req.body);
    res.json({ success: true });
});

app.get("/admin", async (req, res) => {
    res.redirect("/admin/login");
});

app.get("/admin/login", async (req, res) => {
    if (req.session.admin) {
        res.redirect("/admin/view_bookings");
    } else {
        res.sendFile(path.join(__dirname, "pages", "admin", "Login.html"));
    }
});

app.post("/admin/login", async (req, res) => {
    if (req.session.userId) {
        res.status(401).send("Error: You are already signed in as administrator.");
        return;
    }

    console.log(req.body);

    const { username, password } = req.body;

    if (username === adminUsername && password === adminPassword) {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.status(422).send("Incorrect username/password");
    }
});

app.get("/admin/manage_page", adminAuthenticated, async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "admin", "ManagePage.html"));
});

app.post("/admin/manage_page", adminAuthenticated, async (req, res) => {
    // text inputs
    const {
        fpNameBreed,
        fpDescription,
        videoText1,
        videoText2,
        videoText3 
    } = req.body || {};

    // file inputs
    const {
        fpImgInput,
        videoImgInput1,
        videoImgInput2,
        videoImgInput3
    } = req.files || {};

    // Editing database based on text inputs
    const options = { upsert: true };
    const textInputsObj = {
        "featured-pet-name-breed": fpNameBreed,
        "featured-pet-description": fpDescription,
        "video-text-1": videoText1,
        "video-text-2": videoText2,
        "video-text-3": videoText3
    };
    for (const [key, value] of Object.entries(textInputsObj)) {
        await LandingPageText.findOneAndUpdate(
            { key },
            { value },
            options
        );
    }

    // Editing database based on file inputs
    const fileInputsObj = {
        "featured-pet-img": fpImgInput,
        "video-img-1": videoImgInput1,
        "video-img-2": videoImgInput2,
        "video-img-3": videoImgInput3
    };

    for (const [key, file] of Object.entries(fileInputsObj)) {
        if (!file) { // if this file has not been uploaded
            continue;
        }

        let fileType, filePath;
        let fileExtension;
        let isValid = true;
        
        try {
            fileType = file.mimetype.split("/")[0];
            fileExtension = file.name.split(".").at(-1);

            if (fileType !== "image" && fileType !== "video") {
                isValid = false;
            }
        } catch (error) {
            console.log(error);
            continue;
        }

        if (!isValid) {
            console.log("Error: Invalid file type. Please upload an image.");
            continue;
        }

        const newFileName = crypto.randomUUID() + "." + fileExtension;
        filePath = path.join("/uploads", newFileName);

        file.mv(path.join(__dirname, "public", filePath), (error) => {
            if (error) {
                console.log(error);
            }
        });

        await LandingPageMedia.findOneAndUpdate(
            { key },
            { path: filePath },
            options
        );
    }

    res.json({ success: true });
});

app.get("/admin/view_bookings", adminAuthenticated, async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "admin", "ViewBookings.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});