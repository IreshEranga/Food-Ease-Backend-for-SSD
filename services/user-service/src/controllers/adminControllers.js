const Admin = require("../models/Admin");

exports.getAdminCount = async (req, res) => {
  try {
    // Get the total count of owners from the database
    const adminCount = await Admin.countDocuments();

  
    res.status(200).json({
      success: true,
      count: adminCount,
      message: "Admin count retrieved successfully",
    });
  } catch (error) {
    
    console.error("Error fetching admin count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve admin count",
      error: error.message,
    });
  }
};