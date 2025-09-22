const multer = require("multer");
const { storage } = require("../../config/uploadConfig");

const upload = multer({ storage });

module.exports = upload;
