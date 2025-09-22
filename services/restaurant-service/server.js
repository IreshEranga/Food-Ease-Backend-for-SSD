require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 


const restaurantRoutes = require('./src/routes/restaurantRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const offerRoutes = require('./src/routes/offerRoutes');


const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();


app.use('/api/restaurant/restaurants', restaurantRoutes);
app.use('/api/restaurant/categories', categoryRoutes);
app.use('/api/restaurant/menu', menuRoutes);
app.use('/api/restaurant/offers', offerRoutes);


app.use((req, res, next) => {
    console.log(`404 Error - Requested URL: ${req.originalUrl}`);
    res.status(404).send('Not Found');
  });

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`${process.env.SERVICE_NAME} Service running on port ${PORT}`));
