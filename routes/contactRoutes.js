const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const CallDetail = require('../models/CallDetail');
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
 
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Public contact form submission
router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    const newContact = new Contact({ name, email, phone, message });
    await newContact.save();
    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error saving contact form:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate('callDetails') // This populates the actual call detail documents
      .sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Contact not found" });
    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

router.post('/:id/call-details', auth, async (req, res) => {
  try {
    const { buyingStatus, description, followUpDate } = req.body;
    const contactId = req.params.id;

    if (!buyingStatus || !description || !followUpDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify contact exists
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const callDetail = new CallDetail({
      contact: contactId,
      buyingStatus,
      description,
      followUpDate
    });

    const savedCallDetail = await callDetail.save();

    // Update contact with the new call detail reference
    contact.callDetails.push(savedCallDetail._id);
    await contact.save();

    // Return the populated call detail
    const populatedDetail = await CallDetail.findById(savedCallDetail._id);
    res.status(201).json(populatedDetail);
  } catch (error) {
    console.error('Error adding contact call detail:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/:id/call-details', auth, async (req, res) => {
  try {
    const contactId = req.params.id;

    // Verify contact exists
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const callDetails = await CallDetail.find({ contact: contactId })
      .sort({ createdAt: -1 })
      .exec();

    res.json(callDetails);
  } catch (error) {
    console.error('Error fetching contact call details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.patch('/:id/mark', auth, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }

    // Toggle the marked status
    contact.marked = !contact.marked;
    await contact.save();

    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete call detail
router.delete('/call-details/:id', auth, async (req, res) => {
  try {
    const callDetailId = req.params.id;

    // First find the call detail to get the contact reference
    const callDetail = await CallDetail.findById(callDetailId);
    if (!callDetail) {
      return res.status(404).json({ message: 'Call detail not found' });
    }

    // Remove from contact's callDetails array
    await Contact.findByIdAndUpdate(
      callDetail.contact,
      { $pull: { callDetails: callDetailId } }
    );

    // Delete the call detail
    await CallDetail.findByIdAndDelete(callDetailId);

    res.json({ success: true, message: 'Call detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting call detail:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;