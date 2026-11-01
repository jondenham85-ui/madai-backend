const synthService = require("../services/synthService");

async function processPrompt(req, res, next) {
  try {
    const result = await synthService.processPrompt(req.user, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  processPrompt,
};
