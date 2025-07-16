const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Allow CORS only from your Vercel frontend
app.use(cors({
  origin: "https://garudanproperties.vercel.app",
  credentials: true, // Optional: if you're using cookies or authorization headers
}));

app.use(express.json());

// Routes
const chatRoutes = require("./routes/chatRoutes");
const adminRoute = require("./routes/adminRoutes");

app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoute);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Server running on port", process.env.PORT);
    });
  })
  .catch(err => console.log(err));
