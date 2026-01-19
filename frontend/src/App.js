import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import pages
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
// import DashboardPage from './pages/DashboardPage'; // Uncomment when created
// import HistoryPage from './pages/HistoryPage'; // Uncomment when created

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* Auth Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Pages - Uncomment when created */}
        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        {/* <Route path="/history" element={<HistoryPage />} /> */}
        
        {/* 404 Page - Optional */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// Simple 404 component
function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Page not found</p>
        <a 
          href="/" 
          className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default App;