const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv/config");
const crypto = require("crypto");
const { MongoStore } = require("connect-mongo");
const fs = require("fs");

require("dotenv").config();
// env file currently being used for the MONGODB URI so we can easily migrate to atlas
// will also be used for the email and password to send confirmations
const session = require("express-session");
const fileUpload = require("express-fileupload");

// makes uploads directoyy for admin
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
const { AdminCredentials } = require("./schemas/AdminCredentials");
const { hashPassword, verifyPassword } = require("./backend_js/password_hashing");
const { ensureAdminCredentialsExist } = require("./backend_js/ensure_admin_credentials");
const { MailerCredentials } = require("./schemas/MailerCredentials");
const { encryptSecret, decryptSecret } = require("./backend_js/secret_encryption");
const { ensureMailerCredentialsSeeded } = require("./backend_js/ensure_mailer_credentials");

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

app.post("/api/admin/bookings/grooming/respond", adminAuthenticated, async (req, res) => {
  const { bookingId, action } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (!bookingId || !["accept", "deny"].includes(action)) {
    return res.json({ success: false, error: "bookingId and a valid action are required" });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.json({ success: false, error: "Booking not found" });
  }

  if (booking.status !== "pending") {
    return res.json({ success: false, error: `This booking has already been ${booking.status}.` });
  }

  try {
    await resolveGroomingBooking(booking, action, baseUrl);
    res.json({ success: true, status: booking.status });
  } catch (err) {
    // the status change happens before the email send inside
    // resolveGroomingBooking, so a failure here just means the notification
    // didn't go out - the accept/deny itself still went through
    console.error("Error notifying customer about grooming booking:", err);
    res.json({
      success: true,
      status: booking.status,
      warning: "The booking status was updated, but the notification email could not be sent.",
    });
  }
});

app.post("/submit-booking", async (req, res) => {
  const { appointmentDate, appointmentTime, ...bookingData } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

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
    const booking = await Booking.create({ ...bookingData, appointmentDate, appointmentTime });
    slot.booking = booking._id;
    await slot.save();

    try {
      await sendOwnerNotificationEmail(booking, "grooming", baseUrl);
    } catch (emailErr) {
      // the booking still stands even if the notification email fails to
      // send - don't let a mailer hiccup lose a real booking
      console.error("Failed to send owner notification email:", emailErr);
    }

    res.json({ success: true });
  } catch (err) {
    // booking creation failed after slot was claimed, reset slot to open
    slot.status = "open";
    slot.booking = null;
    await slot.save();
    console.error("Error with booking: " + err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

async function getMailTransporter() {
  await ensureMailerCredentialsSeeded();
  const credentials = await MailerCredentials.findOne({ singleton: "mailer" });

  if (!credentials) {
    throw new Error("Mailer is not configured yet. Set it up from the admin Account page.");
  }

  const gmailUser = credentials.gmailUser;
  const gmailPass = decryptSecret(credentials.encryptedPass);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  return { transporter, gmailUser };
}

async function sendMail({ to, subject, html }) {
  const { transporter, gmailUser } = await getMailTransporter();
  await transporter.sendMail({
    from: `"Hello Pets PH" <${gmailUser}>`,
    to,
    subject,
    html,
  });
}

// human-readable labels for the internal slugs used by add-on/a-la-carte
// checkboxes, kept in sync with the equivalent objects in booking_page.js
const addOnLabels = {
  dematting: "Dematting",
  deshedding: "Deshedding",
};

const aLaCarteLabels = {
  "face-trim": "Face Trim",
  "poodle-feet": "Poodle Feet",
  "nail-trim": "Nail Trim",
  "ear-clean": "Ear Clean",
  "teeth-brushing": "Teeth Brushing",
  "anal-sac-draining": "Anal Sac Draining",
  cologne: "Cologne",
};

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

function formatGroomingServicesHTML(booking) {
  const addOnServicesHTML = (booking.addOnServices || [])
    .map(
      (service) => `
      <li style="padding: 8px 0; border-bottom: 1px solid #eaeaea; list-style-type: none; color: #333333;">
        • ${addOnLabels[service.name] || service.name}${service.severity ? ` (${capitalize(service.severity)})` : ""}
      </li>
    `,
    )
    .join("");

  const aLaCarteServicesHTML = (booking.aLaCarteServices || [])
    .map(
      (service) => `
      <li style="padding: 8px 0; border-bottom: 1px solid #eaeaea; list-style-type: none; color: #333333;">
        • ${aLaCarteLabels[service] || service}
      </li>
    `,
    )
    .join("");

  return { addOnServicesHTML, aLaCarteServicesHTML };
}

function formatDateLong(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// sent to the shop's own inbox the moment a customer submits a request -
// contains one-click Accept/Deny links, secured by the booking's random
// responseToken so no login is required to act on them from the email
async function sendOwnerNotificationEmail(booking, type, baseUrl) {
  const { gmailUser } = await getMailTransporter();
  const acceptUrl = `${baseUrl}/admin/bookings/respond?type=${type}&id=${booking._id}&token=${booking.responseToken}&action=accept`;
  const denyUrl = `${baseUrl}/admin/bookings/respond?type=${type}&id=${booking._id}&token=${booking.responseToken}&action=deny`;

  const { firstName, lastName, email, mobileNumber } = booking.customer;

  let detailsHtml;
  if (type === "grooming") {
    detailsHtml = `
      <p><strong>Date/Time:</strong> ${formatDateLong(booking.appointmentDate)} at ${booking.appointmentTime}</p>
      <p><strong>Pet:</strong> ${booking.petName}</p>
      <p><strong>Service:</strong> ${booking.selectedService}</p>
    `;
  } else {
    detailsHtml = `
      <p><strong>Check-in:</strong> ${formatDateLong(booking.startDate)} at ${booking.startTime}</p>
      <p><strong>Check-out:</strong> ${formatDateLong(booking.endDate)} at ${booking.endTime}</p>
      <p><strong>Pet:</strong> ${booking.petName} (${booking.petSelection})</p>
    `;
  }

  const html = `
    <h1>New ${type === "grooming" ? "Grooming" : "Boarding"} Request</h1>
    <p><strong>Customer:</strong> ${firstName} ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Mobile:</strong> ${mobileNumber}</p>
    ${detailsHtml}
    <div style="margin-top: 24px;">
      <a href="${acceptUrl}" style="background-color:#28B9B2;color:white;padding:12px 24px;border-radius:30px;text-decoration:none;font-weight:bold;margin-right:12px;">Accept</a>
      <a href="${denyUrl}" style="background-color:#EE3A78;color:white;padding:12px 24px;border-radius:30px;text-decoration:none;font-weight:bold;">Deny</a>
    </div>
  `;

  await sendMail({
    to: gmailUser,
    subject: `New ${type === "grooming" ? "Grooming" : "Boarding"} Request - Action Needed`,
    html,
  });
}

async function sendGroomingConfirmationEmail(booking) {
  const { addOnServicesHTML, aLaCarteServicesHTML } = formatGroomingServicesHTML(booking);
  const dateLabel = formatDateLong(booking.appointmentDate);

  const html = `
    <h1>Hi ${booking.customer.firstName},</h1>
    <p>Your appointment has successfully been scheduled for ${booking.appointmentTime}, ${dateLabel}!</p>
    <p>We look forward to taking care of ${booking.petName}!</p>

    <h3 style="border-bottom: 2px solid #4A90E2; padding-bottom: 8px; color: #333333;">Your Selected Services:</h3>
    <p><strong>Main Service:</strong> ${booking.selectedService}</p>

    <p><strong>Add-on Services</strong></p>
    <ul style="padding-left: 0; margin-top: 10px;">
      ${addOnServicesHTML || "<li>None</li>"}
    </ul>

    <p><strong>Ala Carte Services</strong></p>
    <ul style="padding-left: 0; margin-top: 10px;">
      ${aLaCarteServicesHTML || "<li>None</li>"}
    </ul>
  `;

  await sendMail({
    to: booking.customer.email,
    subject: "Your Appointment Confirmation",
    html,
  });
}

async function sendBoardingConfirmationEmail(booking) {
  const checkinLabel = formatDateLong(booking.startDate);
  const checkoutLabel = formatDateLong(booking.endDate);

  const html = `
    <h1>Hi ${booking.customer.firstName},</h1>
    <p>Your boarding stay has been confirmed!</p>
    <p><strong>Check-in:</strong> ${checkinLabel} at ${booking.startTime}</p>
    <p><strong>Check-out:</strong> ${checkoutLabel} at ${booking.endTime}</p>
    <p>We look forward to taking care of ${booking.petName}!</p>
  `;

  await sendMail({
    to: booking.customer.email,
    subject: "Your Boarding Confirmation",
    html,
  });
}

async function sendGroomingDenialEmail(booking, baseUrl) {
  const html = `
    <h1>Hi ${booking.customer.firstName},</h1>
    <p>We're sorry, but we're unable to accommodate your requested appointment at this time.</p>
    <p>Please feel free to book another date/time that works for you.</p>
    <p><a href="${baseUrl}/booking" style="background-color:#28B9B2;color:white;padding:12px 24px;border-radius:30px;text-decoration:none;font-weight:bold;">Book Again</a></p>
  `;

  await sendMail({
    to: booking.customer.email,
    subject: "Your Appointment Request",
    html,
  });
}

async function sendBoardingDenialEmail(booking, baseUrl) {
  const html = `
    <h1>Hi ${booking.customer.firstName},</h1>
    <p>We're sorry, but we're unable to accommodate your requested boarding stay at this time.</p>
    <p>Please feel free to book another date range that works for you.</p>
    <p><a href="${baseUrl}/boarding" style="background-color:#28B9B2;color:white;padding:12px 24px;border-radius:30px;text-decoration:none;font-weight:bold;">Book Again</a></p>
  `;

  await sendMail({
    to: booking.customer.email,
    subject: "Your Boarding Request",
    html,
  });
}

async function resolveGroomingBooking(booking, action, baseUrl) {
  booking.status = action === "accept" ? "confirmed" : "denied";
  await booking.save();

  if (action === "deny") {
    await Slot.updateOne({ booking: booking._id }, { status: "open", booking: null });
    await sendGroomingDenialEmail(booking, baseUrl);
  } else {
    await sendGroomingConfirmationEmail(booking);
  }
}

async function resolveBoardingBooking(booking, action, baseUrl) {
  booking.status = action === "accept" ? "confirmed" : "denied";
  await booking.save();

  if (action === "deny") {
    await releaseBoardingDates(booking.startDate, booking.endDate, booking.petSelection, booking._id);
    await sendBoardingDenialEmail(booking, baseUrl);
  } else {
    await sendBoardingConfirmationEmail(booking);
  }
}

function renderResponsePage(title, message) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>${title}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: sans-serif; background-color: #f5f5f5; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
        <div style="background:white; padding: 2.5rem; border-radius: 20px; max-width: 420px; text-align:center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h1 style="color:#28B9B2;">${title}</h1>
          <p style="color:#333;">${message}</p>
        </div>
      </body>
    </html>
  `;
}

// this is what the owner's browser hits when they click Accept/Deny 
app.get("/admin/bookings/respond", async (req, res) => {
  const { type, id, token, action } = req.query;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (!["grooming", "boarding"].includes(type) || !["accept", "deny"].includes(action) || !id || !token) {
    return res.status(400).send(renderResponsePage("Invalid Link", "This link is missing information or malformed."));
  }

  const Model = type === "grooming" ? Booking : BoardingBooking;
  const booking = await Model.findById(id);

  if (!booking) {
    return res.status(404).send(renderResponsePage("Not Found", "This booking could not be found. It may have already been deleted."));
  }

  if (booking.responseToken !== token) {
    return res.status(403).send(renderResponsePage("Invalid Link", "This link is not valid."));
  }

  if (booking.status !== "pending") {
    return res.send(renderResponsePage("Already Handled", `This booking has already been ${booking.status}. No further action was taken.`));
  }

  try {
    if (type === "grooming") {
      await resolveGroomingBooking(booking, action, baseUrl);
    } else {
      await resolveBoardingBooking(booking, action, baseUrl);
    }

    return res.send(
      action === "accept"
        ? renderResponsePage("Booking Confirmed", "The customer has been notified that their booking is confirmed.")
        : renderResponsePage("Booking Denied", "The customer has been notified and the slot has been released.")
    );
  } catch (err) {
    console.error("Error responding to booking:", err);
    return res.status(500).send(renderResponsePage("Error", "Something went wrong processing this request. Please check the admin dashboard."));
  }
});

app.get("/boarding", async (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "Boarding.html"));
});

app.post("/submit-boarding-booking", async (req, res) => {
  const { startDate, startTime, endDate, endTime, petSelection, ...bookingData } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

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

    try {
      await sendOwnerNotificationEmail(booking, "boarding", baseUrl);
    } catch (emailErr) {
      console.error("Failed to send owner notification email:", emailErr);
    }

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

app.post("/api/admin/bookings/boarding/respond", adminAuthenticated, async (req, res) => {
  const { bookingId, action } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (!bookingId || !["accept", "deny"].includes(action)) {
    return res.json({ success: false, error: "bookingId and a valid action are required" });
  }

  const booking = await BoardingBooking.findById(bookingId);
  if (!booking) {
    return res.json({ success: false, error: "Booking not found" });
  }

  if (booking.status !== "pending") {
    return res.json({ success: false, error: `This booking has already been ${booking.status}.` });
  }

  try {
    await resolveBoardingBooking(booking, action, baseUrl);
    res.json({ success: true, status: booking.status });
  } catch (err) {
    // same as the grooming route: the status change already happened before
    // the email send inside resolveBoardingBooking
    console.error("Error notifying customer about boarding booking:", err);
    res.json({
      success: true,
      status: booking.status,
      warning: "The booking status was updated, but the notification email could not be sent.",
    });
  }
});

app.post("/admin/login", async (req, res) => {
  if (req.session.userId) {
    res.status(401).send("Error: You are already signed in as administrator.");
    return;
  }

  const { password } = req.body;

  await ensureAdminCredentialsExist();
  const credentials = await AdminCredentials.findOne({ singleton: "admin" });

  if (credentials && verifyPassword(password, credentials.passwordHash)) {
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
    res.status(422).send("Incorrect password");
  }
});

app.get("/admin/password", adminAuthenticated, async (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "admin", "Password.html"));
});

app.post("/admin/change-password", adminAuthenticated, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: "Current and new password are both required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: "New password must be at least 6 characters." });
  }

  await ensureAdminCredentialsExist();
  const credentials = await AdminCredentials.findOne({ singleton: "admin" });

  if (!credentials || !verifyPassword(currentPassword, credentials.passwordHash)) {
    return res.status(401).json({ success: false, error: "Current password is incorrect." });
  }

  credentials.passwordHash = hashPassword(newPassword);
  await credentials.save();

  res.json({ success: true });
});

app.get("/admin/mailer-credentials", adminAuthenticated, async (req, res) => {
    const credentials = await MailerCredentials.findOne({ singleton: "mailer" });
    res.json({ success: true, gmailUser: credentials ? credentials.gmailUser : null });
});

app.post("/admin/mailer-credentials", adminAuthenticated, async (req, res) => {
    const { gmailUser, gmailAppPassword } = req.body || {};

    if (!gmailUser || !gmailAppPassword) {
        return res.status(400).json({ success: false, error: "Both the Gmail address and app password are required." });
    }

    await MailerCredentials.findOneAndUpdate(
        { singleton: "mailer" },
        { singleton: "mailer", gmailUser, encryptedPass: encryptSecret(gmailAppPassword) },
        { upsert: true }
    );

    res.json({ success: true });
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
        videoText3,
        contactAddress,
        contactPhone
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
        "video-text-3": videoText3,
        "contact-address": contactAddress,
        "contact-phone": contactPhone
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

    const moveFile = (file, destFsPath) => new Promise((resolve, reject) => {
        file.mv(destFsPath, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });

    const fileErrors = [];

    for (const [key, file] of Object.entries(fileInputsObj)) {
        if (!file) { // if this file has not been uploaded
            continue;
        }

        let fileType, fileExtension;
        let isValid = true;
        
        try {
            fileType = file.mimetype.split("/")[0];
            fileExtension = file.name.split(".").at(-1);

            if (fileType !== "image" && fileType !== "video") {
                isValid = false;
            }
        } catch (error) {
            console.error(error);
            fileErrors.push(`${key}: could not read the uploaded file`);
            continue;
        }

        if (!isValid) {
            console.error("Error: Invalid file type. Please upload an image or video.");
            fileErrors.push(`${key}: invalid file type - please upload an image or video`);
            continue;
        }

        const newFileName = crypto.randomUUID() + "." + fileExtension;
        const filePath = "/uploads/" + newFileName;

        try {
            await moveFile(file, path.join(uploadsDir, newFileName));
        } catch (error) {
            console.error(error);
            fileErrors.push(`${key}: failed to save the uploaded file`);
            continue;
        }

        await LandingPageMedia.findOneAndUpdate(
            { key },
            { path: filePath },
            options
        );
    }

    res.json({ success: fileErrors.length === 0, errors: fileErrors });
});

app.get("/admin/pricing", adminAuthenticated, async (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "admin", "Pricing.html"));
});

app.post("/admin/pricing", adminAuthenticated, async (req, res) => {
    // sent as one field per price, named after its key
    // (e.g. body["dog:essential-bath:S"] = "250")
    const pricingUpdates = {};
    for (const key of pricingKeys) {
        if (Object.hasOwn(req.body || {}, key)) {
            const numericValue = Number(req.body[key]);
            if (Number.isFinite(numericValue) && numericValue >= 0) {
                pricingUpdates[key] = numericValue;
            }
        }
    }

    const options = { upsert: true };
    for (const [key, value] of Object.entries(pricingUpdates)) {
        await Pricing.findOneAndUpdate(
            { key },
            { value },
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
