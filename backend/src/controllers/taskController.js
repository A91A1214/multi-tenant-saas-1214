const db = require('../config/db');
const logAction = require('../utils/auditLogger');

/*
  API 16: Create Task
  Endpoint: POST /api/projects/:projectId/tasks
*/
const createTask = async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;

    try {
        // 1. Verify Project
        const projectRes = await db.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const tenantId = projectRes.rows[0].tenant_id;

        // Verify User Tenant Access
        if (tenantId !== req.user.tenant_id) {
            return res.status(403).json({ success: false, message: 'Not authorized for this project' });
        }

        // 2. Verify Assigned User (if provided)
        if (assignedTo) {
            const userRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userRes.rows.length === 0 || userRes.rows[0].tenant_id !== tenantId) {
                return res.status(400).json({ success: false, message: 'Assigned user does not belong to this tenant' });
            }
        }

        // 3. Create Task
        const query = `
            INSERT INTO tasks (tenant_id, project_id, title, description, status, priority, assigned_to, due_date)
            VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)
            RETURNING *
        `;

        const result = await db.query(query, [tenantId, projectId, title, description, priority, assignedTo, dueDate]);
        const newTask = result.rows[0];

        logAction({
            tenantId,
            userId: req.user.id,
            action: 'CREATE_TASK',
            entityType: 'task',
            entityId: newTask.id,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: newTask
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 17: List Project Tasks
  Endpoint: GET /api/projects/:projectId/tasks
*/
const listTasks = async (req, res) => {
    const { projectId } = req.params;
    const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Verify Project
        const projectRes = await db.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        if (projectRes.rows[0].tenant_id !== req.user.tenant_id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let query = `
            SELECT t.*, 
                   u.full_name as assigned_name, u.email as assigned_email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = $1
        `;
        const values = [projectId];
        let counter = 2;

        if (status) { query += ` AND t.status = $${counter}`; values.push(status); counter++; }
        if (assignedTo) { query += ` AND t.assigned_to = $${counter}`; values.push(assignedTo); counter++; }
        if (priority) { query += ` AND t.priority = $${counter}`; values.push(priority); counter++; }
        if (search) { query += ` AND t.title ILIKE $${counter}`; values.push(`%${search}%`); counter++; }

        const totalRes = await db.query(`SELECT COUNT(*) FROM tasks WHERE project_id = $1`, [projectId]);
        const total = parseInt(totalRes.rows[0].count);

        query += ` ORDER BY t.priority DESC, t.due_date ASC LIMIT $${counter} OFFSET $${counter + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);

        res.json({
            success: true,
            data: {
                tasks: result.rows.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    assignedTo: t.assigned_to ? {
                        id: t.assigned_to,
                        fullName: t.assigned_name,
                        email: t.assigned_email
                    } : null,
                    dueDate: t.due_date,
                    createdAt: t.created_at
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
  API 18: Update Task Status
  Endpoint: PATCH /api/tasks/:taskId/status
*/
const updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!['todo', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        // Verify Task
        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = taskRes.rows[0];

        if (task.tenant_id !== req.user.tenant_id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const result = await db.query(
            'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at',
            [status, taskId]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/*
  API 19: Update Task
  Endpoint: PUT /api/tasks/:taskId
*/
const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    try {
        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = taskRes.rows[0];

        if (task.tenant_id !== req.user.tenant_id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // If assignedTo changing, verify user
        if (assignedTo && assignedTo !== task.assigned_to) {
            const userRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userRes.rows.length === 0 || userRes.rows[0].tenant_id !== task.tenant_id) {
                return res.status(400).json({ success: false, message: 'Assigned user invalid' });
            }
        }

        let query = 'UPDATE tasks SET updated_at = NOW()';
        const values = [];
        let counter = 1;

        if (title) { query += `, title = $${counter}`; values.push(title); counter++; }
        if (description) { query += `, description = $${counter}`; values.push(description); counter++; }
        if (status) { query += `, status = $${counter}`; values.push(status); counter++; }
        if (priority) { query += `, priority = $${counter}`; values.push(priority); counter++; }
        if (assignedTo !== undefined) { // Allow null to unassign
            query += `, assigned_to = $${counter}`;
            values.push(assignedTo);
            counter++;
        }
        if (dueDate !== undefined) {
            query += `, due_date = $${counter}`;
            values.push(dueDate);
            counter++;
        }

        query += ` WHERE id = $${counter} RETURNING *`;
        values.push(taskId);

        const result = await db.query(query, values);

        // Fetch full valid assigned user data for response
        const updatedTask = result.rows[0];
        let assignedUser = null;
        if (updatedTask.assigned_to) {
            const u = await db.query('SELECT id, full_name, email FROM users WHERE id = $1', [updatedTask.assigned_to]);
            if (u.rows.length > 0) assignedUser = u.rows[0];
        }

        logAction({
            tenantId: task.tenant_id,
            userId: req.user.id,
            action: 'UPDATE_TASK',
            entityType: 'task',
            entityId: taskId,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: {
                ...updatedTask,
                assignedTo: assignedUser,
                updatedAt: updatedTask.updated_at
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Start Delete Task (Not explicitly asked for API 19 but API 15 says cascade delete tasks, and page 5 details says "Actions: ... Delete".
// Actually Step 4.3 Page 5 says: DELETE /api/tasks/:id - Delete task.
// So I should implement DELETE /api/tasks/:taskId as well.

const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

        const task = taskRes.rows[0];
        if (task.tenant_id !== req.user.tenant_id) return res.status(403).json({ success: false, message: 'Not authorized' });

        await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

        logAction({
            tenantId: task.tenant_id,
            userId: req.user.id,
            action: 'DELETE_TASK',
            entityType: 'task',
            entityId: taskId,
            ipAddress: req.ip
        });

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createTask,
    listTasks,
    updateTaskStatus,
    updateTask,
    deleteTask
};
