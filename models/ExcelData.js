// models/ExcelData.js
const mongoose = require("mongoose");

const ExcelSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  savedFileName: { type: String, required: true }, // new field
  sheets: [{ sheetName: String, data: Array }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });


module.exports = mongoose.model("ExcelData", ExcelSchema);
