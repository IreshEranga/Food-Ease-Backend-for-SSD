const crypto = require("crypto");
const axios = require("axios");

const merchantId = "1230209";
const merchantSecret = "MTk3NzYzMDM4NjEyMjA1ODY2ODQxOTQ3MDc4NjMxMTE4ODU5NjA3NA=="; // Base64 encoded
const notifyUrl = process.env.PAYHERE_NOTIFY_URL;
const returnUrl = "http://localhost:5003/payout";
const cancelUrl = "http://localhost:5003/cancel";

// Route to send PayHere payment data to frontend
exports.startPayment = async (req, res) => {
  try {
    const { orderData } = req.body;
    const { order_id, amount, customer } = orderData;

    const currency = "LKR";
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Generate hash
    const hashedSecret = crypto
      .createHash("md5")
      .update(merchantSecret) // directly pass the base64 secret here
      .digest("hex")
      .toUpperCase();

      //console.log(merchantId);
      //console.log(order_id);
      //console.log(formattedAmount);
      //console.log(currency);
      //console.log(hashedSecret);

    const rawHash = merchantId + order_id + formattedAmount + currency + hashedSecret;

    const finalHash = crypto
      .createHash("md5")
      .update(rawHash)
      .digest("hex")
      .toUpperCase();

    //console.log(finalHash);

      

    const paymentObject = {
      sandbox: true,
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id,
      items: "Order from FoodEase",
      amount: formattedAmount,
      currency,
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: "Sri Lanka",
      hash: finalHash,
    };

    res.json(paymentObject);
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ message: "Payment setup failed" });
  }
};


exports.handlePaymentNotification = async (req, res) => {
  try {
    const paymentStatus = req.body.payment_status;
    const orderId = req.body.order_id;

    // Check if the payment was successful
    if (paymentStatus === 'Completed') {
      // Call the OrderController to update the payment status to "Paid"
      const response = await axios.put(`${ORDER_SERVICE_URL}/api/order/orders/${orderId}/status`, {
        paymentStatus: 'Paid'
      });

      if (response.status) {
        res.status(200).json({ message: "Payment successfully processed and order status updated to 'Paid'" });
      } else {
        res.status(500).json({ message: "Failed to update order status" });
      }
    } else {
      res.status(400).json({ message: "Payment failed, order status not updated" });
    }
  } catch (error) {
    console.error("Error handling payment notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Notify URL route to handle payment status from PayHere
exports.handleNotification = async (req, res) => {
  try {
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;

    if (!order_id || !payhere_amount || !status_code) {
      return res.status(400).send("Invalid notification payload");
    }

    // Decode the base64 secret (no need to decode again, the base64 is passed directly)
    const hashedSecret = crypto
      .createHash("md5")
      .update(merchantSecret, 'base64') // directly use the base64 encoded secret
      .digest("hex")
      .toUpperCase();

    const localMd5sig = crypto
      .createHash("md5")
      .update(
        merchant_id +
          order_id +
          payhere_amount +
          payhere_currency +
          status_code +
          hashedSecret
      )
      .digest("hex")
      .toUpperCase();

    if (localMd5sig === md5sig && status_code === "2") {
      // Payment successful
      try {
        const response = await axios.put(
          `${process.env.ORDER_SERVICE_URL}/api/order/orders/${order_id}/status`,
          {
            paymentStatus: "Paid",
            status: "Processing",
          }
        );

        console.log("✅ Order updated:", response.data);
        return res.status(200).send("Payment verified and order updated");
      } catch (err) {
        console.error("❌ Order update failed:", err.message);
        return res.status(500).send("Failed to update order status");
      }
    } else {
      console.warn("❌ Invalid signature or failed payment", {
        localMd5sig,
        receivedMd5sig: md5sig,
        status_code,
      });
      return res.status(400).send("Payment verification failed");
    }
  } catch (err) {
    console.error("❌ Error in notification handler:", err.message);
    res.status(500).send("Internal Server Error");
  }
};
