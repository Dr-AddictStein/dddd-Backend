import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";



dotenv.config();

// Create Express App
const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"], // Allow only your frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    credentials: true, // If you use cookies or authentication
  })
);
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Static File Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/file", fileRoutes);
app.use("/api/user", userRoutes);


// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Successfully connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on PORT: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });
