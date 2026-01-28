const db = require("../config/db");

const findByUserId = async userId => {
  const result = await db.query(
    `SELECT * FROM vendors WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

module.exports = {
  findByUserId
};
