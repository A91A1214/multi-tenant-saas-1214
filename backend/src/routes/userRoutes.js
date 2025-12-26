const express = require('express');
const router = express.Router();
const { addUser, listUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Note: API 8 and 9 are under /api/tenants/:tenantId/users
// But API 10 and 11 are under /api/users/:userId
// We need to support both structures.
// We can define common routes here and mount them properly in app.js
// OR use different routers.

// For /api/users
router.put('/:userId', protect, updateUser);
router.delete('/:userId', protect, deleteUser);

// For /api/tenants/:tenantId/users -> This likely belongs in tenantRoutes OR we mount this router at /api/tenants/:tenantId/users?
// Actually, Express allows mounting.
// Let's keep this clean. We will have separate handling or direct routes.

module.exports = router;
