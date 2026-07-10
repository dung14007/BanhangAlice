const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

app.use(express.json());

app.use(express.static("public"));

app.set("io", io);

app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));

io.on("connection", socket => {

    console.log("📱 Client:", socket.id);

    socket.on("disconnect", () => {

        console.log("❌ Disconnect");

    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("Server running: http://localhost:"+PORT);
    
});