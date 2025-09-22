require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db'); 

const orderRoutes = require('./src/routes/orderRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();

// Test Route
app.get('/', (req, res) => {
    res.send(`${process.env.SERVICE_NAME} Service is Running...`);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`${process.env.SERVICE_NAME} Service running on port ${PORT}`));

app.use('/api/order/orders', orderRoutes);
