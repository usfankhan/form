require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/** Middlewares */
app.use(cors());
app.use(express.json());           // parse JSON bodies
app.use(express.static("public")); // serve the form

/** Connect to MongoDB */
mongoose
  .connect(process.env.MONGO_URI, { dbName: "formDB" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/** Define a schema with validation + timestamps */
const formSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], minlength: 3 },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/\S+@\S+\.\S+/, "Invalid email"],
      lowercase: true,
      trim: true,
    },
    message: { type: String, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

/** Create a model (collection = forms) */
const Form = mongoose.model("Form", formSchema);

/** Routes */
// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Create (store form)
app.post("/api/forms", async (req, res) => {
  try {
    const doc = await Form.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// (Optional) List forms
app.get("/api/forms", async (_req, res) => {
  const docs = await Form.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: docs });
});

/** Start server */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`));
