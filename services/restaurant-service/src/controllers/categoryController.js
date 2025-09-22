const mongoose = require('mongoose');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');

// Add category for a restaurant by restaurantName and ownerId
exports.addCategoryForRestaurant = async (req, res) => {
  try {
    const { restaurantName } = req.params;
    const { name, description, ownerId, additionalRestaurantNames = [] } = req.body;

    // Validate inputs
    if (!ownerId) {
      return res.status(400).json({ message: 'Owner ID is required' });
    }
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Invalid owner ID' });
    }

    // Function to process a restaurant chain
    const processRestaurantChain = async (chainName, ownerId, categoryName, categoryDescription) => {
      // Find restaurants
      const restaurants = await Restaurant.find({
        restaurantName: { $regex: `^${chainName}$`, $options: 'i' },
        owner: ownerId,
      });

      if (!restaurants.length) {
        throw new Error(`No restaurants found for chain '${chainName}' or you do not own these restaurants`);
      }

      const restaurantIds = restaurants.map(r => r._id).sort();

      // Check for existing category by name and owner
      let existingCategory = await Category.findOne({
        name: categoryName,
      });

      if (existingCategory) {
        // Update existing category
        const currentRestaurantIds = existingCategory.restaurants.map(id => id.toString());
        const newRestaurantIds = restaurantIds.filter(id => !currentRestaurantIds.includes(id.toString()));

        let isUpdated = false;

        // Add new restaurants if any
        if (newRestaurantIds.length > 0) {
          existingCategory.restaurants.push(...newRestaurantIds);
          existingCategory.restaurants = [...new Set(existingCategory.restaurants.map(id => id.toString()))]
            .map(id => new mongoose.Types.ObjectId(id))
            .sort();
          isUpdated = true;
        }
        
        // Add ownerId if not present
        const currentOwnerIds = existingCategory.owners.map(id => id.toString());
        if (!currentOwnerIds.includes(ownerId)) {
          existingCategory.owners.push(ownerId);
          existingCategory.owners = [...new Set(existingCategory.owners.map(id => id.toString()))]
            .map(id => new mongoose.Types.ObjectId(id))
            .sort();
          isUpdated = true;
        }
        
        // Update description if provided
        if (categoryDescription && categoryDescription !== existingCategory.description) {
          existingCategory.description = categoryDescription;
          isUpdated = true;
        }
        
        if (isUpdated) {
          await existingCategory.save();
          return {
            message: `Category '${categoryName}' updated for chain '${chainName}'`,
            category: existingCategory,
          };
        } else {
          return {
            message: `Category '${categoryName}' already includes all restaurants and owner for chain '${chainName}'`,
            category: existingCategory,
          };
        }
      }        

      // Create new category
      const newCategory = new Category({
        name: categoryName,
        description: categoryDescription,
        owners: [ownerId],
        restaurants: restaurantIds,
      });

      await newCategory.save();
      return {
        message: `Category '${categoryName}' added successfully to ${restaurantIds.length} restaurant(s) in chain '${chainName}'`,
        category: newCategory,
      };
    };

    // Process primary and additional restaurant chains
    const primaryResult = await processRestaurantChain(restaurantName, ownerId, name, description);
    const additionalResults = [];
    for (const addRestaurantName of additionalRestaurantNames) {
      const result = await processRestaurantChain(addRestaurantName, ownerId, name, description);
      additionalResults.push(result);
    }

    // Combine results
    const allResults = [primaryResult, ...additionalResults];
    res.status(201).json({
      message: `Category operations completed for ${allResults.length} restaurant chain(s)`,
      results: allResults,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Handle duplicate key by merging restaurants
      try {
        const allRestaurantNames = [restaurantName, ...additionalRestaurantNames];
        const allRestaurantIds = [];

        // Collect all restaurant IDs
        for (const chainName of allRestaurantNames) {
          const restaurants = await Restaurant.find({
            restaurantName: { $regex: `^${chainName}$`, $options: 'i' },
            owner: ownerId,
          });
          if (restaurants.length) {
            allRestaurantIds.push(...restaurants.map(r => r._id));
          }
        }

        const uniqueRestaurantIds = [...new Set(allRestaurantIds.map(id => id.toString()))]
          .map(id => new mongoose.Types.ObjectId(id))
          .sort();

        let existingCategory = await Category.findOne({
          name: name,
          owners: ownerId,
        });

        if (existingCategory) {
          const currentRestaurantIds = existingCategory.restaurants.map(id => id.toString());
          const newRestaurantIds = uniqueRestaurantIds.filter(id => !currentRestaurantIds.includes(id.toString()));

          if (newRestaurantIds.length > 0) {
            existingCategory.restaurants.push(...newRestaurantIds);
            existingCategory.restaurants = [...new Set(existingCategory.restaurants.map(id => id.toString()))]
              .map(id => new mongoose.Types.ObjectId(id))
              .sort();
            existingCategory.description = description || existingCategory.description;
            await existingCategory.save();
            return res.status(200).json({
              message: `Added ${newRestaurantIds.length} restaurant(s) to existing category '${name}'`,
              category: existingCategory,
            });
          }

          return res.status(200).json({
            message: `Category '${name}' already includes all restaurants`,
            category: existingCategory,
          });
        }

        // Fallback: Create new category if none found
        const newCategory = new Category({
          name: name,
          description: description,
          owners: [ownerId],
          restaurants: uniqueRestaurantIds,
        });

        await newCategory.save();
        return res.status(201).json({
          message: `Category '${name}' added successfully with ${uniqueRestaurantIds.length} restaurant(s)`,
          category: newCategory,
        });
      } catch (mergeError) {
        console.error('Merge error:', mergeError);
        return res.status(500).json({
          message: `Failed to merge restaurants into category '${name}'`,
          error: mergeError.message,
        });
      }
    }
    res.status(500).json({ message: 'Cannot add category', error: error.message });
  }
};

// Fetch categories by owner ID
exports.getCategoriesByOwner = async (req, res) => {
  try {
    const { ownerID } = req.params;
    if (!ownerID || !mongoose.Types.ObjectId.isValid(ownerID)) {
      return res.status(400).json({ message: 'Valid Owner ID is required' });
    }

    const categories = await Category.find({ owners: ownerID }).populate('restaurants');
    if (!categories.length) {
      return res.status(404).json({ message: 'No categories found for this owner' });
    }
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories by owner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch categories by restaurant name and owner ID
exports.getCategoriesByRestaurant = async (req, res) => {
  try {
    const { ownerID, restaurantName } = req.params;

    if (!ownerID || !mongoose.Types.ObjectId.isValid(ownerID)) {
      return res.status(400).json({ message: 'Valid Owner ID is required' });
    }
    if (!restaurantName) {
      return res.status(400).json({ message: 'Restaurant name is required' });
    }

    const restaurant = await Restaurant.findOne({
      restaurantName: { $regex: `^${restaurantName}$`, $options: 'i' },
      owner: ownerID,
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
    }

    const categories = await Category.find({
      restaurants: restaurant._id,
      owners: ownerID,
    }).populate('restaurants');

    if (!categories.length) {
      return res.status(404).json({ message: 'No categories found for this restaurant' });
    }
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories by restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getCategoryCount = async (req, res) => {
  try {
    const categoryCount = await Category.countDocuments();
    
    return res.status(200).json({
      success: true,
      categoryCount,
    });
  } catch (error) {
    console.error('Error fetching category count:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching category count',
    });
  }
};


// Fetch restaurant IDs and full restaurant data for a specific category name
exports.getRestaurantsByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Find the category by name and populate restaurants
    const category = await Category.findOne({
      name: { $regex: `^${categoryName}$`, $options: 'i' },
    }).populate({
      path: 'restaurants',
      match: { approvalStatus: 'approved' }, // Only include approved restaurants
      select: 'restaurantName branchName address restaurantImage', // Select specific fields
    });

    if (!category) {
      return res.status(404).json({ message: `Category '${categoryName}' not found` });
    }

    // Extract restaurant IDs
    const restaurantIds = category.restaurants.map(restaurant => restaurant._id);

    // Fetch menu items for the specific category and restaurants
    const menus = await Menu.find({
      category: category._id, // Match the specific category
      restaurants: { $in: restaurantIds }, // Match restaurants in the category
    }).populate('category', 'name description').lean(); // Populate category details

    // Map restaurants with their menu items
    const restaurants = category.restaurants.map(restaurant => {
      const restaurantMenus = menus
        .filter(menu => 
          menu.restaurants.some(rid => rid.toString() === restaurant._id.toString())
        )
        .map(menu => ({
          name: menu.name,
          description: menu.description,
          price: menu.price,
          category: menu.category ? {
            _id: menu.category._id,
            name: menu.category.name,
            description: menu.category.description,
          } : null,
          image: menu.image,
          available: menu.available,
          createdAt: menu.createdAt,
          updatedAt: menu.updatedAt,
        }));
      return {
        ...restaurant.toObject(), // Convert Mongoose document to plain object
        menu: restaurantMenus, // Attach menu items
      };
    });

    if (!restaurants.length) {
      return res.status(404).json({
        message: `No approved restaurants found for category '${categoryName}'`,
      });
    }

    res.status(200).json({
      message: `Restaurants retrieved successfully for category '${categoryName}'`,
      category: {
        name: category.name,
        description: category.description,
        restaurantIds,
      },
      restaurants,
    });
  } catch (error) {
    console.error('Error fetching restaurants by category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};