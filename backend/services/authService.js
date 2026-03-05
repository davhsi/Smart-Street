const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
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

const forgotPassword = async (payload) => {
  const { email } = payload;
  const user = await userRepository.findByEmail(email);

  if (!user) {
    // For security, do not reveal if a user exists
    return { message: "If that email is in our system, a reset token has been generated." };
  }

  // Generate a mock token
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  // Store it in global pseudo-cache (in production, use DB/Redis)
  global.resetTokens = global.resetTokens || {};
  global.resetTokens[resetToken] = {
    userId: user.user_id,
    expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
  };

  try {
    const resetUrl = `http://localhost:5173/forgot-password?token=${resetToken}`;
    const emailParams = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        email: user.email,
        link: resetUrl,
        to_email: user.email
      }
    };

    await axios.post("https://api.emailjs.com/api/v1.0/email/send", emailParams, {
      headers: {
        'Content-Type': 'application/json',
        'origin': 'http://localhost:5173'
      }
    });
  } catch (error) {
    console.error("EmailJS Error:", error.response ? error.response.data : error.message);
    const err = new Error("Failed to send reset email. Please try again later.");
    err.status = 500;
    throw err;
  }

  return { 
    message: "Reset token generated and sent to email."
  };
};

const resetPassword = async (payload) => {
  const { token, newPassword } = payload;
  
  const tokenData = global.resetTokens[token];
  if (!tokenData) {
    const err = new Error("Invalid or expired token.");
    err.status = 400;
    throw err;
  }

  if (Date.now() > tokenData.expiresAt) {
    delete global.resetTokens[token];
    const err = new Error("Token has expired.");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(tokenData.userId, passwordHash);
  
  // Cleanup token
  delete global.resetTokens[token];

  return { message: "Password has been successfully reset." };
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
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  changePassword
};
