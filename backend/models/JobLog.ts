import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface PhotoObject {
  filename: string;
  originalName: string;
  path: string;
  caption?: string;
  mimetype: string;
  size: number;
  timestamp: Date;
}

export interface SignatureObject {
  signature: string; // Base64 image data
  signerName: string;
  signerTitle?: string;
  timestamp: Date;
}

export interface JobLogAttributes {
  id: string;
  jobId: string;
  technicianId: string;
  notes: string;
  photos: PhotoObject[];
  signature?: SignatureObject | null;
  workStartTime?: Date | null;
  workEndTime?: Date | null;
  actualDuration?: number | null; // Duration in minutes
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
  declare signature: SignatureObject | null;
  declare workStartTime: Date | null;
  declare workEndTime: Date | null;
  declare actualDuration: number | null;
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
    comment: 'Array of photo objects with metadata'
  },
  signature: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Digital signature object with base64 data and signer info'
  },
  workStartTime: {
    type: DataTypes.DATE,
    field: 'work_start_time'
  },
  workEndTime: {
    type: DataTypes.DATE,
    field: 'work_end_time'
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'actual_duration',
    comment: 'Actual work duration in minutes'
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