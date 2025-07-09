const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
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
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'] },
    { fields: ['action'] },
    { fields: ['resource'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = AuditLog;