const authService = require("../services/authService");

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, req.ip);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.me(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};


const updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword
};
