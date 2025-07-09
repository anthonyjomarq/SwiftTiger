const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  addressStreet: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'address_street'
  },
  addressCity: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'address_city'
  },
  addressState: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'address_state'
  },
  addressZipCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'address_zip_code'
  },
  addressCountry: {
    type: DataTypes.STRING,
    defaultValue: 'USA',
    field: 'address_country'
  },
  addressPlaceId: {
    type: DataTypes.STRING,
    field: 'address_place_id'
  },
  addressLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    field: 'address_latitude'
  },
  addressLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    field: 'address_longitude'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['address_latitude', 'address_longitude'] }
  ]
});

// Virtual field for address object
Customer.prototype.getAddressObject = function() {
  return {
    street: this.addressStreet,
    city: this.addressCity,
    state: this.addressState,
    zipCode: this.addressZipCode,
    country: this.addressCountry,
    placeId: this.addressPlaceId,
    coordinates: {
      latitude: this.addressLatitude,
      longitude: this.addressLongitude
    }
  };
};

module.exports = Customer;