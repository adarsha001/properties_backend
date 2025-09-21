// routes/excelRoutes.js
const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const ExcelData = require("../models/ExcelData.js");
const { auth } = require("../middleware/auth.js");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer setup
const upload = multer({ dest: "uploads/" });

// -------------------- Upload Excel --------------------
router.post("/upload", auth(), upload.single("file"), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);

    const sheets = workbook.SheetNames.map(sheetName => ({
      sheetName,
      data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    }));

    const excelDoc = new ExcelData({
      fileName: req.file.originalname,  // original filename
      savedFileName: req.file.filename, // multer-generated filename
      sheets,
      uploadedBy: req.user.id
    });

    await excelDoc.save();
    res.json({ message: "File uploaded & data saved", id: excelDoc._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------- Fetch Data --------------------
router.get("/data", auth(), async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") query.uploadedBy = req.user.id;

    const allData = await ExcelData.find(query).populate("uploadedBy", "username email role");
    res.json(allData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------- Update Row --------------------
router.put("/data/:id/:sheetIndex/:rowIndex", auth(), async (req, res) => {
  const { id, sheetIndex, rowIndex } = req.params;
  const { newData } = req.body;

  const doc = await ExcelData.findById(id);
  if (!doc) return res.status(404).json({ error: "Not found" });

  if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  doc.sheets[sheetIndex].data[rowIndex] = {
    ...doc.sheets[sheetIndex].data[rowIndex],
    ...newData
  };

  await doc.save();
  res.json({ message: "Row updated", data: doc });
});

// -------------------- Delete Sheet --------------------
router.delete("/data/:id/:sheetIndex", auth(), async (req, res) => {
  const { id, sheetIndex } = req.params;

  const doc = await ExcelData.findById(id);
  if (!doc) return res.status(404).json({ error: "Not found" });

  if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  doc.sheets.splice(sheetIndex, 1);
  await doc.save();
  res.json({ message: "Sheet deleted", data: doc });
});

// -------------------- Delete Entire File --------------------
router.delete("/file/:id", auth(), async (req, res) => {
  const { id } = req.params;
  const doc = await ExcelData.findById(id);
  if (!doc) return res.status(404).json({ error: "File not found" });

  if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Delete file from disk
  const filePath = path.join(__dirname, "../uploads", doc.savedFileName);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  }

  await ExcelData.findByIdAndDelete(id);
  res.json({ message: "Excel file deleted successfully" });
});

// routes/excelRoutes.js - Fix the download route
router.get("/file/download/:id", auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ExcelData.findById(id);
    if (!doc) return res.status(404).json({ error: "File not found" });

    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Use path.resolve for better path handling
    const filePath = path.resolve(__dirname, "../uploads", doc.savedFileName);
    
    console.log("Looking for file at:", filePath); // Debug log
    
    if (!fs.existsSync(filePath)) {
      console.error("File not found at path:", filePath);
      return res.status(404).json({ error: "File not found on server" });
    }

    // Set proper headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
    
    // Stream the file instead of using res.download for better error handling
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.status(500).json({ error: "Error streaming file" });
    });
    
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Error downloading file" });
  }
});
module.exports = router;
