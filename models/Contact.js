const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  callDetails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallDetail'
  }],
  marked: { type: Boolean, default: false }, // Add this line
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Contact', contactSchema);