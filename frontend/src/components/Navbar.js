import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Seller Agent
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="text-gray-700 hover:text-purple-600 font-medium transition">
              Features
            </Link>
            <Link to="/pricing" className="text-gray-700 hover:text-purple-600 font-medium transition">
              Pricing
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-purple-600 font-medium transition">
              Contact
            </Link>
            <Link 
              to="/login" 
              className="text-gray-700 hover:text-purple-600 font-medium transition"
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/features" 
                className="text-gray-700 hover:text-purple-600 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-700 hover:text-purple-600 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-purple-600 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-purple-600 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-center"
                onClick={() => setIsOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;