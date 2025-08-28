import express, { Request, Response } from 'express';
import { User } from '@models/User.js';
import { authenticate, authorize, requireMainAdmin } from '@middleware/auth.js';
import { auditMiddleware } from '@middleware/audit.js';
import { validateUserCreate, validateUserUpdate } from '@middleware/validation.js';
import {
  AuthenticatedRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UsersListResponse,
  ErrorResponse,
  UsersQuery
} from '../types/api.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'manager'), async (req: any, res: any) => {
  try {
    
    const whereClause: any = { isActive: true };
    
    if (req.query.role) {
      const roles = req.query.role.split(',').map((r: string) => r.trim());
      whereClause.role = roles;
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ users: users as any[] });
  } catch (error: any) {
    console.error('Get users error:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({ 
      message: 'Server error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', authenticate, authorize('admin', 'manager'), async (req: any, res: any) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user as any);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', 
  authenticate, 
  authorize('admin'), 
  validateUserCreate,
  auditMiddleware('CREATE_USER', 'USER'),
  async (req: any, res: any) => {
    try {
      const { name, email, password, role, isActive = true } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      if (role === 'admin' && !req.user.isMainAdmin) {
        return res.status(403).json({ message: 'Only main admin can create admin users' });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        isActive,
        isMainAdmin: role === 'admin' ? req.user.isMainAdmin : false,
        createdBy: req.user.id
      });
      
      const userResponse = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] }
      });
      
      res.status(201).json(userResponse as any);
    } catch (error: any) {
      console.error('Create user error:', {
        message: error.message,
        stack: error.stack,
        body: { ...req.body, password: '[REDACTED]' }
      });
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      res.status(500).json({ 
        message: 'Server error creating user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

router.put('/:id', 
  authenticate, 
  authorize('admin'), 
  validateUserUpdate,
  auditMiddleware('UPDATE_USER', 'USER'),
  async (req: any, res: any) => {
    try {
      const { name, email, role, isActive } = req.body;
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent main admin from being deactivated
      if (user.isMainAdmin && isActive === false) {
        return res.status(403).json({ message: 'Cannot deactivate main admin' });
      }

      // Only main admin can update other admins
      if (user.role === 'admin' && !req.user.isMainAdmin) {
        return res.status(403).json({ message: 'Only main admin can update admin users' });
      }

      // Only main admin can promote to admin
      if (role === 'admin' && !req.user.isMainAdmin) {
        return res.status(403).json({ message: 'Only main admin can promote to admin' });
      }

      const updateData: Partial<UpdateUserRequest> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      await user.update(updateData);
      
      const updatedUser = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
      
      res.json(updatedUser as any);
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', 
  authenticate, 
  requireMainAdmin, 
  auditMiddleware('DELETE_USER', 'USER'),
  async (req: any, res: any) => {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent main admin from being deleted
      if (user.isMainAdmin) {
        return res.status(403).json({ message: 'Cannot delete main admin' });
      }

      await user.update({ isActive: false });

      res.json({ message: 'User deactivated successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;