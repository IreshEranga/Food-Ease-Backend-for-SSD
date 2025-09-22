const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const Restaurant = require('../models/Restaurant');

// Helper function to compare arrays of ObjectIds
const areObjectIdsEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = arr1.map(String).sort();
  const sorted2 = arr2.map(String).sort();
  return sorted1.every((id, index) => id === sorted2[index]);
};

exports.addOffer = async (req, res) => {
  try {
    const {
      discountPercentage,
      startDate,
      endDate,
      description,
      restaurantName,
      title,
      additionalRestaurantNames = []
    } = req.body;

    const ownerId = req.user.userID;

    if (!ownerId || !restaurantName || !discountPercentage || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const offerTitle = title || description || `Discount ${discountPercentage}%`;

    const processRestaurantChain = async (chainName) => {
      const restaurants = await Restaurant.find({
        restaurantName: { $regex: `^${chainName}$`, $options: 'i' },
        owner: ownerId,
        approvalStatus: 'approved',
      });

      if (!restaurants.length) {
        throw new Error(`No approved restaurants found for '${chainName}'`);
      }

      const restaurantIds = restaurants.map(r => r._id);

      // Find existing offer with the same owner and same exact restaurant list
      const offersByOwner = await Offer.find({ owner: ownerId });

      const existingOffer = offersByOwner.find(offer =>
        areObjectIdsEqual(offer.restaurants, restaurantIds)
      );

      if (existingOffer) {
        let updated = false;

        if (existingOffer.discountPercentage !== discountPercentage) {
          existingOffer.discountPercentage = discountPercentage;
          updated = true;
        }

        if (existingOffer.startDate.getTime() !== start.getTime()) {
          existingOffer.startDate = start;
          updated = true;
        }

        if (existingOffer.endDate.getTime() !== end.getTime()) {
          existingOffer.endDate = end;
          updated = true;
        }

        if (offerTitle && existingOffer.title !== offerTitle) {
          existingOffer.title = offerTitle;
          updated = true;
        }

        if (description && existingOffer.description !== description) {
          existingOffer.description = description;
          updated = true;
        }

        if (updated) {
          await existingOffer.save();
          return { message: `Updated existing offer for '${chainName}'`, offer: existingOffer };
        }

        return { message: `Offer already exists for '${chainName}' with same data`, offer: existingOffer };
      }

      // Create new offer (even if title is the same)
      const newOffer = new Offer({
        restaurants: restaurantIds,
        owner: ownerId,
        title: offerTitle,
        discountPercentage,
        startDate: start,
        endDate: end,
        description,
      });

      await newOffer.save();
      return { message: `Created new offer for '${chainName}'`, offer: newOffer };
    };

    const results = [];

    const mainResult = await processRestaurantChain(restaurantName);
    results.push(mainResult);

    for (const chainName of additionalRestaurantNames) {
      const result = await processRestaurantChain(chainName);
      results.push(result);
    }

    res.status(201).json({
      message: 'Offer processing complete',
      results,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add offer', error: err.message });
  }
};

// Get all offers for an owner's approved restaurants
exports.getOwnerOffers = async (req, res) => {
  try {
    const owner = req.user.userID;

    // Find all approved restaurants for the owner
    const restaurants = await Restaurant.find({ owner, approvalStatus: 'approved' });
    const restaurantIds = restaurants.map((r) => r._id);

    // Fetch all offers for these restaurants
    const offers = await Offer.find({ restaurants: { $in: restaurantIds } })
      .populate('restaurants', 'restaurantName')
      .lean();

    // Add status and formatted fields to each offer
    const currentDate = new Date();
    const formattedOffers = offers.map((offer) => {
      const startDate = new Date(offer.startDate);
      const endDate = new Date(offer.endDate);
      let status;
      if (currentDate < startDate) {
        status = 'inactive';
      } else if (currentDate >= startDate && currentDate <= endDate) {
        status = 'active';
      } else {
        status = 'expired';
      }
      return {
        ...offer,
        title: offer.title || `Discount ${offer.discountPercentage}%`, // Fallback for missing title
        discountType: 'percentage',
        discountValue: offer.discountPercentage,
        validFrom: offer.startDate,
        validUntil: offer.endDate,
        status,
      };
    });

    res.status(200).json(formattedOffers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an offer
exports.deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const owner = req.user.userID;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Verify the offer belongs to the owner
    if (offer.owner.toString() !== owner) {
      return res.status(403).json({ message: 'Unauthorized to delete this offer' });
    }

    await Offer.deleteOne({ _id: offerId });
    res.status(200).json({ message: 'Offer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRestaurantOffers = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: 'Invalid restaurant ID' });
    }
    const offers = await Offer.find({ restaurants: restaurantId })
      .populate('restaurants', 'restaurantName')
      .lean();
    const currentDate = new Date();
    const formattedOffers = offers.map(offer => {
      const startDate = new Date(offer.startDate);
      const endDate = new Date(offer.endDate);
      let status;
      if (currentDate < startDate) status = 'inactive';
      else if (currentDate >= startDate && currentDate <= endDate) status = 'active';
      else status = 'expired';
      return {
        ...offer,
        title: offer.title || `Discount ${offer.discountPercentage}%`,
        discountType: 'percentage',
        discountValue: offer.discountPercentage,
        validFrom: offer.startDate,
        validUntil: offer.endDate,
        status,
      };
    });
    res.status(200).json(formattedOffers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};