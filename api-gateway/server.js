const express = require("express");
const { createProxyMiddleware, fixRequestBody  } = require("http-proxy-middleware");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is Working");
});

app.use(
    "/api/users",
    createProxyMiddleware({
      target: `${process.env.USER_SERVICE}/api/users`,
      changeOrigin: true,
      //pathRewrite: { "^/users/login": "/auth/login" },
      on: {
        proxyReq: fixRequestBody, 
      },
    })
);

app.use(
  "/api/restaurant",
  createProxyMiddleware({
    target: `${process.env.RESTAURANT_SERVICE}/api/restaurant`,
    changeOrigin: true,
    //pathRewrite: { "^/users/login": "/auth/login" },
    on: {
      proxyReq: fixRequestBody, 
    },
  })
);

app.use(
  "/api/order",
  createProxyMiddleware({
    target: `${process.env.ORDER_SERVICE}/api/order`,
    changeOrigin: true,
    //pathRewrite: { "^/users/login": "/auth/login" },
    on: {
      proxyReq: fixRequestBody, 
    },
  })
);

app.use(
  "/api/payment",
  createProxyMiddleware({
    target: `${process.env.PAYMENT_SERVICE}/api/payment`,
    changeOrigin: true,
    pathRewrite: {
      "^/api/payment": "", // Remove this prefix before sending to payment-service
    },
    on: {
      proxyReq: fixRequestBody, 
    },
  })
);
  
app.use(
  "/api/delivery",
  createProxyMiddleware({
    target: `${process.env.DELIVERY_SERVICE}/api/delivery`,
    changeOrigin: true,
   
    on: {
      proxyReq: fixRequestBody, 
    },
  })
);

app.listen(process.env.PORT, () => console.log(`API Gateway running on port ${process.env.PORT}`));
