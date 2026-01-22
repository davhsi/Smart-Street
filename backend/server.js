require("dotenv").config();
const app = require("./app");
const db = require("./db");

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
const startServer = async () => {
  console.log("🔌 Testing database connection...");
  const connected = await db.testConnection();

  if (!connected) {
    console.error("\n❌ Server startup aborted due to database connection failure");
    process.exit(1);
  }
  
  console.log("\n🚀 Starting Smart Street backend server...");
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 API endpoints available at http://localhost:${PORT}/api`);
});
};

startServer();
