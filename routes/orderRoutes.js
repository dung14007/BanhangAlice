const express = require("express");

const router = express.Router();

const Order = require("../models/Order");
const Menu = require("../models/Menu");
const mongoose = require("mongoose");
const { sendOrderNotification } = require("../services/pushService");

router.get("/", async(req,res)=>{

    try{

        const orders = await Order.find().sort({
            createdAt:-1
        });

        res.json(orders);

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});

router.post("/",async(req,res)=>{

    try{

        const io=req.app.get("io");

        const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
        const itemIds = requestedItems.map(item => item.id).filter(id => mongoose.isValidObjectId(id));

        if (!requestedItems.length || itemIds.length !== requestedItems.length) {
            return res.status(400).json({
                success:false,
                message:"Danh sách món không hợp lệ"
            });
        }

        const menuItems = await Menu.find({ _id: { $in: itemIds } });

        if (menuItems.length !== new Set(itemIds.map(String)).size) {
            return res.status(400).json({
                success:false,
                message:"Có món không còn tồn tại trong thực đơn"
            });
        }

        const unavailableItems = menuItems.filter(item => item.available === false);

        if (unavailableItems.length) {
            return res.status(409).json({
                success:false,
                message:`Món ${unavailableItems.map(item => item.name).join(", ")} hiện đã hết`,
                unavailable:unavailableItems.map(item => String(item._id))
            });
        }

        const now=new Date();

        const order=await Order.create({

            customer:req.body.customer,

            table:req.body.table,

            note:req.body.note,

            items:req.body.items,

            total:req.body.total,

            status:"pending",

            date:now.toLocaleDateString("vi-VN"),

            time:now.toLocaleTimeString("vi-VN"),

            createdAt:now

        });
        
        io.emit("newOrder", {
            message:"Có đơn hàng mới",
            order
        });

        sendOrderNotification(order).catch(pushError => {
            console.error("Lỗi gửi thông báo đơn mới:", pushError.message);
        });

        res.json({

            success:true,

            order

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

router.put("/:id/status",async(req,res)=>{

    try{

        const io=req.app.get("io");

        const previousStatus = {
            processing: "pending",
            completed: "processing",
            paid: "completed",
            cancelled: "pending"
        }[req.body.status];

        if (!previousStatus) {
            return res.status(400).json({
                success:false,
                message:"Trạng thái đơn hàng không hợp lệ"
            });
        }

        const update = { status: req.body.status };
        if (req.body.status === "cancelled") update.cancelledAt = new Date();

        const order=await Order.findOneAndUpdate(
            { _id: req.params.id, status: previousStatus },
            update,
            { new:true }
        );

        if (!order) {
            return res.status(409).json({
                success:false,
                message:"Đơn đã thay đổi trạng thái, vui lòng tải lại"
            });
        }

        io.emit("order-status",order);

        res.json({

            success:true,

            order

        });

    }catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

});

// Khách hủy đơn khi nhà hàng chưa xác nhận
router.patch("/:id/cancel", async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            {
                _id: req.params.id,
                customer: req.body.customer,
                table: req.body.table,
                status: "pending"
            },
            {
                status: "cancelled",
                cancelledAt: new Date()
            },
            { new: true }
        );

        if (!order) {
            return res.status(409).json({
                success: false,
                message: "Đơn đã được xác nhận hoặc không còn có thể hủy"
            });
        }

        req.app.get("io").emit("order-status", order);
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin lưu trữ hoặc khôi phục đơn
router.patch("/:id/archive", async (req, res) => {
    try {
        if (typeof req.body.archived !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Trạng thái lưu trữ không hợp lệ"
            });
        }

        const currentOrder = await Order.findById(req.params.id);
        if (!currentOrder) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }

        if (req.body.archived && !["paid", "cancelled"].includes(currentOrder.status)) {
            return res.status(409).json({
                success: false,
                message: "Chỉ có thể lưu trữ đơn đã thanh toán hoặc đã hủy"
            });
        }

        currentOrder.archived = req.body.archived;
        currentOrder.archivedAt = req.body.archived ? new Date() : null;
        await currentOrder.save();

        req.app.get("io").emit("order-status", currentOrder);
        res.json({ success: true, order: currentOrder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/latest/:table/:customer",async(req,res)=>{

    const order=await Order.findOne({

        table:req.params.table,

        customer:req.params.customer

    }).sort({

        createdAt:-1

    });

    res.json(order);

});

module.exports=router;
