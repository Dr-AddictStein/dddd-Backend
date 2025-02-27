import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new mongoose.Schema({
  // Primary identifier - wallet address
  walletAddress: {
    type: String,
    required: [true, "Wallet address is required"],
    unique: true,
    trim: true
  },
  
  // Optional username (if you want users to set a custom username)
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values (for users who don't set a username)
    trim: true,
    maxlength: [30, "Username cannot exceed 30 characters"]
  },
  
  // Wallet provider info
  walletProvider: {
    type: String,
    trim: true,
    default: "Unknown"
  },
  
  // Profile information (expandable)
  profile: {
    displayName: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"]
    },
    avatar: {
      type: String, // URL to avatar image
      default: ""
    }
  },
  
  // Email (optional - for notifications)
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Please provide a valid email"
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Account verification
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Role-based access control
  role: {
    type: String,
    enum: ["user", "admin", "moderator"],
    default: "user"
  },
  
  // For Nonce-based wallet authentication
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Index for faster queries
userSchema.index({ walletAddress: 1 });

// Method to generate a new nonce for wallet signature verification
userSchema.methods.generateNonce = async function() {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
  await this.save();
  return this.nonce;
};

// Method to safely return user data without sensitive information
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.nonce; // Don't expose the nonce
  return user;
};

const User = mongoose.model("UserCollection", userSchema);

export default User;