// routes/callDetails.js
const express = require('express');
const router = express.Router();
const CallDetail = require('../models/CallDetail');

const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
// Add call details
router.post('/', verifyToken, async (req, res) => {
  try {
    const { submissionId, buyingStatus, description, followUpDate } = req.body;
    
    const callDetail = new CallDetail({
      submissionId,
      buyingStatus,
      description,
      followUpDate: new Date(followUpDate)
    });

    await callDetail.save();
    res.status(201).send(callDetail);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get call details for a submission
router.get('/submission/:id', verifyToken, async (req, res) => {
  try {
    const callDetails = await CallDetail.find({ submissionId: req.params.id }).sort({ createdAt: -1 });
    res.send(callDetails);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Delete call detail
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await CallDetail.findByIdAndDelete(req.params.id);
    res.send({ message: 'Call detail deleted successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;