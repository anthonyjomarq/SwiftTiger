const express = require('express');
const { Op } = require('sequelize');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { validateCustomerCreate, validateCustomerUpdate } = require('../middleware/validation');

const router = express.Router();

// Get all customers
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = { isActive: true };
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const customers = await Customer.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'Updater',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    });

    const total = await Customer.count({ where: whereClause });

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'Updater',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!customer || !customer.isActive) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create customer
router.post('/', 
  authenticate, 
  validateCustomerCreate,
  auditMiddleware('CREATE_CUSTOMER', 'CUSTOMER'),
  async (req, res) => {
    try {
      console.log('🏢 POST /customers - Creating customer with data:', req.body);
      
      const { 
        name, 
        email, 
        phone, 
        addressStreet, 
        addressCity, 
        addressState, 
        addressZipCode, 
        addressCountry,
        addressLatitude,
        addressLongitude,
        addressPlaceId
      } = req.body;

      if (!name || !email || !phone || !addressStreet || !addressCity || !addressState || !addressZipCode) {
        console.log('❌ Missing required fields for customer creation');
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      // Check for existing customer with same email
      console.log('🔍 Checking for existing customer with email:', email);
      const existingCustomer = await Customer.findOne({ where: { email, isActive: true } });
      if (existingCustomer) {
        console.log('⚠️ Customer already exists');
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }

      console.log('➕ Creating new customer...');
      
      const createdById = req.user.id;
      
      const customer = await Customer.create({
        name,
        email,
        phone,
        addressStreet,
        addressCity,
        addressState,
        addressZipCode,
        addressCountry: addressCountry || 'USA',
        addressLatitude: addressLatitude || null,
        addressLongitude: addressLongitude || null,
        addressPlaceId: addressPlaceId || null,
        createdBy: createdById
      });

      console.log(`✅ Customer created with ID: ${customer.id}`);
      
      // Return customer without problematic includes
      const customerResponse = await Customer.findByPk(customer.id);
      
      res.status(201).json(customerResponse);
    } catch (error) {
      console.error('❌ Create customer error:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      
      // Handle specific database errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
      
      res.status(500).json({ 
        message: 'Server error creating customer',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update customer
router.put('/:id', 
  authenticate, 
  validateCustomerUpdate,
  auditMiddleware('UPDATE_CUSTOMER', 'CUSTOMER'),
  async (req, res) => {
    try {
      const { name, email, phone, addressStreet, addressCity, addressState, addressZipCode, addressCountry } = req.body;
      
      const customer = await Customer.findByPk(req.params.id);
      if (!customer || !customer.isActive) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const updateData = {
        updatedBy: req.user.id
      };
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (addressStreet) updateData.addressStreet = addressStreet;
      if (addressCity) updateData.addressCity = addressCity;
      if (addressState) updateData.addressState = addressState;
      if (addressZipCode) updateData.addressZipCode = addressZipCode;
      if (addressCountry) updateData.addressCountry = addressCountry;
      
      await customer.update(updateData);

      const updatedCustomer = await Customer.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'Updater',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json(updatedCustomer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete customer (soft delete)
router.delete('/:id', 
  authenticate, 
  authorize('admin', 'manager'), 
  auditMiddleware('DELETE_CUSTOMER', 'CUSTOMER'),
  async (req, res) => {
    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer || !customer.isActive) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      await customer.update({
        isActive: false,
        updatedBy: req.user.id
      });

      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;