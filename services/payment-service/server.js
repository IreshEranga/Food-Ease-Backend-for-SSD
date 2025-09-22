require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 

const paymentRoutes = require('./src/routes/paymentRoutes');

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

app.use('/api/payment/payments', paymentRoutes);

app.use((req, res, next) => {
    console.log(`[Payment Service] ${req.method} ${req.originalUrl}`);
    next();
});