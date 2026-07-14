self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
    event.waitUntil(clients.claim());
});

self.addEventListener("push", event => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { body: event.data?.text() || "Bạn có đơn hàng mới." };
    }

    event.waitUntil(self.registration.showNotification(data.title || "🔔 Có đơn hàng mới", {
        body: data.body || "Mở ứng dụng để xem đơn hàng.",
        icon: "/admin-icon.svg",
        badge: "/admin-icon.svg",
        tag: data.tag || "new-order",
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: data.url || "/admin.html" }
    }));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/admin.html";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
            const adminClient = windowClients.find(client => new URL(client.url).pathname === "/admin.html");
            if (adminClient) return adminClient.focus();
            return clients.openWindow(targetUrl);
        })
    );
});
