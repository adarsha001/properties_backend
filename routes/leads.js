const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

router.post('/', async (req, res) => {
  try {
    const { name, phone, propertyId } = req.body;
    const lead = new Lead({ name, phone, propertyId });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

module.exports = router;
