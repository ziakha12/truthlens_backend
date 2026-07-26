const multer = require("multer");
const path = require("path");

// Files are stored temporarily on disk, then read as buffer, sent to Gemini, and deleted.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../temp"));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max, adjust as needed
});

module.exports = upload;
