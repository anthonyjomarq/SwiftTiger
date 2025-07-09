const express = require('express');
const User = require('../models/User');
const { authenticate, authorize, requireMainAdmin } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { validateUserCreate, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// Get all users
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    console.log('👥 GET /users - Fetching users with query params:', req.query);
    
    // Build where clause based on query params
    const whereClause = { isActive: true };
    
    // Handle role filtering
    if (req.query.role) {
      const roles = req.query.role.split(',').map(r => r.trim());
      whereClause.role = roles;
    }
    
    console.log('🔍 Where clause:', whereClause);
    
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      // Temporarily removing self-referential includes to fix 500 errors
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Get users error:', {
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

// Get user by ID
router.get('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
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
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user
router.post('/', 
  authenticate, 
  authorize('admin'), 
  validateUserCreate,
  auditMiddleware('CREATE_USER', 'USER'),
  async (req, res) => {
    try {
      console.log('👤 POST /users - Creating user with data:', { 
        ...req.body, 
        password: '[REDACTED]' 
      });
      
      const { name, email, password, role, isActive = true } = req.body;

      if (!name || !email || !password || !role) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      console.log('🔍 Checking if user exists with email:', email);
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        console.log('⚠️ User already exists');
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Only main admin can create other admins
      if (role === 'admin' && !req.user.isMainAdmin) {
        console.log('❌ Unauthorized admin creation attempt');
        return res.status(403).json({ message: 'Only main admin can create admin users' });
      }

      console.log('➕ Creating new user...');
      const user = await User.create({
        name,
        email,
        password,
        role,
        isActive,
        createdBy: req.user.id
      });

      console.log(`✅ User created with ID: ${user.id}`);
      
      // Return user without password and without problematic includes
      const userResponse = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] }
      });
      
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('❌ Create user error:', {
        message: error.message,
        stack: error.stack,
        body: { ...req.body, password: '[REDACTED]' }
      });
      
      // Handle specific database errors
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

// Update user
router.put('/:id', 
  authenticate, 
  authorize('admin'), 
  validateUserUpdate,
  auditMiddleware('UPDATE_USER', 'USER'),
  async (req, res) => {
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

      const updateData = {};
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
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete user (soft delete)
router.delete('/:id', 
  authenticate, 
  requireMainAdmin, 
  auditMiddleware('DELETE_USER', 'USER'),
  async (req, res) => {
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
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;