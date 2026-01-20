import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Tag, DollarSign, CheckCircle, AlertCircle, Copy, Check, Loader } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    price: '',
    category: ''
  });

  const [errors, setErrors] = useState({});

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData(token);
  }, [navigate]);

  const fetchUserData = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a valid number greater than 0';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnalyze = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setAnalyzing(true);
      setResults(null);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          price: parseFloat(formData.price),
          category: formData.category
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.analysis);
        // Update user data to reflect new usage count
        setUser(prev => ({
          ...prev,
          analysisCount: data.usage.current
        }));
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert(data.message);
        if (data.upgradeRequired) {
          setTimeout(() => navigate('/pricing'), 2000);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error analyzing listing. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleSaveToHistory = () => {
    alert('Analysis already saved to history! View it in the History page.');
    navigate('/history');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analyze Your Etsy Listing
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Get instant AI-powered recommendations to boost your sales
          </p>
          
          {/* Usage Counter */}
          {user && (
            <div className="inline-block bg-white rounded-lg shadow-md px-6 py-3 border-2 border-purple-200">
              <p className="text-sm text-gray-600">
                Analyses Used: <span className="font-bold text-purple-600">{user.analysisCount}/{user.analysisLimit}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Plan: <span className="font-semibold capitalize">{user.plan}</span>
              </p>
            </div>
          )}
        </div>

        {/* Analysis Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
            Listing Details
          </h2>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Listing Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Handmade Leather Wallet | Personalized Gift"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product in detail..."
                rows={6}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., leather wallet, gift, personalized, handmade"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="29.99"
                  step="0.01"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Accessories, Home Decor"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="mt-8">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {analyzing ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Listing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div id="results-section" className="space-y-6">
            {/* Score Card */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl shadow-lg p-8 text-white">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Analysis Complete!</h2>
                <div className="text-6xl font-bold mb-2">{results.score}/100</div>
                <p className="text-lg opacity-90">Optimization Score</p>
              </div>
            </div>

            {/* Optimized Title */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
                  Optimized Title
                </h3>
                <button
                  onClick={() => copyToClipboard(results.recommendations.optimizedTitle, 'title')}
                  className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  {copiedField === 'title' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-3">
                <p className="text-gray-900 font-medium">{results.recommendations.optimizedTitle}</p>
              </div>
              <p className="text-gray-600 text-sm">{results.recommendations.titleReasoning}</p>
            </div>

            {/* Optimized Description */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Optimized Description
                </h3>
                <button
                  onClick={() => copyToClipboard(results.recommendations.optimizedDescription, 'description')}
                  className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  {copiedField === 'description' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-3 whitespace-pre-wrap">
                <p className="text-gray-900">{results.recommendations.optimizedDescription}</p>
              </div>
              <p className="text-gray-600 text-sm">{results.recommendations.descriptionReasoning}</p>
            </div>

            {/* Optimized Tags */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Tag className="w-6 h-6 text-purple-600 mr-2" />
                  Optimized Tags ({results.recommendations.optimizedTags.length})
                </h3>
                <button
                  onClick={() => copyToClipboard(
                    results.recommendations.optimizedTags.map(t => t.tag).join(', '),
                    'tags'
                  )}
                  className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  {copiedField === 'tags' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.recommendations.optimizedTags.map((tagObj, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-purple-600">{tagObj.tag}</span>
                    </div>
                    <p className="text-sm text-gray-600">{tagObj.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Recommendation */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                <DollarSign className="w-6 h-6 text-purple-600 mr-2" />
                Pricing Recommendation
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">Suggested Price</p>
                  <p className="text-4xl font-bold text-green-600">
                    ${results.recommendations.pricingRecommendation.suggestedPrice}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Min</p>
                    <p className="font-semibold">${results.recommendations.pricingRecommendation.competitorRange.min}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Average</p>
                    <p className="font-semibold">${results.recommendations.pricingRecommendation.competitorRange.average}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Max</p>
                    <p className="font-semibold">${results.recommendations.pricingRecommendation.competitorRange.max}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{results.recommendations.pricingRecommendation.reasoning}</p>
            </div>

            {/* Action Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600 mr-2" />
                Action Items
              </h3>
              <div className="space-y-3">
                {results.recommendations.actionItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      item.priority === 'high'
                        ? 'bg-red-50 border-red-500'
                        : item.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              item.priority === 'high'
                                ? 'bg-red-200 text-red-800'
                                : item.priority === 'medium'
                                ? 'bg-yellow-200 text-yellow-800'
                                : 'bg-blue-200 text-blue-800'
                            }`}
                          >
                            {item.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">{item.action}</p>
                        <p className="text-sm text-gray-600">{item.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save to History Button */}
            <div className="text-center">
              <button
                onClick={handleSaveToHistory}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold px-8 py-4 rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-105"
              >
                View in History
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;