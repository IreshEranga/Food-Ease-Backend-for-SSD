const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const upload = require("../middlewares/upload");
const { verifyToken, isOwner, isAdmin } = require("../middlewares/authMiddleware");

// POST /api/restaurant/restaurants - create a new restaurant
router.post(
  "/",
  verifyToken,
  isOwner,
  upload.fields([
    { name: "licenseFile", maxCount: 1 },
    { name: "restaurantImage", maxCount: 1 },
  ]),
  restaurantController.createRestaurant
);

// GET /api/restaurant/restaurants/randomRestaurants - get 8 random open and approved restaurants
router.get("/randomRestaurants", restaurantController.getRandomRestaurants);

// GET /api/restaurant/restaurants/search - search for restaurants by name, location, or cuisine
router.get('/search', restaurantController.searchRestaurants);

// GET /api/restaurant/restaurants/owner/:ownerId - get all restaurants for one owner
router.get("/owner/:ownerId", verifyToken, isOwner, restaurantController.getRestaurantsByOwner);

// GET /api/restaurant/restaurants/getDetails/:id - get restaurant details by ID
router.get('/getDetails/:id', restaurantController.getRestaurantFromid);

// GET /api/restaurant/restaurants/:restaurantId - get a restaurant by its ID
router.get("/:restaurantId", restaurantController.getRestaurantById);

// GET /api/restaurant/restaurants - get all restaurants (Admin only)
router.get("/", verifyToken, isAdmin, restaurantController.getAllRestaurants);

// PUT /api/restaurant/restaurants/:restaurantId - update restaurant (Owner only)
router.put(
  "/:restaurantId",
  verifyToken,
  isOwner,
  upload.fields([
    { name: "licenseFile", maxCount: 1 },
    { name: "restaurantImage", maxCount: 1 },
  ]),
  restaurantController.updateRestaurant
);

// DELETE /api/restaurant/restaurants/:restaurantId - delete restaurant (Owner only)
router.delete("/:restaurantId", verifyToken, isOwner, restaurantController.deleteRestaurant);

// PATCH /api/restaurant/restaurants/:restaurantId/approve - update approval status (Admin only)
router.patch("/:restaurantId/approve", verifyToken, isAdmin, restaurantController.updateApprovalStatus);

// PATCH /api/restaurant/restaurants/:restaurantId/status - update restaurant open/close/temp status (Owner only)
router.patch("/:restaurantId/status", verifyToken, isOwner, restaurantController.updateStatus);

// GET /api/restaurant/restaurants/approved/count - get approved restaurant count (Admin only)
router.get("/approved/count", verifyToken, isAdmin, restaurantController.approvedRestaurantCount);

// GET /api/restaurants/owner/:ownerId/counts - get restaurant counts by approval status for owner
router.get("/owner/:ownerId/counts", verifyToken, isOwner, restaurantController.getRestaurantCountsByOwner);

// GET /api/restaurant/restaurants/name/count - get count of restaurants with the same name
router.get("/name/count", restaurantController.getRestaurantNameCount);

module.exports = router;