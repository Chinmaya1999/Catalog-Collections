import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FestiveOfferPopup from './components/FestiveOfferPopup';
import { Loader2 } from 'lucide-react';

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SuperadminDashboard = lazy(() => import('./pages/SuperadminDashboard'));
const CatalogRequest = lazy(() => import('./pages/CatalogRequest'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-light">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Admin and super admin dashboards have their own sidebar-based shell,
// so the public site navbar/footer are hidden on those routes.
const AppLayout = () => {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith('/superadmin') || location.pathname === '/admin/dashboard';

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardRoute && <Navbar />}
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/catalog-request" element={<CatalogRequest />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
          </Routes>
        </Suspense>
      </main>
      {!isDashboardRoute && <Footer />}
      {!isDashboardRoute && <FestiveOfferPopup />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
