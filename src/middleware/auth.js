const { processPrompt } = require("../services/synthService");

async function handlePrompt(req, res, next) {
  try {
    const result = await processPrompt(req.user, { prompt: req.body?.prompt });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  handlePrompt,
};
