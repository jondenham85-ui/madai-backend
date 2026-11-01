const { validateRequiredFields } = require("./authValidator");

const memoryValidator = validateRequiredFields(["category", "value"]);

module.exports = {
  memoryValidator,
};
