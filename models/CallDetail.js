const mongoose = require("mongoose");

const callDetailSchema = new mongoose.Schema({
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  chat: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat' 
  },
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
});
module.exports = mongoose.model('CallDetail', callDetailSchema);