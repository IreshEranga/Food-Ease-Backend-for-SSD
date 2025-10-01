// // const mongoose = require('mongoose');
// // const Counter = require('./Counter');

// // const CustomerSchema = new mongoose.Schema({
// //     customerID: { type: String, unique: true },
// //     name: { type: String, required: true },
// //     email: { type: String, required: true, unique: true },
// //     mobileNumber: { type: String, required: true, unique: true },
// //     address: { type: String, required: true },
// //     password: { type: String, required: true },
// //     roleID: { type: mongoose.Schema.Types.String, ref: 'Role', required: true }
// // }, { timestamps: true });

// // // Generate customerID before saving
// // CustomerSchema.pre('save', async function (next) {
// //     if (!this.customerID) {
// //         const counter = await Counter.findOneAndUpdate(
// //             { name: 'Customer' },
// //             { $inc: { seq: 1 } },
// //             { new: true, upsert: true }
// //         );
// //         this.customerID = `customer${counter.seq}`;
// //     }
// //     next();
// // });

// // module.exports = mongoose.model('Customer', CustomerSchema);



// const mongoose = require('mongoose');
// const Counter = require('./Counter');

// const CustomerSchema = new mongoose.Schema({
//     customerID: { type: String, unique: true },
//     googleId: { type: String, sparse: true, unique: true }, // Google OAuth ID
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     mobileNumber: { type: String, sparse: true }, // Make optional for Google OAuth
//     address: { type: String }, // Make optional for Google OAuth
//     password: { type: String }, // Make optional for Google OAuth
//     roleID: { type: mongoose.Schema.Types.String, ref: 'Role', required: true },
//     isEmailVerified: { type: Boolean, default: false },
//     authProvider: { 
//         type: String, 
//         enum: ['local', 'google'], 
//         default: 'local' 
//     },
//     profileComplete: { type: Boolean, default: false }, // Track if profile is complete
//     profilePicture: { type: String }, // Store Google profile picture URL
// }, { timestamps: true });

// // Generate customerID before saving
// CustomerSchema.pre('save', async function (next) {
//     if (!this.customerID) {
//         const counter = await Counter.findOneAndUpdate(
//             { name: 'Customer' },
//             { $inc: { seq: 1 } },
//             { new: true, upsert: true }
//         );
//         this.customerID = `customer${counter.seq}`;
//     }
    
//     // Check if profile is complete
//     if (this.authProvider === 'google') {
//         this.profileComplete = !!(this.mobileNumber && this.address);
//     } else {
//         this.profileComplete = !!(this.name && this.email && this.mobileNumber && this.address);
//     }
    
//     next();
// });

// // Validation for local authentication
// CustomerSchema.pre('validate', function(next) {
//     if (this.authProvider === 'local') {
//         if (!this.password) {
//             next(new Error('Password is required for local authentication'));
//         }
//         if (!this.mobileNumber) {
//             next(new Error('Mobile number is required for local authentication'));
//         }
//         if (!this.address) {
//             next(new Error('Address is required for local authentication'));
//         }
//     }
//     next();
// });

// module.exports = mongoose.model('Customer', CustomerSchema);



const mongoose = require('mongoose');
const Counter = require('./Counter');

const CustomerSchema = new mongoose.Schema({
    customerID: { type: String, unique: true },
    googleId: { type: String, sparse: true, unique: true }, // Google OAuth ID
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { 
        type: String, 
        sparse: true, // This allows multiple null/undefined values
        default: undefined // Use undefined instead of empty string
    }, 
    address: { 
        type: String,
        default: undefined // Use undefined instead of empty string
    }, 
    password: { 
        type: String,
        default: undefined // Use undefined instead of empty string
    }, 
    roleID: { type: mongoose.Schema.Types.String, ref: 'Role', required: true },
    isEmailVerified: { type: Boolean, default: false },
    authProvider: { 
        type: String, 
        enum: ['local', 'google'], 
        default: 'local' 
    },
    profileComplete: { type: Boolean, default: false }, 
    profilePicture: { type: String }, 
}, { timestamps: true });

// Generate customerID before saving
CustomerSchema.pre('save', async function (next) {
    if (!this.customerID) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'Customer' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.customerID = `customer${counter.seq}`;
    }
    
    // Convert empty strings to undefined for sparse fields
    if (this.mobileNumber === '') {
        this.mobileNumber = undefined;
    }
    if (this.address === '') {
        this.address = undefined;
    }
    if (this.password === '') {
        this.password = undefined;
    }
    
    // Check if profile is complete
    if (this.authProvider === 'google') {
        this.profileComplete = !!(this.mobileNumber && this.address);
    } else {
        this.profileComplete = !!(this.name && this.email && this.mobileNumber && this.address);
    }
    
    next();
});

// Validation for local authentication
CustomerSchema.pre('validate', function(next) {
    if (this.authProvider === 'local') {
        if (!this.password) {
            next(new Error('Password is required for local authentication'));
        }
        if (!this.mobileNumber) {
            next(new Error('Mobile number is required for local authentication'));
        }
        if (!this.address) {
            next(new Error('Address is required for local authentication'));
        }
    }
    next();
});

module.exports = mongoose.model('Customer', CustomerSchema);