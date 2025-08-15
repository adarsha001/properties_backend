  // models/Click.js
const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["phone", "email", "whatsapp"],
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  sourceComponent: {
    type: String, // e.g., "Marquee", "Footer", "ContactCard"
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

// Ensure unique per component+value+type
clickSchema.index({ type: 1, value: 1, sourceComponent: 1 }, { unique: true });
module.exports = mongoose.model("Click", clickSchema);
