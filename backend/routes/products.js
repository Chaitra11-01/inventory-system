const express = require("express");
const router = express.Router();
const db = require("../db/database");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

// ---------- MULTER setup for CSV upload ----------
const upload = multer({ dest: "uploads/" });

// ---------- GET all products ----------
router.get("/", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ---------- GET search products ----------
router.get("/search", (req, res) => {
  const { name } = req.query;
  db.all(
    "SELECT * FROM products WHERE LOWER(name) LIKE ?",
    [`%${name.toLowerCase()}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ---------- POST add new product ----------
router.post("/", (req, res) => {
  const { name, unit, category, brand, stock, image } = req.body;
  const status = stock > 0 ? "In Stock" : "Out of Stock";

  const sql = `INSERT INTO products (name, unit, category, brand, stock, status, image)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [name, unit, category, brand, stock, status, image], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, unit, category, brand, stock, status, image });
  });
});

// ---------- PUT update product ----------
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { name, unit, category, brand, stock, image } = req.body;
  const status = stock > 0 ? "In Stock" : "Out of Stock";

  // Get old stock for inventory logs
  db.get("SELECT stock FROM products WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const oldStock = row ? row.stock : 0;

    const sql = `UPDATE products
                 SET name=?, unit=?, category=?, brand=?, stock=?, status=?, image=?
                 WHERE id=?`;

    db.run(sql, [name, unit, category, brand, stock, status, image, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Log inventory change if stock changed
      if (oldStock !== stock) {
        const logSql = `INSERT INTO inventory_logs (productId, oldStock, newStock, changedBy)
                        VALUES (?, ?, ?, ?)`;
        db.run(logSql, [id, oldStock, stock, "admin"]); // You can replace "admin" with dynamic user
      }

      res.json({ id, name, unit, category, brand, stock, status, image });
    });
  });
});

// ---------- DELETE product ----------
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM products WHERE id = ?";
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Product deleted", deletedId: id });
  });
});

// ---------- GET inventory history ----------
router.get("/:id/history", (req, res) => {
  const id = req.params.id;
  db.all(
    "SELECT * FROM inventory_logs WHERE productId = ? ORDER BY timestamp DESC",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ---------- POST import CSV ----------
router.post("/import", upload.single("file"), (req, res) => {
  const fileRows = [];
  const duplicates = [];
  let added = 0;
  let skipped = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => fileRows.push(row))
    .on("end", () => {
      fs.unlinkSync(req.file.path); // remove temp file

      fileRows.forEach((r) => {
        const { name, unit, category, brand, stock, status, image } = r;
        db.get("SELECT * FROM products WHERE LOWER(name) = ?", [name.toLowerCase()], (err, existing) => {
          if (existing) {
            duplicates.push({ name, existingId: existing.id });
            skipped++;
          } else {
            const sql = `INSERT INTO products (name, unit, category, brand, stock, status, image)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(sql, [name, unit, category, brand, stock || 0, status || "In Stock", image]);
            added++;
          }
        });
      });

      setTimeout(() => {
        res.json({ added, skipped, duplicates });
      }, 500); // small delay to ensure all inserts finish
    });
});
// ---------- GET export CSV ----------
router.get("/export", (req, res) => {
  const sql = "SELECT * FROM products";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Build CSV string
    let csvData = "name,unit,category,brand,stock,status,image\n";
    rows.forEach((r) => {
      csvData += `${r.name},${r.unit},${r.category},${r.brand},${r.stock},${r.status},${r.image}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");
    res.send(csvData);
  });
});

// ---------- GET export CSV ----------
router.get("/export", (req, res) => {
  const sql = "SELECT * FROM products";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let csvData = "name,unit,category,brand,stock,status,image\n";
    rows.forEach((r) => {
      csvData += `${r.name},${r.unit},${r.category},${r.brand},${r.stock},${r.status},${r.image}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");
    res.send(csvData);
  });
});

module.exports = router;
