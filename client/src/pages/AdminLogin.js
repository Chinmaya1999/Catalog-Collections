import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.auth}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));
        // Dispatch custom event to notify navbar about login
        window.dispatchEvent(new Event('adminAuthChange'));
        // Redirect based on role
        if (data.admin && data.admin.role === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-dark flex items-center justify-center p-4 pt-24">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark mask-radial" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-yellow/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white rounded-[2rem] shadow-lift ring-1 ring-white/10 p-8 sm:p-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark">
            <Lock className="h-6 w-6 text-brand-yellow" />
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-brand-dark mb-2">
            Admin Portal
          </h1>
          <p className="text-ink-500">Sign in to manage your catalog</p>
        </div>

        {error && (
          <div className="bg-red-50 ring-1 ring-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-12"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-12"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-secondary w-full !py-4 group"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        <div className="mt-7 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-ink-500 hover:text-brand-dark transition-colors"
          >
            ← Back to Website
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
