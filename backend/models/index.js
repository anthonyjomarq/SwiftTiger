const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Job = require('./Job');
const JobLog = require('./JobLog');
const AuditLog = require('./AuditLog');

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

module.exports = {
  sequelize,
  User,
  Customer,
  Job,
  JobLog,
  AuditLog
};