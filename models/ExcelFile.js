const mongoose = require('mongoose');

const excelFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  path: { type: String }, // Optional if storing file path
  data: { type: Buffer, required: true }, // The actual file data
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  processed: { type: Boolean, default: false },
  metadata: { type: Object } // For any additional data you want to store
}, { timestamps: true });

module.exports = mongoose.model('ExcelFile', excelFileSchema);