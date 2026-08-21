const multer               = require("multer");
const path                 = require("path");
const { uploadToImageKit } = require("../config/imagekit");

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
  const ext     = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Only JPG, PNG, and PDF files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload, uploadToImageKit: (file) =>
  uploadToImageKit(file.buffer, file.originalname)
};
