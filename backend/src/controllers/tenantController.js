const db = require('../config/db');
const logAction = require('../utils/auditLogger');

/*
  API 5: Get Tenant Details
  Endpoint: GET /api/tenants/:tenantId
*/
const getTenant = async (req, res) => {
    const { tenantId } = req.params;

    try {
        // Authorization: User must belong to this tenant OR be super_admin
        // req.user is populated by protect middleware
        if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this tenant' });
        }

        const query = `
      SELECT t.*, 
             (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_users,
             (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as total_projects,
             (SELECT COUNT(*) FROM tasks WHERE tenant_id = t.id) as total_tasks
      FROM tenants t
      WHERE t.id = $1
    `;
        const result = await db.query(query, [tenantId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        const tenant = result.rows[0];

        res.json({
            success: true,
            data: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                status: tenant.status,
                subscriptionPlan: tenant.subscription_plan,
                maxUsers: tenant.max_users,
                maxProjects: tenant.max_projects,
                createdAt: tenant.created_at,
                stats: {
                    totalUsers: parseInt(tenant.total_users),
                    totalProjects: parseInt(tenant.total_projects),
                    totalTasks: parseInt(tenant.total_tasks)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 6: Update Tenant
  Endpoint: PUT /api/tenants/:tenantId
*/
const updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    try {
        // Authorization: tenant_admin or super_admin
        // If tenant_admin, can ONLY update name
        // If super_admin, can update everything

        const isSuperAdmin = req.user.role === 'super_admin';
        const isTenantAdmin = req.user.role === 'tenant_admin' && req.user.tenant_id === tenantId;

        if (!isSuperAdmin && !isTenantAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check existing tenant
        const checkRes = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        let query = 'UPDATE tenants SET updated_at = NOW()';
        let values = [];
        let valueCounter = 1;

        // Build query based on permissions
        if (name) {
            query += `, name = $${valueCounter}`;
            values.push(name);
            valueCounter++;
        }

        // Restricted fields
        if (isSuperAdmin) {
            if (status) {
                query += `, status = $${valueCounter}`;
                values.push(status);
                valueCounter++;
            }
            if (subscriptionPlan) {
                query += `, subscription_plan = $${valueCounter}`;
                values.push(subscriptionPlan);
                valueCounter++;
            }
            if (maxUsers) {
                query += `, max_users = $${valueCounter}`;
                values.push(maxUsers);
                valueCounter++;
            }
            if (maxProjects) {
                query += `, max_projects = $${valueCounter}`;
                values.push(maxProjects);
                valueCounter++;
            }
        } else {
            // If tenant_admin tries to pass restricted fields, reject or ignore?
            // Requirement says: "Return 403 if tenant_admin tries to update restricted fields"
            if (status || subscriptionPlan || maxUsers || maxProjects) {
                return res.status(403).json({ success: false, message: 'Not authorized to update restricted fields' });
            }
        }

        query += ` WHERE id = $${valueCounter} RETURNING *`;
        values.push(tenantId);

        const result = await db.query(query, values);
        const updatedTenant = result.rows[0];

        // Log action
        logAction({
            tenantId: tenantId,
            userId: req.user.id,
            action: 'UPDATE_TENANT',
            entityType: 'tenant',
            entityId: tenantId,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Tenant updated successfully',
            data: {
                id: updatedTenant.id,
                name: updatedTenant.name,
                updatedAt: updatedTenant.updated_at
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 7: List All Tenants
  Endpoint: GET /api/tenants
*/
const listTenants = async (req, res) => {
    try {
        // Authorization matches: super_admin only (handled by route middleware usually, or here)
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
        const offset = (page - 1) * limit;

        let query = `
        SELECT t.*, 
             (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_users,
             (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as total_projects
        FROM tenants t
        WHERE 1=1
      `;
        const values = [];
        let counter = 1;

        if (status) {
            query += ` AND status = $${counter}`;
            values.push(status);
            counter++;
        }

        if (subscriptionPlan) {
            query += ` AND subscription_plan = $${counter}`;
            values.push(subscriptionPlan);
            counter++;
        }

        // Count total for pagination
        const countResult = await db.query(`SELECT COUNT(*) FROM (${query}) as filtered_tenants`, values);
        // Note: simplistic count query wrapper

        query += ` ORDER BY created_at DESC LIMIT $${counter} OFFSET $${counter + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);

        const totalTenants = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: {
                tenants: result.rows.map(t => ({
                    id: t.id,
                    name: t.name,
                    subdomain: t.subdomain,
                    status: t.status,
                    subscriptionPlan: t.subscription_plan,
                    totalUsers: parseInt(t.total_users),
                    totalProjects: parseInt(t.total_projects),
                    createdAt: t.created_at
                })),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalTenants / limit),
                    totalTenants: totalTenants,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getTenant,
    updateTenant,
    listTenants
};
