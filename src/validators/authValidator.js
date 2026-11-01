const { validate } = require("./authValidator");

const signupValidator = validate(["name", "email", "password"]);
const loginValidator = validate(["email", "password"]);

module.exports = {
  signupValidator,
  loginValidator,
};
