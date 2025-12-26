const express = require('express');
const router = express.Router();
const { createProject, listProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { createTask, listTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createProject);
router.get('/', protect, listProjects);
router.put('/:projectId', protect, updateProject);
router.delete('/:projectId', protect, deleteProject);

// Task Routes nested in Projects
router.post('/:projectId/tasks', protect, createTask);
router.get('/:projectId/tasks', protect, listTasks);

module.exports = router;
