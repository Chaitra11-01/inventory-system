require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./database");
const productRoutes = require("./routes/products");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // replaces body-parser

// Routes
app.use("/api/products", productRoutes);

// Optional test route
app.get("/api", (req, res) => res.json({ message: "API is running" }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
