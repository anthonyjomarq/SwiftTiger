import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  | 'CREATE_JOB'
  | 'UPDATE_JOB'
  | 'DELETE_JOB'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'CREATE_JOB_LOG'
  | 'UPDATE_JOB_LOG'
  | 'DELETE_JOB_LOG'
  | 'ROLE_CHANGE'
  | 'PASSWORD_CHANGE';

export interface AuditLogAttributes {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuditLogCreationAttributes extends Omit<AuditLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public userId!: string;
  public action!: AuditAction;
  public resource!: string;
  public resourceId!: string | null;
  public details!: Record<string, any> | null;
  public ipAddress!: string | null;
  public userAgent!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'LOGIN',
      'LOGOUT',
      'CREATE_CUSTOMER',
      'UPDATE_CUSTOMER',
      'DELETE_CUSTOMER',
      'CREATE_JOB',
      'UPDATE_JOB',
      'DELETE_JOB',
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'CREATE_JOB_LOG',
      'UPDATE_JOB_LOG',
      'DELETE_JOB_LOG',
      'ROLE_CHANGE',
      'PASSWORD_CHANGE'
    ),
    allowNull: false
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceId: {
    type: DataTypes.UUID
  },
  details: {
    type: DataTypes.JSONB,
    comment: 'Additional details about the action'
  },
  ipAddress: {
    type: DataTypes.INET
  },
  userAgent: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['action'] },
    { fields: ['resource'] },
    { fields: ['createdAt'] }
  ]
});

export default AuditLog;