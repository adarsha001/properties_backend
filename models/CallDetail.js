// models/CallDetail.js
const mongoose = require('mongoose');

const callDetailSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSubmission', required: true },
  buyingStatus: { type: String, enum: ['high', 'mid', 'low'], required: true },
  description: { type: String, required: true },
  followUpDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CallDetail', callDetailSchema);