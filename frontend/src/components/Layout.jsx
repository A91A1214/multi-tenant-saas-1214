import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Folder, Users, LogOut, Briefcase } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return <Outlet />;

    const isActive = (path) => location.pathname === path ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600';

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-indigo-700 text-white flex flex-col">
                <div className="p-4 text-xl font-bold border-b border-indigo-600 flex items-center">
                    <Briefcase className="mr-2" /> SaaS Platform
                </div>
                <div className="p-4 border-b border-indigo-600">
                    <p className="text-sm text-indigo-200">Tenant: {user?.tenant?.name || user?.tenantId || 'Super Admin'}</p>
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-xs uppercase bg-indigo-900 px-2 py-1 rounded inline-block mt-1">{user.role}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/dashboard" className={`flex items-center p-2 rounded ${isActive('/dashboard')}`}>
                        <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
                    </Link>
                    <Link to="/projects" className={`flex items-center p-2 rounded ${isActive('/projects')}`}>
                        <Folder className="mr-3 h-5 w-5" /> Projects
                    </Link>
                    {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
                        <Link to="/users" className={`flex items-center p-2 rounded ${isActive('/users')}`}>
                            <Users className="mr-3 h-5 w-5" /> Users
                        </Link>
                    )}
                </nav>
                <div className="p-4 border-t border-indigo-600">
                    <button onClick={logout} className="flex items-center text-indigo-200 hover:text-white w-full">
                        <LogOut className="mr-3 h-5 w-5" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow p-4 flex justify-between items-center sm:hidden">
                    <div className="font-bold text-indigo-700">SaaS App</div>
                    <button className="text-gray-600">Menu</button>
                </header>
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
