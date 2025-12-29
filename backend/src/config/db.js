const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ DB connection failed", err);
  } else {
    console.log("✅ DB connected at:", res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
