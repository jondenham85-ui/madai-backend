const { validateRequiredFields } = require("./authValidator");

const signupValidator = validateRequiredFields(["name", "email", "password"]);
const loginValidator = validateRequiredFields(["email", "password"]);

module.exports = {
  signupValidator,
  loginValidator,
};
