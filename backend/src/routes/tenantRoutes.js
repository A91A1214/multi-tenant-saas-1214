const express = require('express');
const router = express.Router();
const { getTenant, updateTenant, listTenants } = require('../controllers/tenantController');
const { addUser, listUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/:tenantId', protect, getTenant);
router.put('/:tenantId', protect, updateTenant);
router.get('/', protect, authorize('super_admin'), listTenants);

// User Routes nested in Tenants
router.post('/:tenantId/users', protect, addUser); // Auth check inside controller or add middleware? Controller checks tenant_admin + tenantId match.
router.get('/:tenantId/users', protect, listUsers);

module.exports = router;
