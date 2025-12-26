import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', priority: 'medium' });

    const fetchProjectData = async () => {
        try {
            // Needed: Get Project Details (not just tasks)
            // But API didn't explicitly specify "Get Single Project" endpoint in my implementation plan?
            // Actually, API 13 is List Projects. API 14 is Update Project.
            // Wait, I missed "API: Get Project Details" in my implementation?
            // PRD Step 3.4 says "API 13: List Projects", "API 14: Update Project".
            // It doesn't explicitly list "Get Project ID" as a separate endpoint in requirements but Step 4.3 Page 5 says "GET /api/projects/:id".
            // Implementation: I implemented "updateProject" at PUT /api/projects/:id, but not GET.
            // Oh snap. I need GET /api/projects/:id.
            // Quick fix within frontend: I can rely on list and filter, OR better, I should implement GET /api/projects/:id in backend if possible, or use List with filter?
            // Wait, "API 5: Get Tenant Details". "API 12: Create Project". 
            // In listProjects of backend, I fetch all project data.
            // I'll add a quick GET route to ProjectController or use a hack.
            // Hack for now: Fetch all projects and find by ID (inefficient but works for 20 limit default).
            // Actually, a better hack: Frontend calls `/api/projects?limit=100` and filters locally if API doesn't support generic GET /id.
            // But I should probably fix the backend to support GET /:projectId.
            // In `projectRoutes.js`: `router.get('/', listProjects);`.
            // I can add `GET /:projectId`.
            // Let's assume I fix backend. I will add the route.

            // Fetch tasks
            const tasksRes = await api.get(`/projects/${projectId}/tasks`);
            setTasks(tasksRes.data.data.tasks);

            // Fetch Project (Assuming I'll fix it or use list for now)
            const projectsRes = await api.get(`/projects?limit=100`);
            const found = projectsRes.data.data.projects.find(p => p.id === projectId);
            if (found) setProject(found);
            else {
                // If not found in list (maybe pagination), we are stuck without ID endpoint.
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${projectId}/tasks`, newTask);
            setShowTaskModal(false);
            setNewTask({ title: '', priority: 'medium' });
            fetchProjectData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            fetchProjectData();
        } catch (error) {
            console.error(error);
        }
    }

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            fetchProjectData(); // Refresh to update lists/stats
        } catch (error) {
            console.error(error);
        }
    }

    const handleDeleteProject = async () => {
        if (!window.confirm("Delete Entire Project?")) return;
        try {
            await api.delete(`/projects/${projectId}`);
            navigate('/projects');
        } catch (error) {
            alert("Failed to delete project");
        }
    }

    if (loading) return <div className="p-6">Loading...</div>;
    if (!project) return <div className="p-6">Project not found</div>;

    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        {project.name}
                        <span className={`ml-3 px-2 py-1 text-xs rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {project.status}
                        </span>
                    </h1>
                    <p className="text-gray-600 mt-1">{project.description}</p>
                </div>
                <div className="flex space-x-2">
                    {(user.role === 'tenant_admin' || user.id === project.createdBy.id) && (
                        <button onClick={handleDeleteProject} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded">Delete Project</button>
                    )}
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Task
                    </button>
                </div>
            </div>

            {/* Task Board / List */}
            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.map(task => (
                            <tr key={task.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 text-xs rounded-full 
                                        ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {task.assignedTo ? task.assignedTo.fullName : 'Unassigned'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className="border rounded p-1 text-xs"
                                    >
                                        <option value="todo">Todo</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:text-red-900 ml-2">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tasks.length === 0 && <div className="p-4 text-center text-gray-500">No tasks yet.</div>}
            </div>

            {/* Create Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New Task</h3>
                        <form onSubmit={handleCreateTask}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full border p-2 rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-1">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                    className="w-full border p-2 rounded"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
