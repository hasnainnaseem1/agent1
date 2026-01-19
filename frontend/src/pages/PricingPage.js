import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle, X } from 'lucide-react';

function PricingPage() {
  return (
    <div className="bg-white">
      <Navbar />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our core AI optimization features.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            
            {/* Free */}
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$0</span>
              </div>
              <p className="text-gray-600 mb-8">Perfect to try it out</p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">1 listing analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All optimization features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Copy-paste suggestions</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">Save history</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">Weekly monitoring</span>
                </li>
              </ul>
              
              <Link 
                to="/signup" 
                className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-lg font-bold transition"
              >
                Get Started
              </Link>
            </div>

            {/* Starter */}
            <div className="bg-white rounded-xl shadow-xl border-2 border-purple-300 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$19</span>
                <span className="text-gray-600 text-xl">/month</span>
              </div>
              <p className="text-gray-600 mb-8">For small shops</p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>50 analyses/month</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Save analysis history</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Export to CSV</span>
                </li>
                <li className="flex items-start">
                  <X className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">Weekly monitoring</span>
                </li>
              </ul>
              
              <Link 
                to="/signup" 
                className="block text-center bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-2xl border-4 border-yellow-400 p-8 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-purple-900 text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$49</span>
                <span className="text-purple-200 text-xl">/month</span>
              </div>
              <p className="text-purple-100 mb-8">For growing businesses</p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white"><strong>250 analyses/month</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Weekly monitoring reports</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Priority email support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Bulk CSV upload</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Advanced analytics</span>
                </li>
              </ul>
              
              <Link 
                to="/signup" 
                className="block text-center bg-white text-purple-600 py-3 rounded-lg font-bold hover:bg-purple-50 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Unlimited */}
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlimited</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$79</span>
                <span className="text-gray-600 text-xl">/month</span>
              </div>
              <p className="text-gray-600 mb-8">For power sellers</p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Unlimited analyses</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Daily monitoring</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">White-label option</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated support</span>
                </li>
              </ul>
              
              <Link 
                to="/contact" 
                className="block text-center bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-bold transition"
              >
                Contact Sales
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. No questions asked.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Do unused analyses roll over?
              </h3>
              <p className="text-gray-600">
                No, analyses reset monthly. But you can always upgrade to Unlimited if you need more!
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All paid plans come with a 7-day free trial. No credit card required for the Free plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PricingPage;