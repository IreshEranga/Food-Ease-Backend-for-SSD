const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');

// Create a new menu item
exports.createMenu = async (req, res) => {
  try {
    const { name, description, price, category, restaurantName, owner } = req.body;
    const image = req.file?.path;

    if (!restaurantName || !owner) {
      return res.status(400).json({ message: 'restaurantName and owner are required' });
    }

    // Find all restaurants with the same restaurantName and owner
    const restaurants = await Restaurant.find({
      restaurantName: { $regex: `^${restaurantName}$`, $options: 'i' },
      owner
    });

    if (!restaurants.length) {
      return res.status(404).json({ message: 'No restaurants found for this restaurant name and owner' });
    }

    // Get restaurant IDs
    const restaurantIds = restaurants.map(r => r._id).sort();

    // Validate that restaurantIds is not empty
    if (!restaurantIds.length) {
      return res.status(400).json({ message: 'No valid restaurant IDs found' });
    }

    // Check for existing menu item with the same name and exact same set of restaurants
    const existingMenu = await Menu.findOne({
      name,
      restaurants: { $all: restaurantIds, $size: restaurantIds.length }
    });

    if (existingMenu) {
      return res.status(400).json({ message: `Menu item '${name}' already exists for this exact set of restaurants` });
    }

    // Create new menu item for the specified restaurants
    const menu = new Menu({
      name,
      description,
      price,
      category,
      image,
      restaurants: restaurantIds,
      owner
    });

    const savedMenu = await menu.save();

    res.status(201).json({
      message: `Menu item added to ${restaurants.length} restaurant(s) successfully.`,
      item: savedMenu
    });
  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get menu items by restaurant
exports.getMenusByRestaurant = async (req, res) => {
  try {
    const { restaurantID } = req.params;

    if (!restaurantID) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    const menus = await Menu.find({ restaurants: restaurantID })
      .populate('category', 'name description')
      .populate('restaurants', 'restaurantName branchName')
      .sort({ createdAt: -1 });

    res.status(200).json(menus);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ message: 'Server error fetching menu items' });
  }
};

// Get menu items by owner
exports.getMenusByOwner = async (req, res) => {
  try {
    const menus = await Menu.find({ owner: req.params.ownerID })
      .populate('category')
      .populate('restaurants');
    res.json(menus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE a menu item by ID
exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Menu.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error while deleting menu item' });
  }
};

// PUT (Update) a menu item by ID
exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If image is uploaded, include its path
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedMenu = await Menu.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedMenu) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({
      message: 'Menu item updated successfully',
      menu: updatedMenu
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error while updating menu item' });
  }
};

// Get 6 random menu items with full details
exports.getFeaturedMenu = async (req, res) => {
  try {
    const randomMenus = await Menu.aggregate([
      { $match: { available: true } },
      { $sample: { size: 8 } }
    ]);

    // Populate
    const populatedMenus = await Menu.populate(randomMenus, [
      { path: 'category' },
      { path: 'restaurants' }
    ]);

    res.status(200).json({
      message: 'Random menu items fetched successfully',
      items: populatedMenus
    });
  } catch (error) {
    console.error('Error fetching random menu items:', error);
    res.status(500).json({ message: 'Failed to fetch random menu items' });
  }
};


// Get menu items count by restaurant for owner
exports.getMenuItemsCountByRestaurant = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const restaurants = await Restaurant.find({ owner: ownerId }).select('_id restaurantId restaurantName branchName');
    const restaurantIds = restaurants.map(r => r._id);

    const menuCounts = await Menu.aggregate([
      { $match: { owner: ownerId, restaurants: { $in: restaurantIds } } },
      { $unwind: '$restaurants' },
      {
        $group: {
          _id: '$restaurants',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = restaurants.map(restaurant => {
      const menuCount = menuCounts.find(mc => mc._id.toString() === restaurant._id.toString());
      return {
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        branchName: restaurant.branchName,
        menuItemsCount: menuCount ? menuCount.count : 0,
      };
    });

    res.status(200).json({ success: true, counts });
  } catch (error) {
    console.error('Error fetching menu items count by restaurant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};