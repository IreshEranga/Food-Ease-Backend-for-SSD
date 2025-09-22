const Owner = require("../models/RestaurantOwner");
const mongoose = require('mongoose');

// Get the total count of owners
exports.getOwnerCount = async (req, res) => {
    try {
        const ownerCount = await Owner.countDocuments();
        res.status(200).json({
            success: true,
            count: ownerCount,
            message: "Owner count retrieved successfully",
        });
    } catch (error) {
        console.error("Error fetching owner count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve owner count",
            error: error.message,
        });
    }
};

// Get all owners
exports.getOwners = async (req, res) => {
    try {
        const owners = await Owner.find().select('-password');
        res.status(200).json({
            success: true,
            owners
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching owners",
            error: error.message
        });
    }
};

// Get owner profile by ID
exports.getOwnerProfile = async (req, res) => {
    try {
        const { ownerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid owner ID'
            });
        }

        const owner = await Owner.findById(ownerId).select('name email mobileNumber ownerID');

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Owner not found'
            });
        }

        res.status(200).json({
            success: true,
            owner
        });
    } catch (error) {
        console.error('Error fetching owner profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching owner profile',
            error: error.message
        });
    }
};

// Update owner profile
exports.updateOwnerProfile = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const { name, email, mobileNumber } = req.body;

        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid owner ID'
            });
        }

        const owner = await Owner.findById(ownerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Owner not found'
            });
        }

        // Check for duplicate mobile number (excluding current owner)
        if (mobileNumber && mobileNumber !== owner.mobileNumber) {
            const existingOwner = await Owner.findOne({
                mobileNumber,
                _id: { $ne: ownerId } // Exclude the current owner
            });
            if (existingOwner) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number already exists'
                });
            }
        }

        owner.name = name || owner.name;
        owner.email = email || owner.email;
        owner.mobileNumber = mobileNumber || owner.mobileNumber;

        await owner.save();

        res.status(200).json({
            success: true,
            owner: {
                name: owner.name,
                email: owner.email,
                mobileNumber: owner.mobileNumber,
                ownerID: owner.ownerID
            }
        });
    } catch (error) {
        console.error('Error updating owner profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating owner profile',
            error: error.message
        });
    }
};

// Get owner name by ID
exports.getOwnerNameById = async (req, res) => {
    try {
        const { ownerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid owner ID'
            });
        }

        const owner = await Owner.findById(ownerId).select('name');

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Owner not found'
            });
        }

        res.status(200).json({
            success: true,
            name: owner.name
        });
    } catch (error) {
        console.error('Error fetching owner name:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching owner name',
            error: error.message
        });
    }
};