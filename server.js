const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("frontend"));

/* =========================
   USER DATABASE (temporary)
========================= */
let users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "user", password: "1234", role: "user" },
];

/* =========================
   LOGIN
========================= */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) return res.status(401).send("login fail");

  res.json({ role: user.role });
});

/* =========================
   REGISTER
========================= */
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // เช็คว่าซ้ำไหม
  const exist = users.find(u => u.username === username);
  if (exist) return res.send("username already exists");

  // เพิ่ม user ใหม่
  users.push({
    username,
    password,
    role: "user"
  });

  res.send("register success");
});

/* =========================
   UPLOAD FILE
========================= */
const storage = multer.diskStorage({
<<<<<<< HEAD
  destination: (req, file, cb) => {
    // ถ้าไม่มีโฟลเดอร์ uploads ให้สร้าง
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
=======
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, file.originalname),
>>>>>>> 96d2664c4f0c7992d68df42b08d3672606cc8909
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.send("upload success");
});

/* =========================
   LIST FILES
========================= */
app.get("/files", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

/* =========================
   DOWNLOAD
========================= */
app.get("/download/:name", (req, res) => {
  res.download("uploads/" + req.params.name);
});

/* =========================
   DELETE (ADMIN)
========================= */
app.delete("/delete/:name", (req, res) => {
  try {
    fs.unlinkSync("uploads/" + req.params.name);
    res.send("deleted");
  } catch {
    res.send("file not found");
  }
});

/* =========================
   SERVER START
========================= */
app.listen(5000, () => console.log("server run at http://localhost:5000"));
