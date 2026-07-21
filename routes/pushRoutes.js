const express = require("express");
const PushSubscription = require("../models/PushSubscription");
const { getPublicKey } = require("../services/pushService");

const router = express.Router();

router.get("/public-key", (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    const publicKey = getPublicKey();
    if (!publicKey) return res.status(503).json({ success: false, message: "Web Push chưa được cấu hình trên server" });
    res.json({ success: true, publicKey });
});

router.post("/subscribe", async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ success: false, message: "Thông tin đăng ký thông báo không hợp lệ" });
        }
        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime || null,
                keys: subscription.keys,
                userAgent: req.get("user-agent") || ""
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete("/subscribe", async (req, res) => {
    try {
        if (req.body?.endpoint) await PushSubscription.deleteOne({ endpoint: req.body.endpoint });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
