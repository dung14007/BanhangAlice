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
