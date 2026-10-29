
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Schema món ăn
const foodSchema = new mongoose.Schema(
  {
    foodId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true, trim: true },
    ingredients: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

const Food = mongoose.model("Food", foodSchema);

// Kiểm tra trạng thái API
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Food API is running"
  });
});

// Lấy danh sách và tìm kiếm món ăn
app.get("/api/foods", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { foodId: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { cuisine: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const foods = await Food.find(filter).sort({ createdAt: -1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách món ăn" });
  }
});

// Xem chi tiết món ăn
app.get("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }

    res.json(food);
  } catch (error) {
    res.status(400).json({ message: "ID món ăn không hợp lệ" });
  }
});

// Kiểm tra dữ liệu đầu vào
function validateFood(data) {
  const requiredStrings = [
    "foodId",
    "name",
    "category",
    "cuisine"
  ];

  for (const field of requiredStrings) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      return `Trường ${field} không được để trống`;
    }
  }

  for (const field of ["price", "quantity"]) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === "" ||
      !Number.isFinite(Number(data[field])) ||
      Number(data[field]) < 0
    ) {
      return `${field} phải là số không âm`;
    }
  }

  if (
    data.ingredients !== undefined &&
    (!Array.isArray(data.ingredients) ||
      !data.ingredients.every(item => typeof item === "string"))
  ) {
    return "ingredients phải là một mảng chuỗi";
  }

  return null;
}

// Thêm món ăn
app.post("/api/foods", async (req, res) => {
  try {
    const validationError = validateFood(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = {
      ...req.body,
      foodId: req.body.foodId.trim(),
      name: req.body.name.trim(),
      category: req.body.category.trim(),
      cuisine: req.body.cuisine.trim(),
      price: Number(req.body.price),
      quantity: Number(req.body.quantity)
    };

    const food = await Food.create(data);
    res.status(201).json(food);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "foodId đã tồn tại" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Lỗi thêm món ăn" });
  }
});

// Cập nhật món ăn
app.put("/api/foods/:id", async (req, res) => {
  try {
    const validationError = validateFood(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = {
      ...req.body,
      foodId: req.body.foodId.trim(),
      name: req.body.name.trim(),
      category: req.body.category.trim(),
      cuisine: req.body.cuisine.trim(),
      price: Number(req.body.price),
      quantity: Number(req.body.quantity)
    };

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }

    res.json(food);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "foodId đã tồn tại" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(400).json({ message: "Không thể cập nhật món ăn" });
  }
});

// Xóa món ăn
app.delete("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }

    res.json({ message: "Xóa món ăn thành công", food });
  } catch (error) {
    res.status(400).json({ message: "ID món ăn không hợp lệ" });
  }
});

// Kết nối MongoDB rồi mới mở server
async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error("Thiếu biến môi trường MONGODB_URI trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas kết nối thành công!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend đang chạy tại cổng ${PORT}`);
    });
  } catch (error) {
    console.error("Không thể kết nối MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
