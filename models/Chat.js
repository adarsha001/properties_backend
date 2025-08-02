const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  intent: String,
  budget: String,
  propertyType: String,
  location: String,
  scheduleDate: String,
  scheduleTime: String,
  name: String,
  phone: String,
  contacted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  callDetails: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CallDetail' 
  }]
});

module.exports = mongoose.model("Chat", chatSchema);