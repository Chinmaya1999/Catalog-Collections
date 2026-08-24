import React, { useState, useEffect, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActivePath = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check admin login status
    const checkAdminStatus = () => {
      const token = localStorage.getItem('adminToken');
      setIsAdminLoggedIn(!!token);
    };

    checkAdminStatus();

    // Listen for storage changes (for when user logs in/out in other tabs)
    window.addEventListener('storage', checkAdminStatus);
    
    // Custom event for same-tab login/logout
    const handleAuthChange = () => {
      checkAdminStatus();
    };
    
    window.addEventListener('adminAuthChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', checkAdminStatus);
      window.removeEventListener('adminAuthChange', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setIsAdminLoggedIn(false);
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('adminAuthChange'));
    navigate('/');
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/catalog' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const adminNavItems = isAdminLoggedIn ? [
    { name: 'Admin Dashboard', path: '/admin/dashboard' }
  ] : [];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100' : 'bg-white/90 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <img
                src="/images/logo.png"
                alt="Adihuman Logo"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-2xl font-bold text-white">A</span>';
                }}
              />
            </div>
            <span className="text-2xl font-display font-bold text-brand-dark">
              adihuman
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                    active
                      ? 'bg-brand-yellow text-brand-dark shadow-sm'
                      : 'text-gray-600 hover:text-brand-dark hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Navigation */}
            {adminNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isActivePath(item.path)
                    ? 'bg-brand-dark text-white shadow-sm'
                    : 'text-brand-gold hover:text-brand-dark hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Admin Logout Button */}
            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold text-sm transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-brand-yellow/20 rounded-full transition-colors duration-300"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-brand-dark" />
              ) : (
                <Menu className="w-6 h-6 text-brand-dark" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isActivePath(item.path)
                      ? 'bg-brand-yellow text-brand-dark'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-brand-dark'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Navigation */}
              {adminNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isActivePath(item.path)
                      ? 'bg-brand-dark text-white'
                      : 'text-brand-gold hover:bg-gray-100 hover:text-brand-dark'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Logout Button */}
              {isAdminLoggedIn && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-all duration-300 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
});

export default Navbar;
