const express = require("express");
const router = express.Router();
const db = require("../models/db");

// ✅ إرسال طلب انضمام جديد
router.post("/", (req, res) => {
  const { fullName, email, phone, reason } = req.body;

  if (!fullName || !email || !phone || !reason) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة!" });
  }

  db.query(
    "INSERT INTO join_requests (fullName, email, phone, reason) VALUES (?, ?, ?, ?)",
    [fullName, email, phone, reason],
    (err, result) => {
      if (err) {
        console.error("❌ Error sending join request:", err);
        return res.status(500).json({ error: "Error sending join request" });
      }
      res.status(201).json({ message: "✅ تم إرسال الطلب بنجاح!" });
    }
  );
});

module.exports = router;
