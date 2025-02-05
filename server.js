require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cloudinary = require("./utils/cloudinary");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

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
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const result = cloudinary.uploader.upload_stream(
    {
      public_id: `image_${Date.now()}`, // Unique ID for each image
      resource_type: "auto", // Auto-detects type
      folder: "user_uploads", // Change to desired folder name
    },
    async (error, result) => {
      if (error) {
        console.error("Error uploading image:", error);
        return res.status(500).json({ error: "Upload failed" });
      }

      try {
        await axios.post(JSON_SERVER_URL, {
          name: result.original_filename, // `display_name` doesn't exist, using `original_filename`
          url: result.secure_url,
        });

        console.log("Saved to JSON server");
        res.redirect("/");
      } catch (jsonError) {
        console.error("Error saving to JSON server:", jsonError);
        res.status(500).json({ error: "Failed to save to JSON server" });
      }
    }
  );

  result.end(req.file.buffer);
  
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
