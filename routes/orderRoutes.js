const express = require("express");

const router = express.Router();

const Order = require("../models/Order");

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

        io.emit("new-order",order);

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

        const order=await Order.findByIdAndUpdate(

            req.params.id,

            {

                status:req.body.status

            },

            {

                new:true

            }

        );

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