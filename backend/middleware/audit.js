const AuditLog = require('../models/AuditLog');

const createAuditLog = async (user, action, resource, resourceId = null, details = {}) => {
  try {
    await AuditLog.create({
      userId: user.id,
      action,
      resource,
      resourceId,
      details,
      ipAddress: user.ipAddress,
      userAgent: user.userAgent
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = data?._id || data?.id || req.params?.id;
        const details = {
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query
        };
        
        req.user.ipAddress = req.ip;
        req.user.userAgent = req.get('User-Agent');
        
        createAuditLog(req.user, action, resource, resourceId, details);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = { createAuditLog, auditMiddleware };