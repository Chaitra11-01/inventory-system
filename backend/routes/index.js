const express = require("express");
const router = express.Router();

// Import routers
const productsRouter = require("./products");

// Mount routers
router.use("/products", productsRouter);

// Optional: Test route for API
router.get("/", (req, res) => {
  res.json({ message: "API is working" });
});

module.exports = router;
