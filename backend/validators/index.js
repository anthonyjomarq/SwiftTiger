// Export all validators for easy importing
const jobValidators = require("./jobValidator");
const customerValidators = require("./customerValidator");

module.exports = {
  ...jobValidators,
  ...customerValidators,
};
