import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Connection, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

// Helper function to create JWT token
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

/**
 * User Retrieval APIs
 */

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}).select("-nonce");
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get single user by ID
export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    const user = await userModel.findById(id).select("-nonce");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get user by wallet address
export const getUserByWalletAddress = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await userModel.findOne({ walletAddress }).select("-nonce");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Authentication APIs
 */

// Step 1: Generate a nonce for wallet signature verification
export const getNonce = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }
    
    // Find or create user
    let user = await userModel.findOne({ walletAddress });
    
    if (!user) {
      // First time user - create new account
      user = await userModel.create({ 
        walletAddress,
        walletProvider: req.body.walletProvider || "Unknown"
      });
    }
    
    // Generate a new nonce
    const nonce = await user.generateNonce();
    
    return res.status(200).json({ 
      message: "Please sign this message to verify your wallet ownership",
      nonce,
      walletAddress
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Step 2: Verify wallet signature and authenticate user
export const verifyWalletSignature = async (req, res) => {
  try {
    const { walletAddress, signature, nonce, walletProvider } = req.body;
    
    if (!walletAddress || !signature || !nonce) {
      return res.status(400).json({ error: "Wallet address, signature, and nonce are required" });
    }
    
    // Find user by wallet address
    const user = await userModel.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verify that the provided nonce matches the stored nonce
    if (user.nonce !== nonce) {
      return res.status(401).json({ error: "Invalid nonce" });
    }
    
    // Construct the message that was signed
    const message = `Sign this message to authenticate with our application: ${nonce}`;
    
    // Verify signature based on wallet provider
    const isValid = await verifyWalletByProvider(
      walletAddress, 
      signature, 
      message, 
      walletProvider || user.walletProvider
    );
    
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    // Update wallet provider if it has changed
    if (walletProvider && walletProvider !== user.walletProvider) {
      user.walletProvider = walletProvider;
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = createToken(user._id);
    
    return res.status(200).json({
      message: "Authentication successful",
      user: {
        _id: user._id,
        walletAddress: user.walletAddress,
        walletProvider: user.walletProvider,
        username: user.username,
        role: user.role,
        profile: user.profile
      },
      token
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Logout user (client-side primarily, but can be used for token invalidation)
export const logoutUser = async (req, res) => {
  // In a stateless JWT system, logout is primarily client-side
  // This endpoint could be used for token blacklisting if implemented
  try {
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * User Management APIs
 */

// Create/Register user with wallet
export const registerWithWallet = async (req, res) => {
  try {
    const { walletAddress, walletProvider } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }
    
    // Check if user already exists
    const existingUser = await userModel.findOne({ walletAddress });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: "User with this wallet address already exists",
        user: existingUser
      });
    }
    
    // Create new user
    const user = await userModel.create({
      walletAddress,
      walletProvider: walletProvider || "Unknown"
    });
    
    // Generate JWT token
    const token = createToken(user._id);
    
    return res.status(201).json({
      message: "User registered successfully",
      user,
      token
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, profile } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    // Find user
    const user = await userModel.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check authorization (ensure user can only update their own profile)
    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this profile" });
    }
    
    // Prepare update object
    const updates = {};
    
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (profile) {
      if (profile.displayName) updates["profile.displayName"] = profile.displayName;
      if (profile.bio) updates["profile.bio"] = profile.bio;
      if (profile.avatar) updates["profile.avatar"] = profile.avatar;
    }
    
    // Update user with validation
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-nonce");
    
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ 
        error: "Username or email already in use" 
      });
    }
    return res.status(500).json({ error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    // Check authorization (user can delete their own account, admins can delete any)
    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this user" });
    }
    
    const deletedUser = await userModel.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Change user role (admin only)
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!role || !["user", "admin", "moderator"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }
    
    // Check if user making request is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can change user roles" });
    }
    
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-nonce");
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get current authenticated user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select("-nonce");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const verifyWalletByProvider = async (walletAddress, signature, message, walletProvider) => {
  // Basic verification for all wallet types
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);
  const publicKey = new PublicKey(walletAddress);
  
  // Default verification approach
  let isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKey.toBytes()
  );
  
  // If specific wallet providers need different verification methods, add them here
  if (walletProvider === 'Phantom') {
    // Phantom uses standard nacl verification (already handled above)
    console.log('Verifying Phantom wallet signature');
  } 
  else if (walletProvider === 'Solflare') {
    // Solflare also uses standard nacl verification (already handled above)
    console.log('Verifying Solflare wallet signature');
  }
  
  return isValid;
};