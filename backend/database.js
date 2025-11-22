const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

const dbPath = process.env.DB_PATH || path.resolve(__dirname, "inventory.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Database Error:", err);
  else console.log("📦 SQLite Connected");
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Create Products Table
db.run(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  unit TEXT,
  category TEXT,
  brand TEXT,
  stock INTEGER DEFAULT 0,
  status TEXT,
  image TEXT
)
`);

// Create Inventory Logs Table
db.run(`
CREATE TABLE IF NOT EXISTS inventory_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productId INTEGER,
  oldStock INTEGER,
  newStock INTEGER,
  changedBy TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(productId) REFERENCES products(id) ON DELETE CASCADE
)
`);

module.exports = db;
