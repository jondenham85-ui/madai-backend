const memoryService = require("../services/memoryService");

async function listMemories(req, res, next) {
  try {
    const memories = await memoryService.listMemories(req.user.id, req.query.category);
    return res.status(200).json({ success: true, memories });
  } catch (error) {
    return next(error);
  }
}

async function createMemory(req, res, next) {
  try {
    const memory = await memoryService.createMemory(req.user.id, req.body);
    return res.status(201).json({ success: true, memory });
  } catch (error) {
    return next(error);
  }
}

async function deleteMemory(req, res, next) {
  try {
    const result = await memoryService.deleteMemory(req.user.id, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listMemories,
  createMemory,
  deleteMemory,
};
