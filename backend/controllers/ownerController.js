const ownerService = require("../services/ownerService");

const createSpace = async (req, res, next) => {
  try {
    const result = await ownerService.createSpace(req.user.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listSpaces = async (req, res, next) => {
  try {
    console.log(`[DEBUG] Controller listSpaces user: ${req.user.userId}`);
    const result = await ownerService.listSpaces(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const listRequests = async (req, res, next) => {
  try {
    const result = await ownerService.listRequests(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSpace,
  listSpaces,
  listRequests
};
