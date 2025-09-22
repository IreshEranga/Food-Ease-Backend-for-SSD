// utils/geocode.js
const axios = require('axios');

const geocodeAddress = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await axios.get(url);

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const location = response.data.results[0].geometry.location;
    return [location.lng, location.lat]; // [longitude, latitude]
  } catch (error) {
    console.error('Google Geocoding error:', error.message);
    throw error;
  }
};

module.exports = geocodeAddress;
