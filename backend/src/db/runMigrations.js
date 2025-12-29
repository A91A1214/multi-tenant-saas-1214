const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const migrationsDir = path.join(__dirname, "migrations");

(async () => {
  try {
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      console.log("Running:", file);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await db.query(sql);
    }

    console.log("✅ All migrations executed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
})();
