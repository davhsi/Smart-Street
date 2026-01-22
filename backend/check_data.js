require("dotenv").config();
const db = require("./db");

const checkData = async () => {
  console.log("🔍 Checking Database Content...");
  try {
    const users = await db.query("SELECT user_id, name, role FROM users");
    console.log(`\nUsers (${users.rows.length}):`);
    console.table(users.rows);

    const owners = await db.query("SELECT owner_id, user_id, owner_name FROM owners");
    console.log(`\nOwners (${owners.rows.length}):`);
    console.table(owners.rows);

    const spaces = await db.query("SELECT space_id, owner_id, space_name, allowed_radius FROM spaces");
    console.log(`\nSpaces (${spaces.rows.length}):`);
    console.table(spaces.rows);

  } catch (err) {
    console.error("❌ Check failed:", err.message);
  } finally {
    db.pool.end();
  }
};

checkData();
