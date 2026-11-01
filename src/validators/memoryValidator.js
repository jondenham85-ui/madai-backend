const { validate } = require("./authValidator");

const memoryValidator = validate(["category", "value"]);

module.exports = {
  memoryValidator,
};
