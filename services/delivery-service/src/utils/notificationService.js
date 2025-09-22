const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-service-account.json')),
});

async function sendNotification(payload) {
  const message = {
    notification: {
      title: 'New Delivery Request',
      body: payload.message,
    },
    data: {
      orderId: payload.orderId,
      restaurantId: payload.restaurantId,
      type: payload.type,
    },
    token: payload.driverId, // Assumes driverId is the FCM token
  };
  await admin.messaging().send(message);
}

module.exports = {
  sendNotification,
};