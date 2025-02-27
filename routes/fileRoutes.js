import express from 'express';

import path from 'path';
import multer from 'multer';


const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads"); // Make sure the uploads folder exists
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage: storage });

// POST route to handle file upload
router.post("/upload", upload.single("file"), (req, res) => {
    try {
      // Return the file path after a successful upload
      const filePath = `${req.protocol}s://${req.get("host")}/uploads/${req.file.filename}`;
      res.status(200).json({ filePath });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

export default router;

