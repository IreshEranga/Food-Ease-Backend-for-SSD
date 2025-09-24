// const multer = require('multer');
// const path = require('path');

// // Configure storage for temporary file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// // File filter to allow only images and PDFs
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
//   }
// };

// // Configure multer
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter,
// });

// module.exports = upload;

const multer = require('multer');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const fs = require('fs').promises;

// Configure storage for temporary file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Ensure the uploads directory exists
      await fs.mkdir('uploads/', { recursive: true });
      cb(null, 'uploads/');
    } catch (error) {
      cb(new Error('Failed to set up upload directory'), false);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to allow only images and PDFs based on MIME type and content
const fileFilter = async (req, file, cb) => {
  try {
    // Initial MIME type check
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
    }

    // Read the file buffer to validate content
    const buffer = await new Promise((resolve, reject) => {
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('end', () => resolve(Buffer.concat(chunks)));
      file.stream.on('error', reject);
    });

    // Validate file content using file-type
    const fileType = await fileTypeFromBuffer(buffer);
    const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!fileType || !allowedExts.includes(fileType.ext)) {
      return cb(new Error('File content does not match allowed types (JPEG, PNG, PDF)'), false);
    }

    // Ensure MIME type matches file content
    if (fileType.mime !== file.mimetype) {
      return cb(new Error('MIME type does not match file content'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(new Error('Error validating file type'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

module.exports = upload;