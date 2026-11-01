const { validate } = require("../validators/authValidator");

const synthValidator = validate(["prompt"]);

module.exports = {
  synthValidator,
};
