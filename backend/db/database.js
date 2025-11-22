const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./inventory.db", (err) => {
  if (err) {
    console.error("❌ Database Error:", err);
  } else {
    console.log("📦 SQLite Connected");
  }
});

module.exports = db;
