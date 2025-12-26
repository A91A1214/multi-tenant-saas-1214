const db = require('../config/db');

/**
 * Logs an action to the audit_logs table.
 * @param {Object} params - The log parameters.
 * @param {string} params.tenantId - The ID of the tenant.
 * @param {string} params.userId - The ID of the user performing the action (can be null).
 * @param {string} params.action - The action name (e.g., 'CREATE_USER').
 * @param {string} params.entityType - The type of entity affected (e.g., 'user').
 * @param {string} params.entityId - The ID of the entity affected.
 * @param {string} params.ipAddress - The IP address of the user.
 */
const logAction = async ({ tenantId, userId, action, entityType, entityId, ipAddress }) => {
    try {
        const query = `
      INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
        const values = [tenantId, userId, action, entityType, entityId, ipAddress];
        await db.query(query, values);
    } catch (err) {
        console.error('Audit Logging Failed:', err);
        // Silent fail to not block the main request, or throw depending on strictness
    }
};

module.exports = logAction;
