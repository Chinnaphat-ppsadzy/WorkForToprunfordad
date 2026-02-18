const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("frontend"));

/* =========================
   USER DATABASE 
========================= */
const usersFile = "user.json";

const users = JSON.parse(fs.readFileSync(usersFile));

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// จำ user ที่ login
let currentUser = null;

/* =========================
   LOGIN
========================= */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) return res.status(401).send("login fail");

  currentUser = user.username;
  res.json({ role: user.role });
});

/* =========================
   REGISTER
========================= */
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const exist = users.find((u) => u.username === username);
  if (exist) return res.send("username already exists");

  users.push({
    username,
    password,
    role: "user",
  });

  saveUsers(users);

  const userFolder = `uploads/${username}`;
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
  }

  res.send("register success");
});

/* =========================
   STORAGE CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!currentUser) return cb(new Error("not login"));

    const userFolder = `uploads/${currentUser}`;
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

/* =========================
   UPLOAD FILE
========================= */
app.post("/upload", upload.single("file"), (req, res) => {
  res.send("upload success");
});

/* =========================
   LIST FILES (เฉพาะ user)
========================= */
app.get("/files", (req, res) => {
  if (!currentUser) return res.json([]);
  const user = users.find((u) => u.username === currentUser);

  // ถ้าเป็น admin
  if (user.role === "admin") {
    const allFiles = [];

    fs.readdirSync("uploads").forEach((folder) => {
      const folderPath = `uploads/${folder}`;
      const files = fs.readdirSync(folderPath);

      files.forEach((file) => {
        allFiles.push(`${folder}/${file}`);
      });
    });

    return res.json(allFiles);
  }

  const userFolder = `uploads/${currentUser}`;

  fs.readdir(userFolder, (err, files) => {
    if (err) return res.json([]);
    res.json(files);
  });
});

/* =========================
   DOWNLOAD
========================= */
app.get("/download/:name", (req, res) => {
  if (!currentUser) return res.send("not login");

  const filePath = `uploads/${currentUser}/${req.params.name}`;
  res.download(filePath);
});

/* =========================
   DELETE FILE
========================= */
app.delete("/delete/:name", (req, res) => {
  if (!currentUser) return res.send("not login");

  try {
    fs.unlinkSync(`uploads/${currentUser}/${req.params.name}`);
    res.send("deleted");
  } catch {
    res.send("file not found");
  }
});

/* =========================
   SERVER START
========================= */
app.listen(5000, () => console.log("server run at http://localhost:5000"));
