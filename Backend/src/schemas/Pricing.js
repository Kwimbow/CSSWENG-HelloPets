const mongoose = require("mongoose");

const pricingDefaultVals = {
    "dog:essential-bath:S": 1000,
    "dog:essential-bath:M": 350,
    "dog:essential-bath:L": 450,
    "dog:essential-bath:XL": 600,
    "dog:essential-bath:XXL": 800,

    "dog:premium-bath:S": 350,
    "dog:premium-bath:M": 450,
    "dog:premium-bath:L": 550,
    "dog:premium-bath:XL": 700,
    "dog:premium-bath:XXL": 900,

    "dog:classic-grooming:S": 550,
    "dog:classic-grooming:M": 650,
    "dog:classic-grooming:L": 800,
    "dog:classic-grooming:XL": 1000,
    "dog:classic-grooming:XXL": 1300,

    "dog:luxe-grooming:S": 650,
    "dog:luxe-grooming:M": 750,
    "dog:luxe-grooming:L": 1000,
    "dog:luxe-grooming:XL": 1200,
    "dog:luxe-grooming:XXL": 1500,

    "dog:special-cut:S": 150,
    "dog:special-cut:M": 150,
    "dog:special-cut:L": 150,
    "dog:special-cut:XL": 150,
    "dog:special-cut:XXL": 150,

    "cat:kitty-grooming": 700,
    "cat:kitty-special-cut": 200,

    "addon:light": 200,
    "addon:medium": 400,
    "addon:heavy": 600,

    "alac:face-trim": 150,
    "alac:poodle-feet": 150,
    "alac:nail-trim": 100,
    "alac:ear-clean": 100,
    "alac:teeth-brushing": 100,
    "alac:anal-sac-draining": 150,
    "alac:cologne": 50,

    "boarding:S": 700,
    "boarding:M": 750,
    "boarding:L": 850,
    "boarding:XL": 1000,
    "boarding:XXL": 1100,
};

const pricingKeys = Object.keys(pricingDefaultVals);

const PricingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: pricingKeys
    },
    value: { type: Number, required: true, min: 0 }
});

const Pricing = mongoose.model("Pricing", PricingSchema, "pricing");

module.exports = { Pricing, pricingDefaultVals, pricingKeys };