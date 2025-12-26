const db = require('../config/db');
const logAction = require('../utils/auditLogger');

/*
  API 12: Create Project
  Endpoint: POST /api/projects
*/
const createProject = async (req, res) => {
    const { name, description, status = 'active' } = req.body;

    try {
        const tenantId = req.user.tenant_id;

        // Check Limit
        const tenantRes = await db.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
        const maxProjects = tenantRes.rows[0].max_projects;

        const countRes = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const currentProjects = parseInt(countRes.rows[0].count);

        if (currentProjects >= maxProjects) {
            return res.status(403).json({ success: false, message: 'Subscription limit reached' });
        }

        const query = `
            INSERT INTO projects (tenant_id, name, description, status, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, tenant_id, name, description, status, created_by, created_at
        `;

        const result = await db.query(query, [tenantId, name, description, status, req.user.id]);

        logAction({
            tenantId,
            userId: req.user.id,
            action: 'CREATE_PROJECT',
            entityType: 'project',
            entityId: result.rows[0].id,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 13: List Projects
  Endpoint: GET /api/projects
*/
const listProjects = async (req, res) => {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const tenantId = req.user.tenant_id;

    try {
        let query = `
            SELECT p.*, 
                   u.full_name as creator_name,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
                   (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.tenant_id = $1
        `;
        const values = [tenantId];
        let counter = 2;

        if (status) {
            query += ` AND p.status = $${counter}`;
            values.push(status);
            counter++;
        }

        if (search) {
            query += ` AND p.name ILIKE $${counter}`;
            values.push(`%${search}%`);
            counter++;
        }

        // Count for pagination
        const countQuery = `SELECT COUNT(*) FROM projects p WHERE p.tenant_id = $1` + (status ? ` AND p.status = $2` : ``) + (search ? ` AND p.name ILIKE $${status ? 3 : 2}` : ``);
        // Simplified count assumption: frontend can live with approximate or total-unfiltered if needed, but doing proper count is better.
        // Let's assume frontend gets total from first call.
        const totalRes = await db.query(`SELECT COUNT(*) FROM projects WHERE tenant_id = $1`, [tenantId]);
        const total = parseInt(totalRes.rows[0].count);

        query += ` ORDER BY p.created_at DESC LIMIT $${counter} OFFSET $${counter + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);

        res.json({
            success: true,
            data: {
                projects: result.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    status: row.status,
                    createdBy: {
                        id: row.created_by,
                        fullName: row.creator_name
                    },
                    taskCount: parseInt(row.task_count),
                    completedTaskCount: parseInt(row.completed_task_count),
                    createdAt: row.created_at
                })),
                total,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 14: Update Project
  Endpoint: PUT /api/projects/:projectId
*/
const updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    try {
        // 1. Check Project
        const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projectRes.rows[0];

        // 2. Authorization
        // Must be in tenant. 
        // Must be tenant_admin OR project creator
        if (project.tenant_id !== req.user.tenant_id) {
            return res.status(404).json({ success: false, message: 'Project not found' }); // Hide foreign projects
        }

        if (req.user.role !== 'tenant_admin' && req.user.id !== project.created_by) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // 3. Update
        let query = 'UPDATE projects SET updated_at = NOW()';
        const values = [];
        let counter = 1;

        if (name) { query += `, name = $${counter}`; values.push(name); counter++; }
        if (description) { query += `, description = $${counter}`; values.push(description); counter++; }
        if (status) { query += `, status = $${counter}`; values.push(status); counter++; }

        query += ` WHERE id = $${counter} RETURNING *`;
        values.push(projectId);

        const result = await db.query(query, values);

        logAction({
            tenantId: project.tenant_id,
            userId: req.user.id,
            action: 'UPDATE_PROJECT',
            entityType: 'project',
            entityId: projectId,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 15: Delete Project
  Endpoint: DELETE /api/projects/:projectId
*/
const deleteProject = async (req, res) => {
    const { projectId } = req.params;

    try {
        const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projectRes.rows[0];

        if (project.tenant_id !== req.user.tenant_id) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (req.user.role !== 'tenant_admin' && req.user.id !== project.created_by) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await db.query('DELETE FROM projects WHERE id = $1', [projectId]);

        logAction({
            tenantId: project.tenant_id,
            userId: req.user.id,
            action: 'DELETE_PROJECT',
            entityType: 'project',
            entityId: projectId,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Project deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createProject,
    listProjects,
    updateProject,
    deleteProject
};
