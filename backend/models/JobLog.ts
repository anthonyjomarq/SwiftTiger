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
  declare id: string;
  declare jobId: string;
  declare technicianId: string;
  declare notes: string;
  declare photos: PhotoObject[];
  declare workStartTime: Date | null;
  declare workEndTime: Date | null;
  declare statusUpdate: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
    field: 'job_id',
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'technician_id',
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
    type: DataTypes.DATE,
    field: 'work_start_time'
  },
  workEndTime: {
    type: DataTypes.DATE,
    field: 'work_end_time'
  },
  statusUpdate: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Cancelled'),
    field: 'status_update'
  }
}, {
  sequelize,
  tableName: 'job_logs',
  timestamps: true,
  indexes: [
    { fields: ['job_id', 'created_at'] },
    { fields: ['technician_id'] }
  ]
});

export default JobLog;