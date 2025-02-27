// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

export const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const { authorization } = req.headers;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    const token = authorization.split(' ')[1];
    
    // Verify token
    const { _id } = jwt.verify(token, process.env.SECRET);
    
    // Add user to request
    req.user = await userModel.findById(_id).select('-nonce');
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Request is not authorized' });
  }
};