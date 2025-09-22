require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

//const riderRoutes = require('./src/routes/deliveryRiderRoutes');
const deliveryRoutes = require('./src/routes/deliveryRoute');
const deliveryRiderRoutes = require('./src/routes/deliveryRiderRoutes');


const app = express();
 

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();



    //app.use('/api/delivery/rider', riderRoutes); // Fixed typo: "delivery"

    app.use('/api/delivery', deliveryRoutes);
    app.use('/api/delivery/rider', deliveryRiderRoutes);

    app.use((req, res, next) => {
      console.log(`404 Error - Requested URL: ${req.originalUrl}`);
      res.status(404).send('Not Found');
    });
    

    const PORT = process.env.PORT||5001 ;
    app.listen(PORT, () => {
      console.log(`${process.env.SERVICE_NAME || 'DeliveryRider'} Service running on port ${PORT}`);
    });
  


