import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuperadminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const info = localStorage.getItem('adminInfo');
    if (!token || !info) {
      navigate('/admin/login');
      return;
    }

    try {
      const admin = JSON.parse(info);
      if (admin.role !== 'superadmin') {
        // If not superadmin, redirect to regular admin dashboard
        navigate('/admin/dashboard');
      }
    } catch (err) {
      navigate('/admin/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-xl p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Superadmin Dashboard</h1>
        <p className="text-gray-700 mb-6">Welcome, superadmin — you have elevated privileges.</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 bg-brand-yellow text-brand-dark rounded-lg font-semibold"
          >
            Open Admin Dashboard
          </button>
          <button
            onClick={() => {
              // simple sign out
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminInfo');
              window.dispatchEvent(new Event('adminAuthChange'));
              navigate('/admin/login');
            }}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
