const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary"); // 👈 ensure folder name is "utils"

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "attendance_selfies",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

module.exports = upload;
