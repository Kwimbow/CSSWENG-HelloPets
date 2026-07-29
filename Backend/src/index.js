const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// middleware for parsing requests
// app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "Index.html"))
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
    res.sendFile(path.join(__dirname, "pages", "admin", "Login.html"));
});

app.get("/admin/manage_page", async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "admin", "ManagePage.html"));
});

app.get("/admin/view_bookings", async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "admin", "ViewBookings.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});