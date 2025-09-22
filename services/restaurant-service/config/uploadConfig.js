// File: config/uploadConfig.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = "restaurant_uploads";
    let allowed_formats = ["jpg", "jpeg", "png"];

    if (file.fieldname === "licenseFile") {
      folder = "restaurant_licenses";
      allowed_formats = ["jpg", "jpeg", "png", "pdf"];
    } else if (file.fieldname === "restaurantImage") {
      folder = "restaurant_menu_images";
    }

    return {
      folder,
      allowed_formats,
      public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};