const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'manager', 'agent'],
    default: 'agent'
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loginHistory: [{
    loginAt: { type: Date, default: Date.now },
    logoutAt: Date,
    durationMinutes: Number,
    ipAddress: String
  }]
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
// In your User model (models/User.js)
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    {
      userId: this._id,
      role: this.role,
      username: this.username
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return token;
};
module.exports = mongoose.model('User', userSchema);