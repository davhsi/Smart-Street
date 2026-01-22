const vendorService = require("../services/vendorService");
const spaceRepository = require("../repositories/spaceRepository");

const submitRequest = async (req, res, next) => {
  try {
    const request = await vendorService.submitRequest(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Space request submitted successfully",
      request
    });
  } catch (err) {
    next(err);
  }
};

const listRequests = async (req, res, next) => {
  try {
    const requests = await vendorService.listRequests(req.user.userId);
    res.json({
      success: true,
      requests
    });
  } catch (err) {
    next(err);
  }
};

const listPublicSpaces = async (req, res, next) => {
  try {
    const spaces = await spaceRepository.listPublic();
    res.json({
      success: true,
      spaces
    });
  } catch (err) {
    next(err);
  }
};

const listPermits = async (req, res, next) => {
  try {
    const permits = await vendorService.listPermits(req.user.userId);
    res.json({
      success: true,
      permits
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitRequest,
  listRequests,
  listPublicSpaces,
  listPermits
};
