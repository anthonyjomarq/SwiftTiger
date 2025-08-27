import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface AddressObject {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  placeId?: string;
  coordinates: {
    latitude?: number;
    longitude?: number;
  };
}

export interface CustomerAttributes {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  addressPlaceId?: string | null;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerCreationAttributes extends Omit<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare addressStreet: string;
  declare addressCity: string;
  declare addressState: string;
  declare addressZipCode: string;
  declare addressCountry: string;
  declare addressPlaceId: string | null;
  declare addressLatitude: number | null;
  declare addressLongitude: number | null;
  declare isActive: boolean;
  declare createdBy: string;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public getAddressObject(): AddressObject {
    return {
      street: this.addressStreet,
      city: this.addressCity,
      state: this.addressState,
      zipCode: this.addressZipCode,
      country: this.addressCountry,
      placeId: this.addressPlaceId || undefined,
      coordinates: {
        latitude: this.addressLatitude || undefined,
        longitude: this.addressLongitude || undefined
      }
    };
  }
}

Customer.init({
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
    defaultValue: true,
    field: 'is_active'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    field: 'updated_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  tableName: 'customers',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['address_latitude', 'address_longitude'] }
  ]
});

export default Customer;