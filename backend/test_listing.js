require("dotenv").config();
const db = require("./db");

const testListing = async () => {
  console.log("🧪 Testing Listing Logic...");
  
  // Hardcoded ID from previous check_data.js output for 'owner100'
  const userId = '6f68755e-4b2f-40c8-b67f-d0dfeb320a58'; 
  console.log("Using User ID:", userId);

  try {
    // 1. Get Owner
    const ownerRes = await db.query("SELECT * FROM owners WHERE user_id = $1", [userId]);
    const owner = ownerRes.rows[0];
    
    if (!owner) {
      console.error("❌ Owner not found!");
      return;
    }
    console.log("✅ Owner Found:", owner.owner_id);

    // 2. List Spaces
    const spacesRes = await db.query("SELECT * FROM spaces WHERE owner_id = $1", [owner.owner_id]);
    console.log(`✅ Spaces Found: ${spacesRes.rows.length}`);
    console.table(spacesRes.rows);
    
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    db.pool.end();
  }
};

testListing();
