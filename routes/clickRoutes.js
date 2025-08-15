// routes/clickRoutes.js
const express = require("express");
const Click = require("../models/Click");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { type, value, sourceComponent } = req.body;

    if (!type || !value || !sourceComponent) {
      return res.status(400).json({
        error: "Type, value, and sourceComponent are required"
      });
    }

    let click = await Click.findOne({ type, value, sourceComponent });

    if (!click) {
      click = new Click({ type, value, sourceComponent, count: 1 });
    } else {
      click.count += 1;
    }

    await click.save();
    res.json({ message: "Click recorded", click });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View all clicks
router.get("/", async (req, res) => {
  try {
    const clicks = await Click.find();
    res.json(clicks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
