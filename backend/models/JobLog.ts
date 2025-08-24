import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface PhotoObject {
  filename: string;
  path: string;
  [key: string]: any;
}

export interface JobLogAttributes {
  id: string;
  jobId: string;
  technicianId: string;
  notes: string;
  photos: PhotoObject[];
  workStartTime?: Date | null;
  workEndTime?: Date | null;
  statusUpdate?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobLogCreationAttributes extends Omit<JobLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export class JobLog extends Model<JobLogAttributes, JobLogCreationAttributes> implements JobLogAttributes {
  public id!: string;
  public jobId!: string;
  public technicianId!: string;
  public notes!: string;
  public photos!: PhotoObject[];
  public workStartTime!: Date | null;
  public workEndTime!: Date | null;
  public statusUpdate!: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

JobLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  photos: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of photo objects with filename, path, etc.'
  },
  workStartTime: {
    type: DataTypes.DATE
  },
  workEndTime: {
    type: DataTypes.DATE
  },
  statusUpdate: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Cancelled')
  }
}, {
  sequelize,
  tableName: 'job_logs',
  timestamps: true,
  indexes: [
    { fields: ['jobId', 'createdAt'] },
    { fields: ['technicianId'] }
  ]
});

export default JobLog;