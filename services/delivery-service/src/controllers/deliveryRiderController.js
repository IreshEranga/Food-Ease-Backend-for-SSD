// controllers/deliveryRiderController.js
const DeliveryRider = require('../models/DeliveryRider');

exports.createRider = async (req, res) => {
    try {
        const rider = new DeliveryRider(req.body);
        await rider.save();
        res.status(201).json({ success: true, data: rider });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getAllRiders = async (req, res) => {
    try {
        const riders = await DeliveryRider.find(); // removed .populate('roleID')
        res.status(200).json({ success: true, data: riders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getRiderById = async (req, res) => {
    try {
        const rider = await DeliveryRider.findById(req.params.id); // removed .populate('roleID')
        if (!rider) {
            return res.status(404).json({ success: false, error: 'Rider not found' });
        }
        res.status(200).json({ success: true, data: rider });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateRider = async (req, res) => {
    try {
        const rider = await DeliveryRider.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!rider) {
            return res.status(404).json({ success: false, error: 'Rider not found' });
        }
        res.status(200).json({ success: true, data: rider });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.deleteRider = async (req, res) => {
    try {
        const rider = await DeliveryRider.findByIdAndDelete(req.params.id);
        if (!rider) {
            return res.status(404).json({ success: false, error: 'Rider not found' });
        }
        res.status(200).json({ success: true, message: 'Rider deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
