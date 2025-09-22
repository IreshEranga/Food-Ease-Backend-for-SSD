const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.verifyToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access denied" });

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Admin-only access
exports.isAdmin = (req, res, next) => {
    if (req.user.roleID !== "role1") return res.status(403).json({ message: "Access denied" });
    next();
};

// Restaurant Owner-only access
exports.isOwner = (req, res, next) => {
    if (req.user.roleID !== "role2") return res.status(403).json({ message: "Access denied" });
    next();
};

// Customer-only access
exports.isCustomer = (req, res, next) => {
    if (req.user.roleID !== "role3") return res.status(403).json({ message: "Access denied" });
    next();
};
