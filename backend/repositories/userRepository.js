const db = require("../config/db");

const createUser = async ({ name, email, passwordHash, role, phone }) => {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, email, passwordHash, role, phone]
  );
  return result.rows[0];
};

const findByEmail = async email => {
  const result = await db.query(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  return result.rows[0];
};

const findById = async userId => {
  const result = await db.query(
    `SELECT * FROM users WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

const createVendorProfile = async ({ userId, businessName, category, licenseNumber }) => {
  const result = await db.query(
    `INSERT INTO vendors (user_id, business_name, category, license_number)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, businessName, category, licenseNumber]
  );
  return result.rows[0];
};

const createOwnerProfile = async ({ userId, ownerName, contactInfo }) => {
  const result = await db.query(
    `INSERT INTO owners (user_id, owner_name, contact_info)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, ownerName, contactInfo]
  );
  return result.rows[0];
};


const updateUser = async (userId, { name }) => {
  const result = await db.query(
    `UPDATE users SET name = $1 WHERE user_id = $2 RETURNING *`,
    [name, userId]
  );
  return result.rows[0];
};

const updatePassword = async (userId, passwordHash) => {
  await db.query(
    `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
    [passwordHash, userId]
  );
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  createVendorProfile,
  createOwnerProfile,
  updateUser,
  updatePassword
};
