const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv/config");
const crypto = require("crypto");
const { MongoStore } = require("connect-mongo");

require("dotenv").config();
// env file currently being used for the MONGODB URI so we can easily migrate to atlas
// will also be used for the email and password to send confirmations
const session = require("express-session");
const fileUpload = require("express-fileupload");

// can make this more secure later
adminUsername = process.env.ADMIN_USERNAME || "admin";
adminPassword = process.env.ADMIN_PASSWORD || "123456";

const connectDB = require("./backend_js/db");

const {
  ensureSlotsExistForDate,
  timeSlots,
} = require("./backend_js/ensure_slots");
const Slot = require("./schemas/Slot");
const Booking = require("./schemas/Booking");
const {
  ensureBoardingSlotExistsForDate,
  ensureBoardingSlotsExistForRange,
  getDateRangeInclusive,
  hasBoardingCapacity,
  claimBoardingDates,
  releaseBoardingDates,
  MAX_ANIMALS_PER_DAY,
} = require("./backend_js/ensure_boarding_slots");
const BoardingSlot = require("./schemas/BoardingSlot");
const BoardingBooking = require("./schemas/BoardingBooking");

const app = express();

app.set("trust proxy", 1);

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});


app.use(express.static(path.join(__dirname, "public")));

// middleware for parsing requests
app.use(express.urlencoded({ extended: false })); // for form data
app.use(express.json());
app.use(fileUpload());

app.use(
  session({
    secret: "secret-key", // TODO (2026-08-08) migrate to env variable
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

const { LandingPageMedia, landingPageMediaDefaultVals, landingPageMediaKeys } = require("./schemas/LandingPageMedia");
const { LandingPageText, landingPageTextDefaultVals, landingPageTextKeys } = require("./schemas/LandingPageText");
const { Pricing, pricingDefaultVals, pricingKeys } = require("./schemas/Pricing");

const adminAuthenticated = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "Index.html"));
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

// fetch to get current prices
app.get("/api/pricing", async (req, res) => {
    const allPricing = await Pricing.find().lean();

    const pricing = {};
    for (const obj of allPricing) {
        pricing[obj.key] = obj.value;
    }

    for (const [key, value] of Object.entries(pricingDefaultVals)) {
        // if this price has not been edited yet
        if (!Object.hasOwn(pricing, key)) {
            pricing[key] = value;
        }
    }

    res.json({ success: true, pricing });
});

app.get("/booking", async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "Booking.html"))
});

// main user endpoint with no auth, just gets the slots and their availability
app.get("/api/slots/:date", async (req, res) => {
  const { date } = req.params;
  await ensureSlotsExistForDate(date);
  const slots = await Slot.find({ date });
  res.json({ success: true, slots });
});

// main user endpoint with no auth, gets a single boarding day's remaining capacity
app.get("/api/boarding-slots/:date", async (req, res) => {
  const { date } = req.params;
  await ensureBoardingSlotExistsForDate(date);
  const slot = await BoardingSlot.findOne({ date });

  if (!slot) {
    return res.json({ success: true, slot: null });
  }

  res.json({
    success: true,
    slot: {
      date: slot.date,
      blocked: slot.blocked,
      spotsLeft: Math.max(0, MAX_ANIMALS_PER_DAY - slot.animalCount),
    },
  });
});

// optimizing API call for mongodb connections, fetching monthly slots in 1 request
app.get("/api/slots/month/:yearMonth", async (req, res) => {
  const { yearMonth } = req.params;
  const slots = await Slot.find({ date: { $regex: `^${yearMonth}` } });
  res.json({ success: true, slots });
});


// admin endpoint, gets the slots + booking info
app.get("/api/admin/slots/:date", adminAuthenticated, async (req, res) => {
  const { date } = req.params;
  await ensureSlotsExistForDate(date);
  const slots = await Slot.find({ date }).populate("booking");
  res.json({ success: true, slots });
});

// optimizing API call for mongodb connections, fetching monthly slots in 1 request
app.get("/api/admin/slots/month/:yearMonth", adminAuthenticated, async (req, res) => {
  const { yearMonth } = req.params;
  const slots = await Slot.find({ date: { $regex: `^${yearMonth}` } }).populate("booking");
  res.json({ success: true, slots });
});


// admin endpoint, gets the info for a specific slot
app.get("/api/admin/slotinfo", adminAuthenticated, async (req, res) => {
    const { date, time } = req.query;
    await ensureSlotsExistForDate(date);
    const slot = await Slot.findOne({ date: date, time: time }).populate("booking");
    res.json({ success: true, slot });
});

// admin endpoint, block one or all open slots on a date
// body: { date: "YYYY-MM-DD", time?: "HH:MM" }  (omit time to block full day)
app.post("/api/admin/slots/block", adminAuthenticated, async (req, res) => {
  const { date, time } = req.body;
  if (!date) return res.json({ success: false, error: "date is required" });

  await ensureSlotsExistForDate(date);

  const filter = time
    ? { date, time, status: "open" }
    : { date, status: "open" };

  const result = await Slot.updateMany(filter, { status: "blocked" });
  res.json({ success: true, modified: result.modifiedCount });
});

// admin endpoint, unblock one or all blocked slots on a date
// body: { date: "YYYY-MM-DD", time?: "HH:MM" }
app.post("/api/admin/slots/unblock", adminAuthenticated, async (req, res) => {
  const { date, time } = req.body;
  if (!date) return res.json({ success: false, error: "date is required" });

  const filter = time
    ? { date, time, status: "blocked" }
    : { date, status: "blocked" };

  const result = await Slot.updateMany(filter, { status: "open" });
  res.json({ success: true, modified: result.modifiedCount });
});

// admin endpoint, delete one or all appointments on a given date along with their booking info
// body: { date: "YYYY-MM-DD", time?: "HH:MM" }
app.post("/api/admin/slots/deleteAppointment", adminAuthenticated, async (req, res) => {
  const { date, time } = req.body;
  if (!date) return res.json({ success: false, error: "date is required" });

  const filter = time
    ? { date, time, status: "booked" }
    : { date, status: "booked" };

  const targetSlots = await Slot.find(filter).select("booking");
  const bookingIds = targetSlots.map(slot => slot.booking).filter(id => id != null);
   
  const deleted = await Booking.deleteMany({
    _id: { $in: bookingIds }
  });
  const opened = await Slot.updateMany(filter, { status: "open", booking: null});

  res.json({ success: true, modified: opened.modifiedCount }); 
});


app.post("/submit-booking", async (req, res) => {
  const { appointmentDate, appointmentTime, ...bookingData } = req.body;

  const slot = await Slot.findOneAndUpdate(
    { date: appointmentDate, time: appointmentTime, status: "open" },
    { status: "booked" },
    { new: true },
  );

  if (!slot) {
    return res.json({
      success: false,
      error: "That time slot is no longer available.",
    });
  }

  try {
    const booking = await Booking.create(bookingData);
    slot.booking = booking._id;
    await slot.save();
    await sendEmail(appointmentDate, appointmentTime, bookingData);
    res.status(200);
  } catch (err) {
    // booking creation failed after slot was claimed, reset slot to open
    slot.status = "open";
    slot.booking = null;
    await slot.save();
    console.log("Error with booking: " + err);    
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/boarding", async (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "Boarding.html"));
});

app.post("/submit-boarding-booking", async (req, res) => {
  const { startDate, startTime, endDate, endTime, petSelection, ...bookingData } = req.body;
  console.log(req.body);

  if (!startDate || !startTime || !endDate || !endTime) {
    return res.json({ success: false, error: "Start and end date/time are required." });
  }
  if (petSelection !== "dog" && petSelection !== "cat") {
    return res.json({ success: false, error: "petSelection must be 'dog' or 'cat'." });
  }

  const isAvailable = await hasBoardingCapacity(startDate, endDate, petSelection);
  if (!isAvailable) {
    return res.json({
      success: false,
      error: "One or more of the selected dates no longer have room available.",
    });
  }

  try {
    const booking = await BoardingBooking.create({
      startDate,
      startTime,
      endDate,
      endTime,
      petSelection,
      ...bookingData,
    });

    await claimBoardingDates(startDate, endDate, petSelection, booking._id);

    res.json({ success: true, booking });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// admin endpoint, gets a boarding day's full capacity info + every booking on that dy
app.get("/api/admin/boarding-slots/:date", adminAuthenticated, async (req, res) => {
  const { date } = req.params;
  await ensureBoardingSlotExistsForDate(date);
  const slot = await BoardingSlot.findOne({ date }).populate("bookings");
  res.json({ success: true, slot });
});

// admin endpoint, block a boarding day
// body: { date: "YYYY-MM-DD" }
app.post("/api/admin/boarding-slots/block", adminAuthenticated, async (req, res) => {
  const { date } = req.body;
  if (!date) return res.json({ success: false, error: "date is required" });

  await ensureBoardingSlotExistsForDate(date);

  const result = await BoardingSlot.updateOne({ date }, { blocked: true });
  res.json({ success: true, modified: result.modifiedCount });
});

// admin endpoint, unblock a boarding day
// body: { date: "YYYY-MM-DD" }
app.post("/api/admin/boarding-slots/unblock", adminAuthenticated, async (req, res) => {
  const { date } = req.body;
  if (!date) return res.json({ success: false, error: "date is required" });

  const result = await BoardingSlot.updateOne({ date }, { blocked: false });
  res.json({ success: true, modified: result.modifiedCount });
});

// admin endpoint, delete a specific boarding booking by ID and decrement dog/cat count
// body: { bookingId: "..." }
app.post("/api/admin/boarding-slots/deleteBooking", adminAuthenticated, async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.json({ success: false, error: "bookingId is required" });

  const booking = await BoardingBooking.findById(bookingId);
  if (!booking) {
    return res.json({ success: false, error: "No boarding booking found with that ID." });
  }

  await releaseBoardingDates(booking.startDate, booking.endDate, booking.petSelection, booking._id);
  await BoardingBooking.deleteOne({ _id: booking._id });

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
    req.session.save((err) => {
    if (err) {
        console.error("Session save error:", err);
        return res
        .status(500)
        .json({ success: false, error: "Session save failed" });
    }
    res.json({ success: true });
    });
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

async function sendEmail(appointmentDate, appointmentTime, bookingData) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const {
    selectedService,
    addOnServices,
    aLaCarteServices,
    petName,
    customer: { firstName, lastName, email },
  } = bookingData;

  const addOnServicesHTML = (addOnServices || [])
    .map(
      (service) => `
      <li style="padding: 8px 0; border-bottom: 1px solid #eaeaea; list-style-type: none; color: #333333;">
        • ${service}
      </li>
    `,
    )
    .join("");

  const aLaCarteServicesHTML = (aLaCarteServices || [])
    .map(
      (service) => `
      <li style="padding: 8px 0; border-bottom: 1px solid #eaeaea; list-style-type: none; color: #333333;">
        • ${service}
      </li>
    `,
    )
    .join("");


  // TODO (2026-08-10) proper email styling, plus the HTML gen here is outdated since addOnServices now have both name and severity
  // also map services to human-readable service names instead of internal naming
  
  const dateOptions = { year: "numeric", month: "long", day: "numeric" };
  const date = new Date(appointmentDate).toLocaleDateString(
    "en-US",
    dateOptions,
  );

  const mailOptions = {
    from: `"Hello Pets PH" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Appointment Confirmation",
    html: `
      <h1>Hi ${firstName},</h1>
      <p>Your appointment has successfully been scheduled for ${appointmentTime}, ${date}!</p>
      <p>We look forward to taking care of ${petName}!</p> 
      
      <h3 style="border-bottom: 2px solid #4A90E2; padding-bottom: 8px; color: #333333;">Your Selected Services:</h3>
      <p><strong>Main Service:</strong> ${selectedService}</p>
      
      <p><strong>Add-on Services</strong></p>
      <ul style="padding-left: 0; margin-top: 10px;">
        ${addOnServicesHTML || "<li>None</li>"}
      </ul>
      
      <p><strong>Ala Carte Services</strong></p>
      <ul style="padding-left: 0; margin-top: 10px;">
        ${aLaCarteServicesHTML || "<li>None</li>"}
      </ul>
    `,
  };

  await transporter.sendMail(mailOptions);
}
