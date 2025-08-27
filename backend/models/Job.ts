import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface JobAttributes {
  id: string;
  jobName: string;
  description: string;
  customerId: string;
  serviceType: 'New Account' | 'Replacement' | 'Training' | 'Maintenance';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedTo?: string | null;
  scheduledDate?: Date | null;
  completedDate?: Date | null;
  estimatedDuration: number;
  actualDuration?: number | null;
  createdBy: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobCreationAttributes extends Omit<JobAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  declare id: string;
  declare jobName: string;
  declare description: string;
  declare customerId: string;
  declare serviceType: 'New Account' | 'Replacement' | 'Training' | 'Maintenance';
  declare priority: 'Low' | 'Medium' | 'High';
  declare status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  declare assignedTo: string | null;
  declare scheduledDate: Date | null;
  declare completedDate: Date | null;
  declare estimatedDuration: number;
  declare actualDuration: number | null;
  declare createdBy: string;
  declare updatedBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Job.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  serviceType: {
    type: DataTypes.ENUM('New Account', 'Replacement', 'Training', 'Maintenance'),
    allowNull: false,
    field: 'service_type'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  scheduledDate: {
    type: DataTypes.DATE,
    field: 'scheduled_date'
  },
  completedDate: {
    type: DataTypes.DATE,
    field: 'completed_date'
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 120,
    field: 'estimated_duration',
    comment: 'Duration in minutes'
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    field: 'actual_duration',
    comment: 'Duration in minutes'
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
  tableName: 'jobs',
  timestamps: true,
  indexes: [
    { fields: ['customer_id'] },
    { fields: ['assigned_to'] },
    { fields: ['status'] },
    { fields: ['scheduled_date'] },
    { fields: ['priority'] }
  ]
});

export default Job;