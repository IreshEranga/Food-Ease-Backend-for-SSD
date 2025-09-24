// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const Customer = require('../models/Customer');
// const jwt = require('jsonwebtoken');

// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/api/users/auth/google/callback"
//   },
//   async (accessToken, refreshToken, profile, done) => {
//     try {
//       let existingUser = await Customer.findOne({ 
//         $or: [
//           { googleId: profile.id },
//           { email: profile.emails[0].value }
//         ]
//       });

//       if (existingUser) {
//         if (!existingUser.googleId) {
//           existingUser.googleId = profile.id;
//           existingUser.authProvider = 'google';
//           existingUser.isEmailVerified = true;
//           await existingUser.save();
//         }
//         return done(null, existingUser);
//       }

//       const newUser = new Customer({
//         googleId: profile.id,
//         name: profile.displayName,
//         email: profile.emails[0].value,
//         mobileNumber: '',
//         address: '',
//         password: '',
//         roleID: 'role3',
//         isEmailVerified: true,
//         authProvider: 'google',
//         profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : ''
//       });

//       const savedUser = await newUser.save();
//       return done(null, savedUser);
//     } catch (error) {
//       console.error('Error in Google OAuth:', error);
//       return done(error, null);
//     }
//   }
// ));

// // Disable session serialization since we're using JWT
// passport.serializeUser((user, done) => {
//   done(null, user._id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await Customer.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// module.exports = passport;


const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/users/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let existingUser = await Customer.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });

      if (existingUser) {
        if (!existingUser.googleId) {
          existingUser.googleId = profile.id;
          existingUser.authProvider = 'google';
          existingUser.isEmailVerified = true;
          await existingUser.save();
        }
        return done(null, existingUser);
      }

      const newUser = new Customer({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        // Don't set empty strings - let them be undefined
        mobileNumber: undefined, // This will be undefined, not empty string
        address: undefined,      // This will be undefined, not empty string
        password: undefined,     // This will be undefined, not empty string
        roleID: 'role3',
        isEmailVerified: true,
        authProvider: 'google',
        profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
      });

      const savedUser = await newUser.save();
      return done(null, savedUser);
    } catch (error) {
      console.error('Error in Google OAuth:', error);
      return done(error, null);
    }
  }
));

// Disable session serialization since we're using JWT
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Customer.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;