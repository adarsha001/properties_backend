const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = ["https://sppropertiesbengaluru.com","http://localhost:5173"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
const chatRoutes = require("./routes/chatRoutes");
const adminRoute = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");
const leadsRoute=require("./routes/leads")
const callDetailRoutes = require('./routes/callDetails');
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/leads", leadsRoute);
app.use('/api/callDetails', callDetailRoutes);

app.use('/api/contact', contactRoutes);
// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Server running on port", process.env.PORT);
    });
  })
  .catch(err => console.log(err));
