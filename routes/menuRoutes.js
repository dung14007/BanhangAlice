const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Menu = require("../models/Menu");

// Lấy danh sách món
router.get("/", async (req, res) => {

    const foods = await Menu.find().sort({
        category: 1,
        name: 1
    });

    res.json(foods);

});

// Thêm món
router.post("/", upload.single("image"), async(req,res)=>{

    const food = await Menu.create({

        name:req.body.name || req.body.title || req.body.foodName,

        price:req.body.price,

        category:req.body.category,

        img:"/uploads/"+req.file.filename

    });

    res.json({

        success:true,

        food

    });

});

// Sửa món
router.put("/:id", upload.single("image"), async(req,res)=>{

    const update={

        name:req.body.name,

        price:req.body.price,

        category:req.body.category

    };

    if(req.file){

        update.img="/uploads/"+req.file.filename;

    }

    const food=await Menu.findByIdAndUpdate(

        req.params.id,

        update,

        {

            new:true

        }

    );

    res.json({

        success:true,

        food

    });

});

// Bật/tắt trạng thái còn món
router.patch("/:id/availability", async (req, res) => {
    try {
        if (typeof req.body.available !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Trạng thái món không hợp lệ"
            });
        }

        const food = await Menu.findByIdAndUpdate(
            req.params.id,
            { available: req.body.available },
            { new: true }
        );

        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy món ăn"
            });
        }

        res.json({ success: true, food });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Xóa món
router.delete("/:id", async (req, res) => {

    await Menu.findByIdAndDelete(req.params.id);

    res.json({
        success: true
    });

});

module.exports = router;
