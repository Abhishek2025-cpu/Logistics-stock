



const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ensure 'uploads/' directory exists
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Accept ALL file fields, including dynamic ones like reviewProfile_0
const upload = multer({
  storage,
limits: { fileSize: 25 * 1024 * 1024 } // 25MB

}).any(); // Accept any file field

module.exports = upload;
