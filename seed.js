require("dotenv").config();

const mongoose = require("mongoose");
const Menu = require("./models/Menu");

const menus = [
    {
        name: "Cơm gà",
        price: 55000,
        img: "https://picsum.photos/300/200?1",
        category: "Món chính"
    },
    {
        name: "Mì Quảng",
        price: 45000,
        img: "https://picsum.photos/300/200?2",
        category: "Món chính"
    },
    {
        name: "Bò lúc lắc",
        price: 89000,
        img: "https://picsum.photos/300/200?3",
        category: "Món chính"
    },
    {
        name: "Trà đào",
        price: 30000,
        img: "https://picsum.photos/300/200?4",
        category: "Đồ uống"
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await Menu.deleteMany();

        await Menu.insertMany(menus);

        console.log("✅ Import menu thành công");

        process.exit();

    } catch (err) {

        console.log(err);

        process.exit(1);

    }
}

seed();