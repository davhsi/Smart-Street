const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const allowedRoles = ["VENDOR", "OWNER", "ADMIN"];

const toClientUser = dbUser => ({
  userId: dbUser.user_id,
  name: dbUser.name,
  email: dbUser.email,
  role: dbUser.role,
  phone: dbUser.phone
});

const signToken = payload =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

const ensureRoleAllowed = (role, adminCode) => {
  if (!allowedRoles.includes(role)) {
    const err = new Error("Unsupported role");
    err.status = 400;
    throw err;
  }

  if (role === "ADMIN") {
    const expected = process.env.ADMIN_REG_CODE;
    if (!expected || adminCode !== expected) {
      const err = new Error("Admin registration code invalid");
      err.status = 403;
      throw err;
    }
  }
};

const register = async (payload, ipAddress) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    businessName,
    category,
    licenseNumber,
    ownerName,
    contactInfo,
    adminCode
  } = payload;

  ensureRoleAllowed(role, adminCode);

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    name,
    email,
    passwordHash,
    role,
    phone
  });

  if (role === "VENDOR") {
    if (!businessName || !category || !licenseNumber) {
      const err = new Error("Vendor registration requires businessName, category, and licenseNumber");
      err.status = 400;
      throw err;
    }
    await userRepository.createVendorProfile({
      userId: user.user_id,
      businessName,
      category,
      licenseNumber
    });
  }

  if (role === "OWNER") {
    if (!ownerName || !contactInfo) {
      const err = new Error("Owner registration requires ownerName and contactInfo");
      err.status = 400;
      throw err;
    }
    await userRepository.createOwnerProfile({
      userId: user.user_id,
      ownerName,
      contactInfo
    });
  }

  const token = signToken({
    userId: user.user_id,
    role: user.role,
    email: user.email
  });

  return {
    token,
    user: toClientUser(user)
  };
};

const login = async payload => {
  const { email, password } = payload;
  const user = await userRepository.findByEmail(email);

  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = signToken({
    userId: user.user_id,
    role: user.role,
    email: user.email
  });

  return {
    token,
    user: toClientUser(user)
  };
};

const me = async userId => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return { user: toClientUser(user) };
};


const updateProfile = async (userId, payload) => {
  const { name } = payload;
  const user = await userRepository.updateUser(userId, { name });
  return toClientUser(user);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const passwordOk = await bcrypt.compare(currentPassword, user.password_hash);
  if (!passwordOk) {
    const err = new Error("Current password incorrect");
    err.status = 401;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(userId, passwordHash);
  return { message: "Password updated successfully" };
};

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword
};
