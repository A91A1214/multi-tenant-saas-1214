const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user to attach to req
            // We also check if user still exists
            const query = 'SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id = $1';
            const result = await db.query(query, [decoded.userId]);

            if (result.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            req.user = result.rows[0];

            // Handle super_admin special case where tenant_id is null
            // If user is super_admin, they can access any tenant potentially, 
            // but for "current tenant" context, it might be separate. 
            // For now, req.user contains the user's data.

            if (!req.user.is_active) {
                return res.status(403).json({ success: false, message: 'Account suspended/inactive' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
