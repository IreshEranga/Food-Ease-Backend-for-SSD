const mongoose = require("mongoose");
const { Schema } = mongoose;

const operatingHoursSchema = new Schema({
  open: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  close: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
});

const restaurantSchema = new Schema(
  {
    restaurantId: {
      type: String,
      unique: true,
    },
    restaurantName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    branchName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    address: {
      type: {
        fullAddress: {
          type: String,
          required: true,
          trim: true,
          maxlength: 255,
        },
        coordinates: {
          lat: { type: Number, min: -90, max: 90 },
          lng: { type: Number, min: -180, max: 180 },
        },
      },
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "close", "temporarily_closed"],
      default: "close",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantOwner",
      required: true,
      index: true,
    },
    cuisineType: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    operatingHours: {
      type: Map,
      of: operatingHoursSchema,
      required: true,
    },
    restaurantImage: {
      type: String,
      required: true,
    },
    licenseFile: {
      type: String,
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ["not_approved", "approved", "rejected"],
      default: "not_approved",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate restaurantId
restaurantSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const baseName = this.restaurantName
      const ownerSuffix = this.owner.toString().slice(-6); // Last 6 characters of ObjectId

      // Count existing documents with the same restaurantName (case-insensitive) and owner
      const existingCount = await this.constructor.countDocuments({
        restaurantName: { $regex: `^${this.restaurantName}$`, $options: "i" }, // Case-insensitive match
        owner: this.owner,
      });

      let counter = existingCount + 1;
      let counterFormatted = counter.toString().padStart(4, "0");
      let restaurantId = `${baseName}_${counterFormatted}_${ownerSuffix}`;

      // Check if the generated restaurantId already exists
      let existingRestaurant = await this.constructor.findOne({ restaurantId });
      let attempts = 0;
      const maxAttempts = 5;

      // Retry with incremented counter if restaurantId exists
      while (existingRestaurant && attempts < maxAttempts) {
        counter += 1;
        counterFormatted = counter.toString().padStart(4, "0");
        restaurantId = `${baseName}_${counterFormatted}_${ownerSuffix}`;
        existingRestaurant = await this.constructor.findOne({ restaurantId });
        attempts += 1;
      }

      if (existingRestaurant) {
        throw new Error(`Unable to generate unique restaurantId after ${maxAttempts} attempts`);
      }

      this.restaurantId = restaurantId;
      next();
    } catch (error) {
      console.error("Error in pre-save hook:", error);
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Restaurant", restaurantSchema);