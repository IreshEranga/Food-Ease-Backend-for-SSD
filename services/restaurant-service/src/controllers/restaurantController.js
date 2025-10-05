const Restaurant = require("../models/Restaurant");
const Menu = require("../models/Menu");
const Category = require("../models/Category");
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper to escape regex special characters
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Validation functions
const isValidImage = (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 10) return false;

    // JPEG validation
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;

    // PNG validation
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;

    return false;
  } catch (error) {
    console.error("Error validating image:", error);
    return false;
  }
};

const isValidLicense = (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);

    // Check minimum file size
    if (buffer.length < 8) {
      return { valid: false, message: "License file is too small or corrupted." };
    }

    // CRITICAL: Verify PDF magic bytes (header signature)
    // A real PDF MUST start with %PDF- (hex: 25 50 44 46 2D)
    if (!(buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2D)) {
      console.error("⚠️ SECURITY ALERT: File does not have valid PDF magic bytes!");
      return { 
        valid: false, 
        message: "Invalid PDF file. The file header does not match PDF specifications. Only genuine PDF documents are allowed." 
      };
    }

    // Verify PDF version (should be 1.0 to 2.0)
    const versionString = buffer.toString('ascii', 0, 10);
    if (!versionString.match(/%PDF-[12]\.\d/)) {
      console.error("⚠️ SECURITY ALERT: Invalid PDF version detected!");
      return {
        valid: false,
        message: "Invalid PDF version. Only standard PDF versions (1.0-2.0) are accepted."
      };
    }

    // Check for PDF EOF marker (should end with %%EOF)
    const lastBytes = buffer.slice(-50).toString('ascii', 'replace');
    if (!lastBytes.includes('%%EOF')) {
      console.error("⚠️ SECURITY ALERT: PDF file missing EOF marker!");
      return {
        valid: false,
        message: "Corrupted or invalid PDF file. Missing end-of-file marker."
      };
    }

    // Convert buffer to string for comprehensive script detection
    const textContent = buffer.toString('utf8');
    const binaryContent = buffer.toString('binary');

    // Comprehensive script detection patterns
    const scriptPatterns = [
      { pattern: /\/JavaScript\s*[<\(]/i, name: "JavaScript code" },
      { pattern: /\/JS\s*[<\(]/i, name: "JS code" },
      { pattern: /<script[\s>]/i, name: "script tags" },
      { pattern: /<\/script>/i, name: "script closing tags" },
      { pattern: /app\.alert\s*\(/i, name: "alert commands" },
      { pattern: /this\.submitForm\s*\(/i, name: "form submission code" },
      { pattern: /eval\s*\(/i, name: "eval functions" },
      { pattern: /\/OpenAction/i, name: "auto-execute actions" },
      { pattern: /\/AA\s*<</i, name: "additional actions" },
      { pattern: /\/Launch/i, name: "launch commands" },
      { pattern: /\/SubmitForm/i, name: "form submission" },
      { pattern: /\/ImportData/i, name: "data import commands" },
      { pattern: /\/URI\s*\(/i, name: "URI actions" },
      { pattern: /\/GoToR/i, name: "remote navigation" },
      { pattern: /\/EmbeddedFile/i, name: "embedded files" },
      { pattern: /\.execCommand\s*\(/i, name: "execution commands" },
      { pattern: /document\.write\s*\(/i, name: "document write" },
      { pattern: /window\.open\s*\(/i, name: "window open" },
      { pattern: /onclick\s*=/i, name: "click handlers" },
      { pattern: /onerror\s*=/i, name: "error handlers" },
      { pattern: /onload\s*=/i, name: "load handlers" },
      { pattern: /javascript:/i, name: "javascript protocol" },
      { pattern: /vbscript:/i, name: "vbscript protocol" },
      { pattern: /<iframe/i, name: "iframe elements" },
      { pattern: /cmd\.exe/i, name: "command prompt references" },
      { pattern: /powershell/i, name: "PowerShell references" },
      { pattern: /\/bin\/(ba)?sh/i, name: "shell references" },
      { pattern: /system\s*\(/i, name: "system calls" },
      { pattern: /exec\s*\(/i, name: "exec functions" },
      { pattern: /passthru\s*\(/i, name: "passthru functions" },
      { pattern: /shell_exec/i, name: "shell execution" },
      { pattern: /<\?php/i, name: "PHP code" },
      { pattern: /<%[\s\S]*?%>/i, name: "server-side code" },
    ];

    // Check each pattern
    for (const { pattern, name } of scriptPatterns) {
      if (pattern.test(textContent) || pattern.test(binaryContent)) {
        console.error(`⚠️ SECURITY ALERT: License file contains ${name}!`);
        return { 
          valid: false, 
          message: `License file rejected: Contains suspicious ${name}. PDF files with scripts are not allowed for security reasons.` 
        };
      }
    }

    // Additional check for suspicious keywords
    const suspiciousKeywords = [
      'alert(', 'confirm(', 'prompt(', 'Function(', 
      'setTimeout', 'setInterval', 'XMLHttpRequest',
      'fetch(', 'axios', 'jquery', '$ajax'
    ];

    for (const keyword of suspiciousKeywords) {
      if (textContent.includes(keyword)) {
        console.error(`⚠️ SECURITY ALERT: License file contains suspicious keyword: ${keyword}`);
        return { 
          valid: false, 
          message: `License file rejected: Contains suspicious code patterns (${keyword}). Only clean PDF documents are allowed.` 
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating license file:", error);
    return { valid: false, message: "Error validating license file." };
  }
};

// Helper function to delete uploaded files
const deleteUploadedFiles = (files) => {
  try {
    Object.values(files).forEach(fileArray => {
      if (Array.isArray(fileArray)) {
        fileArray.forEach(file => {
          if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    });
  } catch (err) {
    console.error("Error deleting files:", err);
  }
};

// Create a new restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const {
      restaurantName,
      branchName,
      address,
      status,
      owner,
      cuisineType,
      operatingHours,
    } = req.body;

    // Validate required fields
    if (!restaurantName || !branchName || !address || !owner || !cuisineType || !operatingHours) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Validate owner ID early
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ message: "Invalid owner ID format. Must be a valid MongoDB ObjectId." });
    }

    // Extract files from req.files
    const licenseFile = req.files?.licenseFile?.[0];
    const restaurantImage = req.files?.restaurantImage?.[0];

    if (!licenseFile || !restaurantImage) {
      return res.status(400).json({ message: "Both licenseFile and restaurantImage are required." });
    }

    // CRITICAL: Check file extension first (prevent file upload bypass)
    const licenseFileExt = path.extname(licenseFile.originalname).toLowerCase();
    if (licenseFileExt !== '.pdf') {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ 
        message: "License file must have .pdf extension. File rejected for security reasons." 
      });
    }

    // Check MIME type - MUST be PDF
    if (licenseFile.mimetype !== 'application/pdf') {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ 
        message: "License file must be a PDF document (application/pdf). Other file types are not accepted." 
      });
    }

    // Validate license file content (magic bytes and scripts)
    const licenseValidation = isValidLicense(licenseFile.path);
    if (!licenseValidation.valid) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ message: licenseValidation.message });
    }

    // Validate restaurant image
    const imageFileExt = path.extname(restaurantImage.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(imageFileExt)) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ 
        message: "Restaurant image must be JPG, JPEG, or PNG format." 
      });
    }

    if (!isValidImage(restaurantImage.path)) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ message: "Invalid restaurant image: Invalid image format or corrupted file." });
    }

    // Safely parse JSON fields
    let parsedAddress, parsedCuisineType, parsedOperatingHours;
    try {
      parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
      parsedCuisineType = typeof cuisineType === "string" ? JSON.parse(cuisineType) : cuisineType;
      parsedOperatingHours = typeof operatingHours === "string" ? JSON.parse(operatingHours) : operatingHours;
    } catch (parseError) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ 
        message: "Invalid JSON format in address, cuisineType, or operatingHours.", 
        error: parseError.message 
      });
    }

    // Validate parsed data
    if (!parsedAddress.fullAddress || !parsedAddress.coordinates?.lat || !parsedAddress.coordinates?.lng) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ message: "Invalid address format." });
    }
    if (!Array.isArray(parsedCuisineType) || parsedCuisineType.length === 0) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ message: "Cuisine type must be a non-empty array." });
    }
    if (Object.keys(parsedOperatingHours).length === 0) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ message: "Operating hours must be provided." });
    }

    // Create new restaurant
    const newRestaurant = new Restaurant({
      restaurantName,
      branchName,
      address: parsedAddress,
      status: status || "close",
      owner: new mongoose.Types.ObjectId(owner),
      cuisineType: parsedCuisineType,
      operatingHours: parsedOperatingHours,
      licenseFile: licenseFile.path,
      restaurantImage: restaurantImage.path,
    });

    // Save to database
    const savedRestaurant = await newRestaurant.save();

    // Post-save logic for updating menus (isolated in try-catch)
    try {
      const existingRestaurants = await Restaurant.find({
        restaurantName: { $regex: `^${escapeRegex(restaurantName)}$`, $options: 'i' },
        owner: new mongoose.Types.ObjectId(owner),
        _id: { $ne: savedRestaurant._id }
      });

      if (existingRestaurants.length > 0) {
        const existingMenus = await Menu.find({
          restaurants: { $in: existingRestaurants.map(r => r._id) },
          owner: new mongoose.Types.ObjectId(owner)
        });

        await Promise.all(existingMenus.map(async (menu) => {
          if (!menu.restaurants.includes(savedRestaurant._id)) {
            menu.restaurants.push(savedRestaurant._id);
            await menu.save();
          }
        }));
      }
    } catch (postSaveError) {
      console.error("Post-save menu update error:", postSaveError);
      // Optionally rollback: await Restaurant.deleteOne({ _id: savedRestaurant._id });
      // But for now, just log - restaurant is still created
    }

    res.status(201).json({
      message: "Restaurant created successfully. License file validated and secure.",
      data: savedRestaurant,
      licenseFileUrl: licenseFile.path,
      restaurantImageUrl: restaurantImage.path,
    });
  } catch (error) {
    console.error("Error in createRestaurant:", error);

    // Cleanup files on error
    if (req.files) {
      deleteUploadedFiles(req.files);
    }

    // In dev, include stack; in prod, generic
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      message: "Error creating restaurant",
      ...(isDev && { error: error.message, stack: error.stack }),
    });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { restaurantID } = req.params;
    const restaurant = await Restaurant.findOne({ restaurantId: restaurantID });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurant", error: error.message });
  }
};

exports.getRestaurantFromid = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid restaurant ID' });
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurant', error: error.message });
  }
};

// Get all restaurants for a specific owner
exports.getRestaurantsByOwner = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.params.ownerId });
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Error fetching restaurants", error: err.message });
  }
};

// Get all restaurants (Admin only)
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Error fetching all restaurants", error: err.message });
  }
};

// Update restaurant details (Owner only)
exports.updateRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const {
      restaurantName,
      branchName,
      address,
      cuisineType,
      operatingHours,
      approvalStatus,
    } = req.body;

    if (!restaurantName || !branchName || !address || !cuisineType || !operatingHours) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const licenseFile = req.files?.licenseFile?.[0];
    const restaurantImage = req.files?.restaurantImage?.[0];

    // Validate license file if provided - MUST be PDF
    if (licenseFile) {
      const licenseFileExt = path.extname(licenseFile.originalname).toLowerCase();
      if (licenseFileExt !== '.pdf') {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ 
          message: "License file must have .pdf extension." 
        });
      }

      if (licenseFile.mimetype !== 'application/pdf') {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ 
          message: "License file must be a PDF document only. Other file types are not accepted." 
        });
      }

      const licenseValidation = isValidLicense(licenseFile.path);
      if (!licenseValidation.valid) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ message: licenseValidation.message });
      }
    }

    if (restaurantImage) {
      const imageFileExt = path.extname(restaurantImage.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(imageFileExt)) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ 
          message: "Restaurant image must be JPG, JPEG, or PNG format." 
        });
      }

      if (!isValidImage(restaurantImage.path)) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ message: "Invalid restaurant image: Invalid image format." });
      }
    }

    let parsedAddress, parsedCuisineType, parsedOperatingHours;
    try {
      parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
      parsedCuisineType = typeof cuisineType === "string" ? JSON.parse(cuisineType) : cuisineType;
      parsedOperatingHours = typeof operatingHours === "string" ? JSON.parse(operatingHours) : operatingHours;
    } catch (parseError) {
      deleteUploadedFiles(req.files);
      return res.status(400).json({ 
        message: "Invalid JSON format in address, cuisineType, or operatingHours.", 
        error: parseError.message 
      });
    }

    if (!parsedAddress.fullAddress || !parsedAddress.coordinates?.lat || !parsedAddress.coordinates?.lng) {
      return res.status(400).json({ message: "Invalid address format." });
    }
    if (!Array.isArray(parsedCuisineType) || parsedCuisineType.length === 0) {
      return res.status(400).json({ message: "Cuisine type must be a non-empty array." });
    }
    if (Object.keys(parsedOperatingHours).length === 0) {
      return res.status(400).json({ message: "Operating hours must be provided." });
    }

    const updateData = {
      restaurantName,
      branchName,
      address: parsedAddress,
      cuisineType: parsedCuisineType,
      operatingHours: parsedOperatingHours,
      approvalStatus: approvalStatus || "not_approved",
    };

    if (licenseFile) updateData.licenseFile = licenseFile.path;
    if (restaurantImage) updateData.restaurantImage = restaurantImage.path;

    const updated = await Restaurant.findOneAndUpdate(
      { restaurantId: restaurantId, owner: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Restaurant not found or unauthorized" });
    }

    res.status(200).json({
      message: "Restaurant updated successfully",
      data: updated,
      ...(licenseFile && { licenseFileUrl: licenseFile.path }),
      ...(restaurantImage && { restaurantImageUrl: restaurantImage.path }),
    });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    if (req.files) {
      deleteUploadedFiles(req.files);
    }
    res.status(500).json({ message: "Error updating restaurant", error: err.message });
  }
};

// Delete a restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { userID } = req.user;

    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    if (restaurant.owner.toString() !== userID) {
      return res.status(403).json({ message: "Unauthorized action. You are not the owner of this restaurant." });
    }

    await Restaurant.deleteOne({ restaurantId });
    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: "Error deleting restaurant", error: err.message });
  }
};

// Update restaurant approval status (Admin only)
exports.updateApprovalStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ restaurantId: req.params.restaurantId });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    if (restaurant.approvalStatus === "approved") {
      return res.status(400).json({ message: "Restaurant already approved. Cannot change status." });
    }

    const { approvalStatus } = req.body;
    if (!["not_approved", "approved"].includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid approval status" });
    }

    await Restaurant.updateOne(
      { restaurantId: req.params.restaurantId },
      { $set: { approvalStatus } }
    );

    res.status(200).json({ 
      message: "Approval status updated", 
      restaurant: { ...restaurant.toObject(), approvalStatus } 
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating approval status", error: err.message });
  }
};

// Update restaurant status by owner (open, close, temporarily_closed)
exports.updateStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.body;

    if (!["open", "close", "temporarily_closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'open', 'close', or 'temporarily_closed'" });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      { restaurantId, owner: req.user.userID },
      { status },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found or unauthorized" });
    }

    res.status(200).json({
      message: `Restaurant status updated to ${status}`,
      restaurant
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating restaurant status", error: err.message });
  }
};

// Get approved restaurant count by admin
exports.approvedRestaurantCount = async (req, res) => {
  try {
    const approvedRestaurantCount = await Restaurant.countDocuments({ approvalStatus: 'approved' });

    res.status(200).json({
      success: true,
      count: approvedRestaurantCount,
      message: 'Approved restaurants count retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching approved restaurant count', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve approved restaurant count',
      error: error.message,
    });
  }
};

// Search restaurants by name
exports.searchRestaurants = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Name query parameter is required' });
    }

    const results = await Restaurant.find({
      restaurantName: { $regex: name, $options: 'i' },
      approvalStatus: 'approved'
    }).select('restaurantName branchName address restaurantImage'); 

    res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get 8 random open and approved restaurants
exports.getRandomRestaurants = async (req, res) => {
  try {
    const randomRestaurants = await Restaurant.aggregate([
      {
        $match: {
          status: "open",
          approvalStatus: "approved",
        },
      },
      {
        $sample: { size: 8 }, 
      },
    ]);

    if (randomRestaurants.length === 0) {
      return res.status(404).json({ message: "No open and approved restaurants found" });
    }

    res.status(200).json({
      success: true,
      message: "Random restaurants retrieved successfully",
      data: randomRestaurants,
    });
  } catch (error) {
    console.error("Error fetching random restaurants:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching random restaurants",
      error: error.message,
    });
  }
};

// Get restaurant counts by approval status for a specific owner
exports.getRestaurantCountsByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Invalid owner ID' });
    }

    const counts = await Restaurant.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    counts.forEach((item) => {
      if (item._id === 'approved') result.approved = item.count;
      else if (item._id === 'not_approved') result.pending = item.count;
      else if (item._id === 'rejected') result.rejected = item.count;
    });

    res.status(200).json({
      success: true,
      message: 'Restaurant counts retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error fetching restaurant counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant counts',
      error: error.message,
    });
  }
};

// Get count of restaurants with the same restaurant name
exports.getRestaurantNameCount = async (req, res) => {
  try {
    const { restaurantName } = req.query;

    if (!restaurantName) {
      return res.status(400).json({ message: "Restaurant name query parameter is required" });
    }

    const count = await Restaurant.countDocuments({
      restaurantName: { $regex: `^${escapeRegex(restaurantName)}$`, $options: 'i' },
    });

    res.status(200).json({
      success: true,
      count,
      message: "Restaurant name count retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching restaurant name count:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching restaurant name count",
      error: error.message,
    });
  }
};