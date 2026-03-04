import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Zap, Target, TrendingUp, Upload, BarChart3, Search,
  CheckCircle, XCircle, ArrowRight, Sparkles, Shield
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import config from '../config';

// Icon map for admin-managed features
const iconMap = {
  zap: Zap, target: Target, trending: TrendingUp, upload: Upload,
  chart: BarChart3, search: Search, shield: Shield,
};

const DEFAULT_FEATURES = [
  {
    key: 'keyword',
    icon: <Search className="w-8 h-8" />,
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50',
    textColor: 'text-purple-700',
    title: 'Keyword Research',
    description: "Discover high-performing keywords tailored to your niche. Find what real shoppers are searching for across multiple marketplaces and countries.",
    bullets: [
      'Global keyword database updated daily',
      'Search volume & competition metrics',
      'Long-tail keyword suggestions',
      'Top keywords per category & season',
    ],
  },
  {
    key: 'competitor',
    icon: <Target className="w-8 h-8" />,
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    textColor: 'text-blue-700',
    title: 'Competitor Analysis',
    description: "Gain deep insight into your competitors' strategies. Find opportunities to outshine them and capture market share in your niche.",
    bullets: [
      'Track top sellers in your category',
      'Analyze competitor keywords & tags',
      'Compare pricing strategies',
      'Identify gaps you can exploit',
    ],
  },
  {
    key: 'trends',
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'from-green-500 to-green-700',
    bg: 'bg-green-50',
    textColor: 'text-green-700',
    title: 'Trend Tracking',
    description: "Stay ahead of the curve with up-to-date data on trending products and seasonal searches. Never miss a buying wave again.",
    bullets: [
      'Real-time trend detection',
      'Seasonal & holiday trend alerts',
      'Rising keyword notifications',
      'Multi-marketplace trend data',
    ],
  },
  {
    key: 'listing',
    icon: <Zap className="w-8 h-8" />,
    color: 'from-orange-500 to-orange-700',
    bg: 'bg-orange-50',
    textColor: 'text-orange-700',
    title: 'Listing Optimization',
    description: "Improve your product listings with AI-powered, actionable tips. Better titles, smarter tags, and descriptions that convert browsers into buyers.",
    bullets: [
      'AI-powered title & tag suggestions',
      'Description optimization tips',
      'Photo quality scoring',
      'Listing health score with priority fixes',
    ],
  },
  {
    key: 'analytics',
    icon: <BarChart3 className="w-8 h-8" />,
    color: 'from-pink-500 to-pink-700',
    bg: 'bg-pink-50',
    textColor: 'text-pink-700',
    title: 'Shop Analytics',
    description: "Track your shop's performance over time. Understand what's driving sales and where to focus your optimization efforts.",
    bullets: [
      'Revenue & order tracking',
      'Traffic source breakdown',
      'Listing performance history',
      'Exportable CSV/JSON reports',
    ],
  },
  {
    key: 'bulk',
    icon: <Upload className="w-8 h-8" />,
    color: 'from-teal-500 to-teal-700',
    bg: 'bg-teal-50',
    textColor: 'text-teal-700',
    title: 'Bulk Processing',
    description: "Got dozens of listings? Analyze your entire shop at once and get a prioritized list of exactly which listings need fixing first.",
    bullets: [
      'Upload entire shop via CSV',
      'Priority ranking of worst listings',
      'Batch export of all recommendations',
      'Shop-wide health overview',
    ],
  },
];

const COMPARISON = [
  { label: 'Keyword Research',        us: true,  them: true },
  { label: 'Competitor Analysis',     us: true,  them: true },
  { label: 'AI-Powered Suggestions',  us: true,  them: false },
  { label: 'Listing Health Score',    us: true,  them: false },
  { label: 'Trend Alerts',            us: true,  them: true },
  { label: 'Bulk Shop Analysis',      us: true,  them: false },
  { label: 'Copy-Paste Ready Fixes',  us: true,  them: false },
  { label: 'Free Plan Available',     us: true,  them: false },
];

function FeaturesPage() {
  const { site } = useSite();
  const [apiFeatures, setApiFeatures] = useState([]);
  const brandName = site.companyName || site.siteName || 'Sellsera';

  useEffect(() => {
    fetch(`${config.apiUrl}/api/v1/public/features`)
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.features) && d.features.length) setApiFeatures(d.features); })
      .catch(() => {});
  }, []);

  // Use API features if available; map them to the display shape; else use defaults
  const displayFeatures = apiFeatures.length > 0
    ? apiFeatures.map((f, i) => {
        const defaults = DEFAULT_FEATURES[i % DEFAULT_FEATURES.length];
        return { ...defaults, key: f._id, title: f.name, description: f.description || defaults.description };
      })
    : DEFAULT_FEATURES;

  return (
    <div className="bg-white overflow-x-hidden">
      <Navbar />

      {/* ═══════════════════
          HERO
      ═══════════════════ */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-semibold">Comprehensive Etsy Seller Toolkit</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Every Tool You Need<br />
            <span className="text-yellow-300">to Succeed on Etsy</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
            Keyword research, competitor analysis, trend tracking, and listing optimization — all in one powerful platform purpose-built for Etsy sellers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${config.customerCenterUrl}/signup`}
              className="group inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-purple-50 transition-all shadow-2xl"
            >
              Start for Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link to="/pricing" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all">
              View Pricing
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full fill-white">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════
          FEATURES GRID
      ═══════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Powerful features designed to help you sell more on Etsy — without spending hours on guesswork.
            </p>
          </div>

          <div className="space-y-16">
            {displayFeatures.map((f, i) => (
              <div
                key={f.key}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-10 items-center`}
              >
                {/* Icon/Visual block */}
                <div className={`flex-shrink-0 w-full md:w-64 h-56 rounded-3xl ${f.bg} flex items-center justify-center shadow-inner`}>
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center shadow-lg`}>
                    {f.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className={`inline-block ${f.bg} ${f.textColor} text-sm font-bold px-3 py-1 rounded-full mb-4`}>
                    {f.title}
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-4">{f.title}</h3>
                  <p className="text-gray-500 text-lg mb-6 leading-relaxed">{f.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {f.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════
          COMPARISON TABLE
      ═══════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              How We Compare
            </h2>
            <p className="text-xl text-gray-500">
              See why {brandName} gives you more for less.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100 px-6 py-4">
              <div className="col-span-1 font-semibold text-gray-500 text-sm uppercase tracking-wide">Feature</div>
              <div className="text-center font-bold text-purple-600 text-sm uppercase tracking-wide">{brandName}</div>
              <div className="text-center font-semibold text-gray-400 text-sm uppercase tracking-wide">Typical Tools</div>
            </div>

            {COMPARISON.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-4 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-100 last:border-0`}>
                <div className="text-gray-700 font-medium text-sm">{row.label}</div>
                <div className="flex justify-center">
                  {row.us
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-red-300" />
                  }
                </div>
                <div className="flex justify-center">
                  {row.them
                    ? <CheckCircle className="w-5 h-5 text-green-400" />
                    : <XCircle className="w-5 h-5 text-red-300" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════
          FINAL CTA
      ═══════════════════ */}
      <section className="py-24 bg-gradient-to-br from-purple-700 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Put These Tools to Work?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of Etsy sellers already using {brandName} to grow their shops with data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${config.customerCenterUrl}/signup`}
              className="group inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-purple-50 transition-all shadow-2xl"
            >
              Start for Free TODAY
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center border-2 border-white/50 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">Free plan available · No credit card required</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default FeaturesPage;
