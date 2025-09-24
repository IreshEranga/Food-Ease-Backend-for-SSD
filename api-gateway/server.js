const express = require("express");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
require("dotenv").config();

const app = express();
const cors = require("cors");
const allowedOrigins = ["http://localhost:3000"];

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS policy disallows origin"), false);
      }
      return callback(null, true);
    },
    credentials: true, // only if you must send cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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

app.listen(process.env.PORT, () =>
  console.log(`API Gateway running on port ${process.env.PORT}`)
);
