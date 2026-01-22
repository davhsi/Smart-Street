require("dotenv").config();
const db = require("./db");

const migrate = async () => {
  console.log("🚀 Starting database migration...");
  try {
    // 1. Make space_id nullable in space_requests
    await db.query(`
      ALTER TABLE space_requests 
      ALTER COLUMN space_id DROP NOT NULL;
    `);
    console.log("✅ Made space_id nullable in space_requests.");

    console.log("🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    db.pool.end();
  }
};

migrate();
