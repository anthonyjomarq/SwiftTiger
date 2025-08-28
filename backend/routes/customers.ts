import express, { Response } from 'express';
import { Op } from 'sequelize';
import { Customer } from '@models/Customer.js';
import { User } from '@models/User.js';
import { authenticate, authorize } from '@middleware/auth.js';
import { auditMiddleware } from '@middleware/audit.js';
import { validateCustomerCreate, validateCustomerUpdate } from '@middleware/validation.js';
import {
  AuthenticatedRequest,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CustomersListResponse,
  ErrorResponse,
  CustomersQuery
} from '../types/api.js';

const router = express.Router();

router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause: any = { isActive: true };
    
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
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req: any, res: any) => {
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
  } catch (error: any) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', 
  authenticate, 
  validateCustomerCreate,
  auditMiddleware('CREATE_CUSTOMER', 'CUSTOMER'),
  async (req: any, res: any) => {
    try {
      
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
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      const existingCustomer = await Customer.findOne({ where: { email, isActive: true } });
      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
      
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
        isActive: true,
        createdBy: createdById
      });
      
      const customerResponse = await Customer.findByPk(customer.id);
      
      res.status(201).json(customerResponse);
    } catch (error: any) {
      console.error('Create customer error:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      
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

router.put('/:id', 
  authenticate, 
  validateCustomerUpdate,
  auditMiddleware('UPDATE_CUSTOMER', 'CUSTOMER'),
  async (req: any, res: any) => {
    try {
      const { name, email, phone, addressStreet, addressCity, addressState, addressZipCode, addressCountry } = req.body;
      
      const customer = await Customer.findByPk(req.params.id);
      if (!customer || !customer.isActive) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const updateData: any = {
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
    } catch (error: any) {
      console.error('Update customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', 
  authenticate, 
  authorize('admin', 'manager'), 
  auditMiddleware('DELETE_CUSTOMER', 'CUSTOMER'),
  async (req: any, res: any) => {
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
    } catch (error: any) {
      console.error('Delete customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;