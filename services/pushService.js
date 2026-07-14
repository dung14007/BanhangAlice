const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
const configured = Boolean(publicKey && privateKey);

if (configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
    console.warn("Web Push chưa được cấu hình: thiếu VAPID_PUBLIC_KEY hoặc VAPID_PRIVATE_KEY");
}

function getPublicKey() {
    return configured ? publicKey : null;
}

async function sendOrderNotification(order) {
    if (!configured) return { sent: 0, removed: 0 };

    const subscriptions = await PushSubscription.find().lean();
    const payload = JSON.stringify({
        title: "🔔 Có đơn hàng mới",
        body: `Bàn ${order.table || "-"} · ${order.customer || "Khách hàng"}${order.note ? ` · ${order.note}` : ""}`,
        tag: `order-${order._id}`,
        url: "/admin.html"
    });
    let sent = 0;
    const expiredEndpoints = [];

    await Promise.all(subscriptions.map(async subscription => {
        try {
            await webpush.sendNotification({
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime,
                keys: subscription.keys
            }, payload, { TTL: 300, urgency: "high" });
            sent += 1;
        } catch (error) {
            if ([404, 410].includes(error.statusCode)) expiredEndpoints.push(subscription.endpoint);
            else console.error("Không gửi được Web Push:", error.statusCode || error.message);
        }
    }));

    if (expiredEndpoints.length) {
        await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
    }
    return { sent, removed: expiredEndpoints.length };
}

module.exports = { getPublicKey, sendOrderNotification };
