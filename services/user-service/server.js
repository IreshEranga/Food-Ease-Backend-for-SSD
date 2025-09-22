require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 




const authRoutes = require("./src/routes/authRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const ownerRoutes = require("./src/routes/ownerRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const otpRoutes = require("./src/routes/otpRoutes");
const driverRoutes = require("./src/routes/driverRoutes");
const deliveryRiderRoutes = require("./src/routes/deliveryRiderRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();



app.use("/api/users/deliveryrider", deliveryRiderRoutes);
app.use("/api/users/drivers", driverRoutes);
app.use("/api/users/auth", authRoutes);
app.use("/api/users/roles", roleRoutes);
app.use("/api/users/customers", customerRoutes);
app.use("/api/users/owners", ownerRoutes);
app.use("/api/users/admins", adminRoutes);
app.use("/api/users/otp", otpRoutes);




app.use((req, res, next) => {
    console.log(`404 Error - Requested URL: ${req.originalUrl}`);
    res.status(404).send('Not Found');
  });

  

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`${process.env.SERVICE_NAME} Service running on port ${PORT}`));
