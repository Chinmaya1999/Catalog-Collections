import React, { useState, useEffect, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ArrowUpRight } from 'lucide-react';
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
    { name: 'Shop', path: '/shop' },
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
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 sm:px-5"
    >
      <div
        className={`mx-auto max-w-7xl rounded-full transition-all duration-500 ${
          scrolled || isOpen
            ? 'glass shadow-[0_8px_32px_-12px_rgba(0,0,0,0.18)]'
            : 'border border-transparent bg-white/60 backdrop-blur-md'
        }`}
      >
        <div className="flex h-14 items-center justify-between pl-2 pr-2 sm:h-[60px] sm:pl-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center ring-1 ring-black/5 transition-transform duration-500 group-hover:rotate-[360deg]">
              <img
                src="/images/logo.png"
                alt="Adihuman Logo"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-lg font-bold text-white">A</span>';
                }}
              />
            </div>
            <span className="text-xl font-display font-extrabold tracking-tight text-brand-dark">
              adihuman<span className="text-brand-gold">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 rounded-full bg-ink-100/70 p-1">
            {navItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                    active ? 'text-brand-dark' : 'text-ink-500 hover:text-brand-dark'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-white shadow-soft"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{item.name}</span>
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
                    : 'text-brand-gold hover:text-brand-dark'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Logout Button */}
            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-red-600 hover:bg-red-50 font-semibold text-sm transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}

            <Link
              to="/catalog-request"
              className="hidden md:inline-flex btn-secondary !px-5 !py-2.5 group"
            >
              Get a quote
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-brand-dark text-white transition-transform duration-300 active:scale-95"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-auto mt-2 max-w-7xl glass rounded-3xl shadow-lift overflow-hidden"
          >
            <div className="p-3 space-y-1">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl font-display text-lg font-bold transition-all duration-300 ${
                      isActivePath(item.path)
                        ? 'bg-brand-dark text-white'
                        : 'text-brand-dark hover:bg-ink-100'
                    }`}
                  >
                    {item.name}
                    <ArrowUpRight className={`w-4 h-4 ${isActivePath(item.path) ? 'text-brand-yellow' : 'text-ink-400'}`} />
                  </Link>
                </motion.div>
              ))}

              {/* Admin Navigation */}
              {adminNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActivePath(item.path)
                      ? 'bg-brand-dark text-white'
                      : 'text-brand-gold hover:bg-ink-100 hover:text-brand-dark'
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
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 font-semibold transition-all duration-300 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}

              <div className="pt-2">
                <Link
                  to="/catalog-request"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary w-full !py-3.5"
                >
                  Get a quote <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
});

export default Navbar;
