const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customer: String,
    table: String,
    items: Array,
    total: Number,

    status: {
        type: String,
        default: "pending"
    },

    date: String,
    time: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", OrderSchema);