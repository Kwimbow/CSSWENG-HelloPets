const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv/config");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// middleware for parsing requests
// app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "Index.html"));
});

app.get("/booking", async (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "Booking.html"));
});

app.post("/submit-booking", async (req, res) => {
  console.log(req.body);
  try {
    await sendEmail(req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
  // TODO (2026-07-16) backend input validation
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

async function sendEmail(booking) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const {
    firstName,
    email,
    appointmentDate,
    appointmentTime,
    selectedService,
    addOnServices,
    aLaCarteServices,
    petName,
  } = booking;

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

  // TODO (2026-07-16) style the email like hello pets
  // TODO (2026-07-16) make the service names better for human reading
  await transporter.sendMail(mailOptions);
}
