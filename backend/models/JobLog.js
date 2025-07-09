const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JobLog = sequelize.define('JobLog', {
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
  tableName: 'job_logs',
  timestamps: true,
  indexes: [
    { fields: ['jobId', 'createdAt'] },
    { fields: ['technicianId'] }
  ]
});

module.exports = JobLog;