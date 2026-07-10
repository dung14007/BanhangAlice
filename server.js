const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
app.use(express.json());
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Backend Order System đang chạy 🚀");
});
app.get("/api/orders", (req, res) => {
    const filePath = path.join(__dirname, "data", "orders.json");

    const orders = JSON.parse(fs.readFileSync(filePath, "utf8"));

    res.json(orders);
});
app.post("/api/orders", (req, res) => {

    const order = req.body;

    const filePath = path.join(__dirname, "data", "orders.json");
    const orders = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const now = new Date();

    order.id = Date.now();

    order.createdAt = now.toISOString();

    order.date = now.toLocaleDateString("vi-VN");

    order.time = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    order.status = "pending";

    orders.push(order);

    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));

    io.emit("new-order", order);

    res.json({
        success: true,
        message: "Đặt món thành công",
        order
    });

});
app.put("/api/orders/:id/status", (req, res) => {

    const filePath = path.join(__dirname, "data", "orders.json");

    const orders = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const order = orders.find(o => o.id == req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy đơn"
        });
    }

    order.status = req.body.status;

    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));

    io.emit("order-status", order);

    res.json({
        success: true,
        order
    });

});
app.get("/api/orders/latest/:table/:customer", (req, res) => {

    const filePath = path.join(__dirname, "data", "orders.json");

    const orders = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const order = [...orders].reverse().find(o =>
        o.table == req.params.table &&
        o.customer == req.params.customer
    );

    if (!order) {
        return res.json(null);
    }

    res.json(order);

});
app.get("/api/menu", (req, res) => {
    const filePath = path.join(__dirname, "data", "menu.json");

    const menu = JSON.parse(fs.readFileSync(filePath, "utf8"));

    res.json(menu);
});
io.on("connection", (socket) => {
    console.log("📱 Admin kết nối:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Admin ngắt kết nối");
    });
});
server.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
