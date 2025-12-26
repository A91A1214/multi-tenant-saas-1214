import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Folder, CheckSquare, Clock, AlertCircle } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [tenant, setTenant] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch tenant details for stats if admin, or user me endpoint has some stats?? 
                // The /me endpoint returns tenant info with limits but not usage stats count (unless updated).
                // But /api/tenants/:id gives full stats. 
                // Tenant Admin/Super Admin can access /api/tenants/:id.
                // Regular user: can't access tenant details API usually (403), so we need to rely on other APIs or make dashboard specific API.
                // Workaround: We will calculate stats from projects/tasks API for regular users OR just show limited info.
                // Spec says "Statistics Cards... Recent Projects... My Tasks".

                // Let's fetch Projects first
                const projectsRes = await api.get('/api/projects?limit=5');
                setProjects(projectsRes.data.data.projects);

                // Fetch Tenant Details if admin
                if (user.role === 'tenant_admin' || user.role === 'super_admin') {
                    const tenantRes = await api.get(`/tenants/${user.tenantId}`);
                    setTenant(tenantRes.data.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Projects</p>
                            <p className="text-2xl font-bold text-gray-800">{tenant?.stats?.totalProjects ?? projects.length}</p>
                        </div>
                        <Folder className="text-indigo-500 h-8 w-8" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Tasks</p>
                            <p className="text-2xl font-bold text-gray-800">{tenant?.stats?.totalTasks ?? '-'}</p>
                        </div>
                        <CheckSquare className="text-green-500 h-8 w-8" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Users</p>
                            <p className="text-2xl font-bold text-gray-800">{tenant?.stats?.totalUsers ?? '-'}</p>
                        </div>
                        <UsersIcon className="text-blue-500 h-8 w-8" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Plan</p>
                            <p className="text-2xl font-bold text-gray-800 uppercase">{user?.tenant?.subscriptionPlan || 'Free'}</p>
                        </div>
                        <AlertCircle className="text-purple-500 h-8 w-8" />
                    </div>
                </div>
            </div>

            {/* Recent Projects */}
            <h2 className="text-xl font-bold mb-4 text-gray-700">Recent Projects</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map((project) => (
                            <tr key={project.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                    <div className="text-sm text-gray-500">{project.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {project.completedTaskCount} / {project.taskCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {project.createdBy.fullName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link to={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {projects.length === 0 && <div className="p-4 text-center text-gray-500">No projects found.</div>}
            </div>
        </div>
    );
};

// Helper icon
const UsersIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)

export default Dashboard;
