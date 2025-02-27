const express = require("express");
const router = express.Router();
const db = require("../models/db");

// ✅ جلب جميع الفعاليات
router.get("/", (req, res) => {
  db.query("SELECT * FROM events", (err, results) => {
    if (err) {
      console.error("❌ Error fetching events:", err);
      return res.status(500).json({ error: "Error fetching events" });
    }
    res.json(results);
  });
});

module.exports = router;
