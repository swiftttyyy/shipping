const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  orderId: String,
  status: String,
  name: String,
  amount: Number,
  toAddress: String,
  fromAddress:String,
  history: [{ date: { type: Date, default: Date.now }, status: String }],
  trackingNumber: String, // Add trackingNumber field
  trackingHistory: [{ date: { type: Date, default: Date.now }, status: String }], // Add trackingHistory field,
});
  
  const Order = mongoose.model('Order', orderSchema);

  module.exports = Order