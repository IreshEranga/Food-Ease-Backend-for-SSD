const Restaurant = require("../models/Restaurant");
const Menu = require("../models/Menu");
const Category = require("../models/Category");
const mongoose = require('mongoose');

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

    // Extract files from req.files
    const licenseFile = req.files?.licenseFile?.[0]?.path;
    const restaurantImage = req.files?.restaurantImage?.[0]?.path;

    if (!licenseFile || !restaurantImage) {
      return res.status(400).json({ message: "Both licenseFile and restaurantImage are required." });
    }

    // Safely parse JSON fields
    let parsedAddress, parsedCuisineType, parsedOperatingHours;
    try {
      parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
      parsedCuisineType = typeof cuisineType === "string" ? JSON.parse(cuisineType) : cuisineType;
      parsedOperatingHours = typeof operatingHours === "string" ? JSON.parse(operatingHours) : operatingHours;
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid JSON format in address, cuisineType, or operatingHours.", error: parseError.message });
    }

    // Validate parsed data
    if (!parsedAddress.fullAddress || !parsedAddress.coordinates?.lat || !parsedAddress.coordinates?.lng) {
      return res.status(400).json({ message: "Invalid address format." });
    }
    if (!Array.isArray(parsedCuisineType) || parsedCuisineType.length === 0) {
      return res.status(400).json({ message: "Cuisine type must be a non-empty array." });
    }
    if (Object.keys(parsedOperatingHours).length === 0) {
      return res.status(400).json({ message: "Operating hours must be provided." });
    }

    // Create new restaurant
    const newRestaurant = new Restaurant({
      restaurantName,
      branchName,
      address: parsedAddress,
      status: status || "close",
      owner,
      cuisineType: parsedCuisineType,
      operatingHours: parsedOperatingHours,
      licenseFile,
      restaurantImage,
    });

    // Save to database
    const savedRestaurant = await newRestaurant.save();

    // Find existing restaurants with the same restaurantName and owner (for menu items)
    const existingRestaurants = await Restaurant.find({
      restaurantName: { $regex: `^${restaurantName}$`, $options: 'i' },
      owner,
      _id: { $ne: savedRestaurant._id } // Exclude the newly created restaurant
    });

    if (existingRestaurants.length > 0) {
      // Find menu items associated with these restaurants
      const existingMenus = await Menu.find({
        restaurants: { $in: existingRestaurants.map(r => r._id) },
        owner
      });

      // Update each menu item to include the new restaurant ID
      await Promise.all(existingMenus.map(async (menu) => {
        if (!menu.restaurants.includes(savedRestaurant._id)) {
          menu.restaurants.push(savedRestaurant._id);
          await menu.save();
        }
      }));
    }

    res.status(201).json({
      message: "Restaurant created successfully",
      data: savedRestaurant,
      licenseFileUrl: licenseFile,
      restaurantImageUrl: restaurantImage,
    });
  } catch (error) {
    console.error("Error in createRestaurant:", error);
    res.status(500).json({
      message: "Error creating restaurant",
      error: error.message || "Internal server error",
    });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { restaurantID } = req.params; // Renamed to match frontend naming convention

    const restaurant = await Restaurant.findOne({ restaurantId: restaurantID }); // Ensure the field name matches the model

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Ensure restaurantName is included in the response (already part of the restaurant object)
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

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { restaurantID } = req.params;
    const restaurant = await Restaurant.findById(restaurantID).select('restaurantName branchName image approvalStatus owner');

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ message: 'Server error fetching restaurant' });
  }
};

// Get all restaurants for a specific owner
exports.getRestaurantsByOwner = async (req, res) => {
 redazione: try {
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

    // Validate required fields
    if (!restaurantName || !branchName || !address || !cuisineType || !operatingHours) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Extract files from req.files
    const licenseFile = req.files?.licenseFile?.[0]?.path;
    const restaurantImage = req.files?.restaurantImage?.[0]?.path;

    // Safely parse JSON fields
    let parsedAddress, parsedCuisineType, parsedOperatingHours;
    try {
      parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
      parsedCuisineType = typeof cuisineType === "string" ? JSON.parse(cuisineType) : cuisineType;
      parsedOperatingHours = typeof operatingHours === "string" ? JSON.parse(operatingHours) : operatingHours;
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid JSON format in address, cuisineType, or operatingHours.", error: parseError.message });
    }

    // Validate parsed data
    if (!parsedAddress.fullAddress || !parsedAddress.coordinates?.lat || !parsedAddress.coordinates?.lng) {
      return res.status(400).json({ message: "Invalid address format." });
    }
    if (!Array.isArray(parsedCuisineType) || parsedCuisineType.length === 0) {
      return res.status(400).json({ message: "Cuisine type must be a non-empty array." });
    }
    if (Object.keys(parsedOperatingHours).length === 0) {
      return res.status(400).json({ message: "Operating hours must be provided." });
    }

    // Prepare update object
    const updateData = {
      restaurantName,
      branchName,
      address: parsedAddress,
      cuisineType: parsedCuisineType,
      operatingHours: parsedOperatingHours,
      approvalStatus: approvalStatus || "not_approved",
    };

    // Add files to update object only if they are provided
    if (licenseFile) updateData.licenseFile = licenseFile;
    if (restaurantImage) updateData.restaurantImage = restaurantImage;

    // Find and update restaurant
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
      ...(licenseFile && { licenseFileUrl: licenseFile }),
      ...(restaurantImage && { restaurantImageUrl: restaurantImage }),
    });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    res.status(500).json({ message: "Error updating restaurant", error: err.message });
  }
};

// Delete a restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { userID } = req.user;  // Assuming userID is passed via the middleware

    // Check if the restaurant exists and belongs to the owner
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    if (restaurant.owner.toString() !== userID) {
      return res.status(403).json({ message: "Unauthorized action. You are not the owner of this restaurant." });
    }

    // Proceed to delete the restaurant
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

    // Validate status
    if (!["open", "close", "temporarily_closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'open', 'close', or 'temporarily_closed'" });
    }

    // Find and update restaurant
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

    // Validate ownerId
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Invalid owner ID' });
    }

    // Fetch counts for each approval status
    const counts = await Restaurant.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Initialize default counts
    const result = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    // Map aggregation results to the response
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
      restaurantName: { $regex: `^${restaurantName}$`, $options: 'i' },
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