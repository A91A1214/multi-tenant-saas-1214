import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminEmail: '',
        adminFullName: '',
        adminPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.adminPassword !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register-tenant', {
                tenantName: formData.tenantName,
                subdomain: formData.subdomain,
                adminEmail: formData.adminEmail,
                adminFullName: formData.adminFullName,
                adminPassword: formData.adminPassword
            });
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Register Organization</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Organization Name</label>
                        <input type="text" name="tenantName" onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Subdomain</label>
                        <div className="flex">
                            <input type="text" name="subdomain" onChange={handleChange} className="w-full border p-2 rounded-l" required pattern="[a-z0-9-]+" title="Lowercase letters, numbers, hyphens only" />
                            <span className="bg-gray-200 p-2 text-gray-600 rounded-r border border-l-0">.app.com</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Admin Full Name</label>
                        <input type="text" name="adminFullName" onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Admin Email</label>
                        <input type="email" name="adminEmail" onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-1">Password</label>
                            <input type="password" name="adminPassword" onChange={handleChange} className="w-full border p-2 rounded" required minLength={8} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1">Confirm Password</label>
                            <input type="password" name="confirmPassword" onChange={handleChange} className="w-full border p-2 rounded" required />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-indigo-600 hover:underline">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
