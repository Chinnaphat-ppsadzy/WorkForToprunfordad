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

const usersFile = "user.json";

const users = JSON.parse(fs.readFileSync(usersFile));

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

let currentUser = null;
let currentRole = null;

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) return res.status(401).send("login fail");

  currentUser = user.username;
  currentRole = user.role;
  res.json({ role: user.role });
});

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

app.post("/upload", upload.single("file"), (req, res) => {
  res.send("upload success");
});

app.get("/files", (req, res) => {
  if (!currentUser) return res.json([]);

  const search = req.query.search?.toLowerCase() || "";
  const user = users.find((u) => u.username === currentUser);

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

app.get(/^\/download\/(.+)/, (req, res) => {
  if (!currentUser) return res.send("not login");

  const fileParam = req.params[0];

  let filePath;
  if (currentRole === "admin") {
    filePath = `uploads/${fileParam}`;
  } else {
    filePath = `uploads/${currentUser}/${fileParam}`;
  }

  res.download(filePath);
});

app.delete(/^\/delete\/(.+)/, (req, res) => {
  if (!currentUser) return res.send("not login");

  try {
    const fileParam = req.params[0];

    let filePath;
    if (currentRole === "admin") {
      filePath = `uploads/${fileParam}`;
    } else {
      filePath = `uploads/${currentUser}/${fileParam}`;
    }

    fs.unlinkSync(filePath);
    res.send("deleted");
  } catch {
    res.send("file not found");
  }
});

app.get("/users", (req, res) => {
  if (!currentUser) return res.json([]);

  const allUser = users
    .filter((u) => u.username !== currentUser && u.role !== "admin")
    .map((u) => u.username);

  res.json(allUser);
});

app.post("/share", (req, res) => {
  if (!currentUser) return res.send("not login");

  const { fileName, targetUser } = req.body;
  try {
    const sourceFile = `uploads/${currentUser}/${fileName}`;
    const targetFolder = `uploads/${targetUser}`;

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const targetFile = `${targetFolder}/${fileName}`;
    fs.copyFileSync(sourceFile, targetFile);
    res.send("file shared successfully");
  } catch (err) {
    res.send("failed to share file");
  }
});

app.listen(5000, () => console.log("server run at http://localhost:5000"));
