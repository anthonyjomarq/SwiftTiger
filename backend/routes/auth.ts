import express, { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '@models/User.js';
import { authenticate } from '@middleware/auth.js';
import { createAuditLog } from '@middleware/audit.js';
import { validateLogin, validatePasswordChange } from '@middleware/validation.js';
import {
  AuthenticatedRequest,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  ErrorResponse
} from '../types/api.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateLogin, async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const payload = { id: user.id, email: user.email, role: user.role };
    const secret = process.env.JWT_SECRET as string;
    const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
    const token = jwt.sign(payload, secret, options as any);

    // Create audit log
    const auditUser = user as any;
    auditUser.ipAddress = req.ip;
    auditUser.userAgent = req.get('User-Agent');
    await createAuditLog(auditUser, 'LOGIN', 'AUTH');

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isMainAdmin: user.isMainAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', authenticate, async (req: any, res: any) => {
  try {
    req.user.ipAddress = req.ip;
    req.user.userAgent = req.get('User-Agent');
    await createAuditLog(req.user, 'LOGOUT', 'AUTH');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, (req: any, res: any) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    isMainAdmin: req.user.isMainAdmin
  });
});

// Change password
router.put('/change-password', authenticate, validatePasswordChange, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    req.user.ipAddress = req.ip;
    req.user.userAgent = req.get('User-Agent');
    await createAuditLog(req.user, 'PASSWORD_CHANGE', 'AUTH');

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;