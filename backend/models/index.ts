import { sequelize } from '../config/database.js';
import User from './User.js';
import Customer from './Customer.js';
import Job from './Job.js';
import JobLog from './JobLog.js';
import AuditLog from './AuditLog.js';

// Define associations
User.hasMany(Customer, { foreignKey: 'createdBy', as: 'CreatedCustomers' });
User.hasMany(Customer, { foreignKey: 'updatedBy', as: 'UpdatedCustomers' });
Customer.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });
Customer.belongsTo(User, { foreignKey: 'updatedBy', as: 'Updater' });

Customer.hasMany(Job, { foreignKey: 'customerId', as: 'Jobs' });
Job.belongsTo(Customer, { foreignKey: 'customerId', as: 'Customer' });

User.hasMany(Job, { foreignKey: 'assignedTo', as: 'AssignedJobs' });
User.hasMany(Job, { foreignKey: 'createdBy', as: 'CreatedJobs' });
User.hasMany(Job, { foreignKey: 'updatedBy', as: 'UpdatedJobs' });
Job.belongsTo(User, { foreignKey: 'assignedTo', as: 'AssignedTechnician' });
Job.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });
Job.belongsTo(User, { foreignKey: 'updatedBy', as: 'Updater' });

Job.hasMany(JobLog, { foreignKey: 'jobId', as: 'Logs' });
JobLog.belongsTo(Job, { foreignKey: 'jobId', as: 'Job' });

User.hasMany(JobLog, { foreignKey: 'technicianId', as: 'JobLogs' });
JobLog.belongsTo(User, { foreignKey: 'technicianId', as: 'Technician' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'AuditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export {
  sequelize,
  User,
  Customer,
  Job,
  JobLog,
  AuditLog
};

export default {
  sequelize,
  User,
  Customer,
  Job,
  JobLog,
  AuditLog
};