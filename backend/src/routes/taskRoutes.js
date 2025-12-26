const express = require('express');
const router = express.Router();
const { createTask, listTasks, updateTaskStatus, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Note: create and list are under /api/projects/:projectId/tasks
// update/delete are under /api/tasks/:taskId

// This router handles /api/tasks/:id routes primarily if mounted at /api/tasks
// AND we can mount a separate router for /api/projects/:projectId/tasks or handle it here?
// In Express, usually we mergeParams in projectRoutes to handle tasks there, OR 
// we make projectRoutes forward to taskRoutes.

// Let's define the project-dependent routes separate or handle them in projectRoutes?
// Actually simpler is:
// In app.js:
// app.use('/api/projects', projectRoutes);
// app.use('/api/tasks', taskRoutes);
// AND we need endpoints:
// POST /api/projects/:projectId/tasks
// GET /api/projects/:projectId/tasks

// So we should add those two to projectRoutes.js or handle passing.
// I'll add them to this router and mount appropriately or move them.
// A common pattern:
// router.route('/:taskId').put(...).delete(...)
// router.route('/:taskId/status').patch(...)

// For /api/tasks
router.put('/:taskId', protect, updateTask);
router.patch('/:taskId/status', protect, updateTaskStatus);
router.delete('/:taskId', protect, deleteTask);

module.exports = router;
