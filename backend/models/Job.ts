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
  public id!: string;
  public jobName!: string;
  public description!: string;
  public customerId!: string;
  public serviceType!: 'New Account' | 'Replacement' | 'Training' | 'Maintenance';
  public priority!: 'Low' | 'Medium' | 'High';
  public status!: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  public assignedTo!: string | null;
  public scheduledDate!: Date | null;
  public completedDate!: Date | null;
  public estimatedDuration!: number;
  public actualDuration!: number | null;
  public createdBy!: string;
  public updatedBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  serviceType: {
    type: DataTypes.ENUM('New Account', 'Replacement', 'Training', 'Maintenance'),
    allowNull: false
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
    references: {
      model: 'users',
      key: 'id'
    }
  },
  scheduledDate: {
    type: DataTypes.DATE
  },
  completedDate: {
    type: DataTypes.DATE
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 120,
    comment: 'Duration in minutes'
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    comment: 'Duration in minutes'
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
  sequelize,
  tableName: 'jobs',
  timestamps: true,
  indexes: [
    { fields: ['customerId'] },
    { fields: ['assignedTo'] },
    { fields: ['status'] },
    { fields: ['scheduledDate'] },
    { fields: ['priority'] }
  ]
});

export default Job;