const { validateRequiredFields } = require("./authValidator");

const synthValidator = validateRequiredFields(["prompt"]);

module.exports = {
  synthValidator,
};
