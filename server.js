const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("frontend"));

const users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "user", password: "1234", role: "user" }
];

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) return res.status(401).send("login fail");

  res.json({ role: user.role });
});

// upload file
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.send("upload success");
});

// list files
app.get("/files", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    res.json(files);
  });
});

// download
app.get("/download/:name", (req, res) => {
  res.download("uploads/" + req.params.name);
});

// delete
app.delete("/delete/:name", (req, res) => {
  fs.unlinkSync("uploads/" + req.params.name);
  res.send("deleted");
});

app.listen(3000, () => console.log("server run"));
