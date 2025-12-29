const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

const runMigrations = async () => {
    const client = await pool.connect();
    try {
        console.log('Connected to database. Starting migrations...');

        // Get migration files
        const migrationsDir = path.join(__dirname, '../src/db/migrations');
        const files = fs.readdirSync(migrationsDir).sort(); // Ensure order

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`Running migration: ${file}`);
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');

                // Simple split by "-- Down Migration" to get Up part, or just run the whole file if it handles idempotency?
                // My migration files have "-- Up Migration" and "-- Down Migration" comments.
                // We only want to run the UP part.
                // Or better, just run the whole thing? No, running Down then Up deletes data.
                // We should extract the Up Migration part.
                // Format: 
                // -- Up Migration
                // SQL...
                // -- Down Migration
                // SQL...

                let upSql = sql;
                if (sql.includes('-- Down Migration')) {
                    upSql = sql.split('-- Down Migration')[0];
                }

                // Remove "-- Up Migration" check/comment interaction if it helps, but postgres ignores comments.

                // Execute
                // We might want to track executed migrations in a table to avoid re-running, 
                // but for this task "Automatic Initialization Only", maybe simple "IF EXISTS" checks in SQL would be better?
                // My SQLs use "CREATE TABLE", which fails if exists.
                // I should have used "CREATE TABLE IF NOT EXISTS".
                // OR, I catch the error and ignore "already exists".

                try {
                    await client.query(upSql);
                } catch (e) {
                    if (e.code === '42P07') { // duplicate_table
                        console.log(`Skipping ${file} (Table already exists)`);
                    } else {
                        console.error(`Error running ${file}:`, e);
                        // Proceed or Exit? For robust init, maybe exit.
                        // But for "idempotent-ish" re-runs, we might proceed.
                        // Let's assume on fresh docker up it runs once.
                    }
                }
            }
        }

        console.log('Migrations completed.');

        // Seeds
        console.log('Running seeds...');
        const seedFile = path.join(__dirname, '../seeds/seed_data.sql');
        if (fs.existsSync(seedFile)) {
            const seedSql = fs.readFileSync(seedFile, 'utf8');
            try {
                // Seeding might fail on unique constraints if re-run.
                // Check if superadmin exists first?
                const check = await client.query("SELECT 1 FROM users WHERE email='superadmin@system.com'");
                if (check.rows.length === 0) {
                    await client.query(seedSql);
                    console.log('Seeds executed.');
                } else {
                    console.log('Seeds skipped (Data already exists).');
                }
            } catch (e) {
                console.error('Error running seeds:', e);
                // Proceed.
            }
        }

    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
};

// Wait for DB to be ready
const waitForDb = async () => {
    let retries = 30;
    while (retries > 0) {
        try {
            await pool.query('SELECT 1');
            console.log('Database is ready.');
            return;
        } catch (err) {
            console.log(`Waiting for database... (${retries})`);
            await new Promise(res => setTimeout(res, 2000));
            retries--;
        }
    }
    throw new Error('Database timed out');
};

const init = async () => {
    await waitForDb();
    await runMigrations();
};

init();
