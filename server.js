require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const app = express();

// ✅ إعداد الاتصال بقاعدة البيانات
const db = mysql.createPool({
  host: '195.35.59.70',
  user: 'u374874659_enjazi_user',
  password: 'Bad2712!@123',
  database: 'u374874659_enjazi_db',
});

db.getConnection()
  .then(() => console.log("✅ Connected to MySQL Database"))
  .catch((err) => console.error("❌ Database Connection Error:", err));

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ حماية المسارات للأدمن
const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "❌ غير مصرح لك بالدخول!" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.admin = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: "❌ التوكن غير صالح!" });
  }
};

// ✅ تسجيل دخول الأدمن
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "❌ اسم المستخدم وكلمة المرور مطلوبان." });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM admins WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "❌ اسم المستخدم غير صحيح." });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "❌ كلمة المرور غير صحيحة." });
    }

    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    console.error("❌ خطأ في تسجيل الدخول:", err);
    res.status(500).json({ message: "❌ حدث خطأ أثناء تسجيل الدخول." });
  }
});

// ✅ إنشاء أدمن جديد (تشغيل مرة وحدة فقط)
const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("Bad2712!@123", 10);
    await db.execute("INSERT INTO admins (username, password) VALUES (?, ?)", ["admin", hashedPassword]);
    console.log("✅ Admin created successfully!");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
};

// ✅ مسارات الفعاليات
app.get("/api/events", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM events");
    res.json(rows);
  } catch (err) {
    console.error("❌ خطأ في جلب الفعاليات:", err);
    res.status(500).json({ error: "فشل في جلب الفعاليات" });
  }
});

// ✅ مسارات الخدمات
app.get("/api/services", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM services");
    res.json(rows);
  } catch (err) {
    console.error("❌ خطأ في جلب الخدمات:", err);
    res.status(500).json({ error: "فشل في جلب الخدمات" });
  }
});

// ✅ استقبال رسائل التواصل
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: "❌ جميع الحقول مطلوبة!" });
  }

  try {
    await db.execute(
      "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
      [name, email, phone, message]
    );

    res.status(201).json({ message: "✅ تم إرسال رسالتك بنجاح!" });
  } catch (err) {
    console.error("❌ فشل في إرسال الرسالة:", err);
    res.status(500).json({ error: "حدث خطأ أثناء إرسال الرسالة." });
  }
});

// ✅ إضافة طلب انضمام
app.post("/api/joinus", async (req, res) => {
  const { fullName, email, phone, reason } = req.body;

  if (!fullName || !email || !phone || !reason) {
    return res.status(400).json({ error: "❌ جميع الحقول مطلوبة!" });
  }

  try {
    await db.execute(
      "INSERT INTO join_requests (fullName, email, phone, reason, status) VALUES (?, ?, ?, ?, ?)",
      [fullName, email, phone, reason, "Pending"]
    );

    res.status(201).json({ message: "✅ تم إرسال الطلب بنجاح!" });
  } catch (err) {
    console.error("❌ خطأ في إرسال الطلب:", err);
    res.status(500).json({ error: "حدث خطأ أثناء الإرسال." });
  }
});

// ✅ التحقق من حالة الطلب
app.post("/api/check-application", async (req, res) => {
  const { email, phone } = req.body;

  if (!email || !phone) {
    return res.status(400).json({ error: "❌ البريد الإلكتروني ورقم الهاتف مطلوبان." });
  }

  try {
    const [rows] = await db.execute(
      "SELECT status, interview_date FROM join_requests WHERE email = ? AND phone = ?",
      [email, phone]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "❌ لا يوجد طلب بهذا الإيميل أو رقم الهاتف." });
    }

    res.json({
      status: rows[0].status,
      interviewDate: rows[0].interview_date || null,
    });
  } catch (err) {
    console.error("❌ خطأ أثناء التحقق من الطلب:", err);
    res.status(500).json({ error: "❌ حدث خطأ أثناء التحقق من حالة الطلب." });
  }
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
