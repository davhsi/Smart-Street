const db = require("../config/db");

const findByUserId = async userId => {
  const result = await db.query(
    `SELECT * FROM owners WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

module.exports = {
  findByUserId
};
