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
    buyingStatus: { 
      type: String, 
      enum: ['high', 'mid', 'low'], 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    followUpDate: { 
      type: Date, 
      required: true 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
});

module.exports = mongoose.model("Chat", chatSchema);