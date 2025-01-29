require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Setup (for handling file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// JSON Server API URL
const JSON_SERVER_URL = "http://localhost:3001/images";

// Home Route - Show List of Uploaded Images
app.get("/", async (req, res) => {
  try {
    const response = await axios.get(JSON_SERVER_URL);
    const images = response.data;
    res.render("index", { images });
  } catch (error) {
    res.render("index", { images: [] });
  }
});

// Upload Form Route (GET)
app.get("/upload", (req, res) => {
  res.render("upload");
});

// Handle Image Upload (POST)
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.redirect("/");

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "uploads" },
        (error, result) => (error ? reject(error) : resolve(result))
      ).end(req.file.buffer);
    });

    // Save image data to json-server
    await axios.post(JSON_SERVER_URL, {
      name: req.file.originalname,
      url: result.secure_url,
    });

    res.redirect("/");
  } catch (error) {
    res.status(500).send("Error uploading image");
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
