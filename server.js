const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const chatRoutes = require("./routes/chatRoutes");
const adminRoute = require("./routes/adminRoutes");
app.use("/api/chat", chatRoutes);
app.use("/api/admin",adminRoute)

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Server running on port", process.env.PORT);
    });
  })
  .catch(err => console.log(err));
