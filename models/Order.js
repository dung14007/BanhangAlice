const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customer: String,
    table: String,
    note: {
        type: String,
        default: "",
        trim: true
    },
    items: Array,
    total: Number,

    status: {
        type: String,
        default: "pending"
    },

    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    cancelledAt: Date,

    date: String,
    time: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", OrderSchema);
