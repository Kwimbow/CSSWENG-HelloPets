const express = require("express");
const path = require("path");
require("dotenv").config();
const session = require("express-session");

// can make this more secure later
adminUsername = process.env.ADMIN_USERNAME || "admin";
adminPassword = process.env.ADMIN_PASSWORD || "123456";

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// middleware for parsing requests
app.use(express.urlencoded({extended: false})); // for form data
app.use(express.json());

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
    })
);

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

app.get("/admin/view_bookings", adminAuthenticated, async (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "admin", "ViewBookings.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});