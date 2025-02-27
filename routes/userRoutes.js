import express from 'express';
import { 
  getAllUsers, 
  getSingleUser, 
  getUserByWalletAddress,
  getNonce,
  verifyWalletSignature,
  registerWithWallet,
  updateUserProfile,
  deleteUser,
  getCurrentUser,
  logoutUser
} from '../controllers/userController.js';
import { requireAuth } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/getAllUser', getAllUsers);
router.get('/user/:id', getSingleUser);
router.get('/wallet/:walletAddress', getUserByWalletAddress);

// Wallet authentication routes
router.post('/nonce', getNonce);
router.post('/verify', verifyWalletSignature);
router.post('/register', registerWithWallet);
router.post('/logout', logoutUser);

// Protected routes (require authentication)
router.use('/protected', requireAuth); // Apply middleware to all routes below this
router.get('/protected/me', getCurrentUser);
router.patch('/protected/profile/:id', updateUserProfile);
router.delete('/protected/user/:id', deleteUser);

export default router;