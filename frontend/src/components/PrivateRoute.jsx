import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ roles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-4">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <div className="p-4 text-red-500">Not Authorized</div>;
    }

    return <Outlet />;
};

export default PrivateRoute;
