import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import SellseraLogo from './SellseraLogo';
import config from '../config';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { site, navigation, loading } = useSite();
  const location = useLocation();

  const brandName = site.companyName || site.siteName || '';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  if (loading) {
    return (
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16" />
        </div>
      </nav>
    );
  }

  return (
    <nav className={`bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'shadow-sm border-b border-gray-100' : 'border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            {site.logoUrl ? (
              <span className="inline-flex items-center gap-2.5">
                <img src={site.logoUrl} alt={brandName} className="h-8 w-auto" />
                <span className="text-lg font-bold text-gray-900">{brandName}</span>
              </span>
            ) : (
              <SellseraLogo size={32} showText />
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.slug}
                to={item.path}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            {site.enableLogin !== false && (
              <a
                href={`${config.customerCenterUrl}/login`}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </a>
            )}
            {site.enableCustomerSignup !== false && (
              <a
                href={`${config.customerCenterUrl}/signup`}
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-full font-semibold text-sm transition-all"
              >
                Get Started
              </a>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.slug}
                to={item.path}
                className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-gray-100 mt-2">
              {site.enableLogin !== false && (
                <a href={`${config.customerCenterUrl}/login`} className="block text-center text-gray-700 border border-gray-200 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                  Sign In
                </a>
              )}
              {site.enableCustomerSignup !== false && (
                <a href={`${config.customerCenterUrl}/signup`} className="block text-center bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-full text-sm font-semibold transition-all">
                  Get Started
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
