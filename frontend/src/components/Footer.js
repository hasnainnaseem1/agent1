import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, Twitter, Linkedin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-white">
                AI Seller Agent
              </span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Etsy listing optimization powered by AI. Get instant, copy-paste ready improvements to increase your sales.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:hasnainn37@gmail.com" className="text-gray-400 hover:text-purple-500 transition">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#twitter" className="text-gray-400 hover:text-purple-500 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#linkedin" className="text-gray-400 hover:text-purple-500 transition">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-gray-400 hover:text-purple-500 transition">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-purple-500 transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-gray-400 hover:text-purple-500 transition">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-purple-500 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-purple-500 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-purple-500 transition">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2024 AI Seller Agent. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;