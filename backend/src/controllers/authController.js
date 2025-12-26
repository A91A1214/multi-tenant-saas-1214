const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logAction = require('../utils/auditLogger');

const generateToken = (userId, tenantId, role) => {
    return jwt.sign({ userId, tenantId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

/*
  API 1: Tenant Registration
  Endpoint: POST /api/auth/register-tenant
*/
const registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check if subdomain exists
        const checkSubdomain = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        if (checkSubdomain.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Subdomain already exists' });
        }

        // 2. Create Tenant
        // Default plan free: max_users=5, max_projects=3
        const createTenantQuery = `
      INSERT INTO tenants (name, subdomain, subscription_plan, max_users, max_projects)
      VALUES ($1, $2, 'free', 5, 3)
      RETURNING id, name, subdomain
    `;
        const tenantRes = await client.query(createTenantQuery, [tenantName, subdomain]);
        const newTenant = tenantRes.rows[0];

        // 3. Create Admin User
        // Check email uniqueness within tenant (though this is new tenant, so it's empty, but global check might be needed if email is global? PRD says unique per tenant.
        // However, if we want to check if this user already exists in *this* tenant, we don't need to check others.)

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const createUserQuery = `
      INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, 'tenant_admin', true)
      RETURNING id, email, full_name, role
    `;
        const userRes = await client.query(createUserQuery, [newTenant.id, adminEmail, hashedPassword, adminFullName]);
        const newAdmin = userRes.rows[0];

        await client.query('COMMIT');

        // Audit Log (Asynchronous, outside transaction critical path usually, or inside?)
        // We can't use the transaction client for audit log unless we pass it. 
        // Usually audit log is separate. We'll do it after commit.
        logAction({
            tenantId: newTenant.id,
            userId: newAdmin.id,
            action: 'REGISTER_TENANT',
            entityType: 'tenant',
            entityId: newTenant.id,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenantId: newTenant.id,
                subdomain: newTenant.subdomain,
                adminUser: newAdmin
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    } finally {
        client.release();
    }
};

/*
  API 2: User Login
  Endpoint: POST /api/auth/login
*/
const login = async (req, res) => {
    const { email, password, tenantSubdomain } = req.body;

    try {
        // 1. Find Tenant
        // If tenantSubdomain is provided (typical for multi-tenant), use it.
        // If we support login via tenantId, handle that too.
        if (!tenantSubdomain) {
            return res.status(400).json({ success: false, message: 'Tenant subdomain required' });
        }

        const tenantRes = await db.query('SELECT id, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
        if (tenantRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        const tenant = tenantRes.rows[0];

        if (tenant.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Tenant is not active' });
        }

        // 2. Find User in Tenant
        // Super Admin: tenant_id is NULL. But they might be logging into a specific tenant portal?
        // Requirement Q1: "When a super_admin makes API calls, their JWT token will have tenantId: null"
        // So super_admin probably doesn't login via tenant subdomain? Or does the system handle it?
        // Let's assume for /api/auth/login with tenantSubdomain, we are looking for a tenant user.
        // BUT we also need to support Super Admin login. 
        // Creating a special login flow or just checking both?
        // If email='superadmin@system.com', we ignore tenant?

        // Better strategy: Check if user exists in this tenant.
        // If NOT in tenant, check if it is a super admin (tenant_id IS NULL)

        let userRes = await db.query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenant.id]);
        let user = userRes.rows[0];

        // If not found in tenant, check if super admin
        if (!user) {
            const superAdminRes = await db.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'super_admin']);
            if (superAdminRes.rows.length > 0) {
                user = superAdminRes.rows[0];
                // Super admin logging in context of a tenant? Or just generally?
                // The JWT should have tenantId: null for super admin.
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account suspended' });
        }

        // 4. Generate Token
        const token = generateToken(user.id, user.tenant_id, user.role);

        // Audit Log
        logAction({
            tenantId: user.tenant_id || tenant.id, // For super admin, log which tenant context or just their null
            userId: user.id,
            action: 'LOGIN',
            entityType: 'user',
            entityId: user.id,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    tenantId: user.tenant_id
                },
                token,
                expiresIn: 86400 // 24 hours
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 3: Get Current User
  Endpoint: GET /api/auth/me
*/
const getMe = async (req, res) => {
    try {
        const user = req.user; // Attached by protect middleware

        // Get Tenant Details (if user has tenant)
        let tenant = null;
        if (user.tenant_id) {
            const tenantRes = await db.query('SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id = $1', [user.tenant_id]);
            if (tenantRes.rows.length > 0) {
                tenant = {
                    id: tenantRes.rows[0].id,
                    name: tenantRes.rows[0].name,
                    subdomain: tenantRes.rows[0].subdomain,
                    subscriptionPlan: tenantRes.rows[0].subscription_plan,
                    maxUsers: tenantRes.rows[0].max_users,
                    maxProjects: tenantRes.rows[0].max_projects
                };
            }
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                isActive: user.is_active,
                tenant: tenant
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 4: Logout
  Endpoint: POST /api/auth/logout
*/
const logout = async (req, res) => {
    // JWT is stateless, so just log it.
    // Pass tenant ID from user if available.
    if (req.user) {
        logAction({
            tenantId: req.user.tenant_id,
            userId: req.user.id,
            action: 'LOGOUT',
            entityType: 'user',
            entityId: req.user.id,
            ipAddress: req.ip
        });
    }

    res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
    registerTenant,
    login,
    getMe,
    logout
};
