const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { checkInactiveSessions } = require('./middleware/auth');
const app = express();
// const { checkInactiveSessions } = require('./middleware/auth');
const User = require('./models/User');
const allowedOrigins = ['https://sppropertiesbengaluru.com', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const contactRoutes = require('./routes/contactRoutes');
const leadsRoutes = require('./routes/leads');
const callDetailRoutes = require('./routes/callDetails');
const authRoutes = require('./routes/authRoutes');

// ... other routes

app.use('/api/auth', authRoutes);

// ... other route uses
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/callDetails', callDetailRoutes);
app.use('/api/contact', contactRoutes);

setInterval(async () => {
  try {
    const users = await User.find({
      'loginHistory.logoutTime': { $exists: false }
    });
    
    for (const user of users) {
      await checkInactiveSessions(user);
    }
  } catch (err) {
    console.error('Error checking inactive sessions:', err);
  }
}, 1000);
// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // Create initial admin user if doesn't exist
    // createInitialAdmin();
    
    app.listen(process.env.PORT, () => {
      console.log('Server running on port', process.env.PORT);
    });
  })
  .catch(err => console.log(err));

// async function createInitialAdmin() {
//   const User = require('./models/User');
//   // const adminExists = await User.findOne({ username: 'admin' });
  
  
//     const admin = new User({
//       username: 'varshan',
//       password: process.env.ADMIN_INITIAL_PASSWORD_VARSHAN ,
//       email: 'varshan@gmail.com', 
//       fullName: 'varshankumar',
//       role: 'manager', 
//       isActive: true
//     });
    
//     await admin.save();
//     console.log('Initial admin user created');
  
// }