const express = require("express");
const router = express.Router();
const db = require("../models/db");

// ✅ جلب جميع الخدمات
router.get("/", (req, res) => {
  db.query("SELECT * FROM services", (err, results) => {
    if (err) {
      console.error("❌ Error fetching services:", err);
      return res.status(500).json({ error: "Error fetching services" });
    }
    res.json(results);
  });
});

module.exports = router;
