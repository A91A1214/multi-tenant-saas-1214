const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
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
