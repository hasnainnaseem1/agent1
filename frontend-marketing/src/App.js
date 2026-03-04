import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SiteProvider, useSite } from './context/SiteContext';
import RedirectHandler from './components/RedirectHandler';
import DynamicPage from './pages/DynamicPage';
import BlogListPage from './pages/BlogListPage';
import BlogDetailPage from './pages/BlogDetailPage';
import MaintenancePage from './pages/MaintenancePage';
import config from './config';

// Redirect to customer center immediately — check before React does anything.
// replace() removes this entry from browser history so back button skips it.
const AUTH_PATHS = ['/login', '/signup'];
const currentPath = window.location.pathname;
if (AUTH_PATHS.includes(currentPath)) {
  window.location.replace(`${config.customerCenterUrl}${currentPath}${window.location.search}`);
}

// Fallback component shown only during the replace() call (essentially never visible)
const ExternalRedirect = () => null;

function App() {
  return (
    <SiteProvider>
      <AppContent />
    </SiteProvider>
  );
}

const AppContent = () => {
  const { site, loading } = useSite();

  if (loading) return null;

  if (site?.maintenance?.enabled) {
    return <MaintenancePage message={site?.maintenance?.message} siteName={site?.companyName || site?.siteName} />;
  }

  return (
    <Router>
      <RedirectHandler />
      <Routes>
        {/* Auth pages — redirect to customer center */}
        <Route path="/login" element={<ExternalRedirect />} />
        <Route path="/signup" element={<ExternalRedirect />} />
        {/* Blog pages */}
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        {/* Homepage — fully admin-controlled via marketing page builder */}
        <Route path="/" element={<DynamicPage isHome />} />
        {/* ALL other pages — fully admin-controlled (features, pricing, contact, about, privacy, terms, etc.) */}
        <Route path="/:slug" element={<DynamicPage />} />
      </Routes>
    </Router>
  );
};

export default App;

