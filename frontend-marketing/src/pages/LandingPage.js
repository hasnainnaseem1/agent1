import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Zap, ArrowRight, CheckCircle, Search, TrendingUp, BarChart3,
  Star, Users, Award, BookOpen, ChevronRight, Play, Shield,
  Target, Clock, Sparkles
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import config from '../config';

function LandingPage() {
  const { site } = useSite();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const brandName = site.companyName || site.siteName || 'Sellsera';
  const tagline = site.appTagline || 'Grow Your Etsy Shop with Smart Data';
  const description = site.appDescription || site.siteDescription || 'Keyword research, competitor analysis, trend tracking and listing optimization — all in one powerful platform.';

  useEffect(() => {
    fetch(`${config.apiUrl}/api/v1/public/plans`)
      .then(r => r.json())
      .then(d => { if (d.success) setPlans(d.plans || []); })
      .catch(() => {})
      .finally(() => setPlansLoading(false));

    fetch(`${config.apiUrl}/api/v1/public/blog?limit=3`)
      .then(r => r.json())
      .then(d => { if (d.success) setBlogPosts(d.posts || []); })
      .catch(() => {});
  }, []);

  const stats = [
    { value: '10,000+', label: 'Active Sellers' },
    { value: '500K+', label: 'Listings Analyzed' },
    { value: '4.9★', label: 'Average Rating' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const features = [
    {
      icon: <Search className="w-7 h-7" />,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      title: 'Keyword Research',
      description: 'Discover high-performing keywords tailored to your niche. Find what real shoppers are searching for across multiple marketplaces.',
    },
    {
      icon: <Target className="w-7 h-7" />,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      title: 'Competitor Analysis',
      description: "Gain deep insight into your competitors' strategies. Identify opportunities to outshine them and capture more market share.",
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      title: 'Trend Tracking',
      description: 'Stay ahead of the curve with real-time data on trending products and seasonal searches. Never miss a buying wave again.',
    },
    {
      icon: <Zap className="w-7 h-7" />,
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      title: 'Listing Optimization',
      description: 'Get AI-powered, actionable tips to improve your listings. Better titles, smarter tags, and visibility that converts.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Connect Your Shop',
      desc: 'Integrate seamlessly with your Etsy store for up-to-date analysis of your listings and sales performance.',
      icon: <Shield className="w-6 h-6" />,
    },
    {
      num: '02',
      title: 'Optimize Your Listings',
      desc: "Use our tools to enhance your marketplace visibility by knowing exactly what real shoppers are searching for.",
      icon: <Sparkles className="w-6 h-6" />,
    },
    {
      num: '03',
      title: 'Track & Grow',
      desc: 'Monitor your progress and keep watch on trends, buying habits, and new competitors emerging daily.',
      icon: <BarChart3 className="w-6 h-6" />,
    },
  ];

  const benefits = [
    { icon: <Clock className="w-5 h-5" />, title: 'Save Time', desc: 'Streamline your research' },
    { icon: <TrendingUp className="w-5 h-5" />, title: 'Increase Sales', desc: 'Reach customers organically' },
    { icon: <Target className="w-5 h-5" />, title: 'Stay Ahead', desc: 'Lead among competitors' },
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Data-Driven', desc: 'Informed shop decisions' },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      shop: 'PaperBloomCo.etsy.com',
      rating: 5,
      text: `${brandName} truly understands what Etsy sellers need. The keyword research tools helped me 3× my shop revenue within 3 months. I couldn't imagine running my shop without it.`,
      avatar: 'SC',
      color: 'bg-purple-600',
    },
    {
      name: 'Marcus Johnson',
      shop: 'WoodcraftStudio.etsy.com',
      rating: 5,
      text: "The competitor analysis feature is a game changer. I started tracking top sellers in my niche and gained invaluable insights into the strategies driving their remarkable sales figures.",
      avatar: 'MJ',
      color: 'bg-blue-600',
    },
    {
      name: 'Priya Patel',
      shop: 'BohoJewelsByPriya.etsy.com',
      rating: 5,
      text: "I started using this tool within the first week of opening my shop. The trend tracking helped me stay ahead of every seasonal wave. My shop grew faster than I ever imagined possible.",
      avatar: 'PP',
      color: 'bg-green-600',
    },
  ];

  const getPrice = (plan) => {
    if (!plan?.price) return 0;
    return plan.price.monthly || 0;
  };

  const isPopular = (plan) => plan?.metadata?.popular || plan?.name?.toLowerCase() === 'pro';

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return ''; }
  };

  return (
    <div className="overflow-x-hidden">
      <Navbar />

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-800/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-5 py-2 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-sm font-semibold tracking-wide">Trusted by 10,000+ Etsy Sellers</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              {tagline}
            </h1>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <a
                href={`${config.customerCenterUrl}/signup`}
                className="group inline-flex items-center justify-center gap-3 bg-white text-purple-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-purple-50 transition-all shadow-2xl hover:shadow-purple-900/30 hover:-translate-y-0.5"
              >
                Start for Free TODAY
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </a>
            </div>

            {/* Trust line */}
            <p className="text-purple-200 text-sm">
              ✓ Free plan available &nbsp;·&nbsp; ✓ No credit card required &nbsp;·&nbsp; ✓ Set up in 2 minutes
            </p>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full fill-white">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHY CHOOSE US — FEATURES
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Why Choose {brandName}?
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              Everything You Need to Succeed on Etsy
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Our powerful suite of tools helps you optimize listings, drive traffic, and boost sales — all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  <div className={`bg-gradient-to-br ${f.color} rounded-lg p-2 text-white`}>
                    {f.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits mini-grid */}
          <div className="mt-16 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-4">
                  From little things, big things grow.
                </h3>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Every Etsy shop began with a single sale. Our mission is to work side-by-side with YOU, growing your shop from that first transaction to the small business of your dreams.
                </p>
                <a
                  href={`${config.customerCenterUrl}/signup`}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Start for Free TODAY
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((b, i) => (
                  <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-white">
                    <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 mb-3">
                      {b.icon}
                    </div>
                    <div className="font-bold text-gray-900 text-sm">{b.title}</div>
                    <div className="text-gray-500 text-xs mt-1">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Play className="w-4 h-4" />
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              Three steps to more sales
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Get up and running in minutes. No technical knowledge required.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-purple-200 via-blue-200 to-green-200" style={{ left: '20%', right: '20%' }} />

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((s, i) => (
                <div key={i} className="relative text-center">
                  {/* Step number circle */}
                  <div className="relative inline-flex">
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-purple-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <div>
                        <div className="text-3xl font-extrabold text-purple-600">{s.num}</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-14">
            <a
              href={`${config.customerCenterUrl}/signup`}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 hover:-translate-y-0.5 transition-all"
            >
              Start for Free TODAY
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Community
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              Join a Community of Successful Sellers
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Thousands of Etsy sellers trust {brandName} to help them grow their businesses—whether just starting or scaling fast.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1 mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full ${t.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.shop}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRICING PREVIEW (dynamic from API)
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              Affordable Plans for Every Shop Size
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Start free, upgrade when you're ready to scale. No surprises.
            </p>
          </div>

          {plansLoading ? (
            <div className="flex justify-center gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-56 h-64 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className={`grid gap-6 max-w-6xl mx-auto ${plans.length <= 2 ? 'md:grid-cols-2 max-w-2xl' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
              {plans.map((plan, i) => {
                const price = getPrice(plan);
                const popular = isPopular(plan);
                return (
                  <div
                    key={plan._id || i}
                    className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                      popular
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-300 scale-105'
                        : 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-lg'
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 text-xs font-bold px-4 py-1 rounded-full shadow">
                        MOST POPULAR
                      </div>
                    )}
                    <div className={`text-sm font-semibold uppercase tracking-widest mb-2 ${popular ? 'text-blue-200' : 'text-purple-600'}`}>
                      {plan.name}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-extrabold">${price}</span>
                      {price > 0 && <span className={popular ? 'text-blue-200' : 'text-gray-400'}>/mo</span>}
                    </div>
                    <p className={`text-sm mb-5 ${popular ? 'text-blue-100' : 'text-gray-500'}`}>
                      {plan.description || (price === 0 ? 'Perfect for exploring the platform' : 'For growing and scaling your shop')}
                    </p>
                    <ul className="space-y-2 mb-7 flex-1">
                      {(plan.features || []).slice(0, 4).map((feat, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${popular ? 'text-yellow-300' : 'text-green-500'}`} />
                          <span className={popular ? 'text-blue-100' : 'text-gray-600'}>
                            {typeof feat === 'string' ? feat : feat.label || feat.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`${config.customerCenterUrl}/signup`}
                      className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                        popular
                          ? 'bg-white text-purple-700 hover:bg-purple-50'
                          : price === 0
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback skeleton pricing */
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {['Free', 'Pro', 'Expert'].map((name, i) => (
                <div key={i} className={`rounded-2xl p-7 ${i === 1 ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white scale-105 shadow-2xl' : 'bg-white border border-gray-200'}`}>
                  <div className={`text-sm font-semibold uppercase tracking-widest mb-2 ${i === 1 ? 'text-blue-200' : 'text-purple-600'}`}>{name}</div>
                  <div className="text-4xl font-extrabold mb-5">{i === 0 ? '$0' : i === 1 ? '$9.99' : '$29.99'}<span className={`text-base font-normal ${i === 1 ? 'text-blue-200' : 'text-gray-400'}`}>{i > 0 ? '/mo' : ''}</span></div>
                  <a href={`${config.customerCenterUrl}/signup`} className={`block text-center py-3 rounded-xl font-semibold ${i === 1 ? 'bg-white text-purple-700' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                    {i === 0 ? 'Get Started Free' : 'Start Trial'}
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/pricing" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-lg">
              Compare all plans
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BLOG / TIPS (dynamic from API)
      ═══════════════════════════════════════════ */}
      {blogPosts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                <BookOpen className="w-4 h-4" />
                Resources
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
                Useful Tips for Etsy Sellers
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                Expert guides, tutorials, and strategies to help your shop thrive.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {blogPosts.map((post, i) => (
                <Link
                  key={post._id || i}
                  to={`/blog/${post.slug}`}
                  className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {post.imageUrl ? (
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-purple-300" />
                    </div>
                  )}
                  <div className="p-6">
                    {post.category && (
                      <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                        {post.category}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                      <span className="flex items-center gap-1 text-purple-600 font-semibold">
                        Read more <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Visit Blog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════ */}
      <section className="relative py-24 bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4 text-yellow-300" />
            Ready to grow your shop?
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Realize Your Etsy Shop's<br />Full Potential
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of sellers who use {brandName} to optimize listings, outrank competitors, and grow their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${config.customerCenterUrl}/signup`}
              className="group inline-flex items-center justify-center gap-3 bg-white text-purple-700 px-10 py-4 rounded-xl text-lg font-bold hover:bg-purple-50 transition-all shadow-2xl hover:-translate-y-0.5"
            >
              Get Started for FREE
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">
            Free plan available · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;


      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 mr-2 text-yellow-300" />
              <span className="text-sm font-semibold">AI-Powered Optimization</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Stop Analyzing.<br />
              <span className="text-yellow-300">Start Selling.</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
              Get exact, copy-paste ready improvements for your listings in 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a 
                href={`${config.customerCenterUrl}/signup`}
                className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-purple-50 transition shadow-xl inline-flex items-center justify-center"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              
              <a 
                href="#how-it-works"
                className="bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-purple-800 transition border-2 border-purple-400 inline-flex items-center justify-center"
              >
                See How It Works
              </a>
            </div>

            <div className="text-purple-200 text-sm">
              ✨ <strong>1 free analysis</strong> • No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tired of Complicated SEO Tools?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Other tools give you data. We give you <strong>exact actions to take</strong>.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200">
              <div className="text-red-600 font-bold mb-4 flex items-center">
                <span className="text-2xl mr-2">❌</span>
                Other Tools
              </div>
              <ul className="space-y-3 text-gray-600">
                <li>• Show you confusing charts and graphs</li>
                <li>• Make YOU figure out what to change</li>
                <li>• Give vague suggestions like "improve SEO"</li>
                <li>• Require hours of learning and analysis</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl shadow-lg border-2 border-purple-300">
              <div className="text-purple-600 font-bold mb-4 flex items-center">
                <span className="text-2xl mr-2">✅</span>
                Sellsera
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Tells you EXACTLY what to change
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Copy-paste ready titles, tags, descriptions
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Specific pricing recommendations
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Get results in 30 seconds, not 30 minutes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600">
              AI-powered insights that actually help you sell more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Copy className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Copy-Paste Ready
              </h3>
              <p className="text-gray-600">
                Every suggestion comes with exact text you can copy and paste directly into your listing.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Competitor Intelligence
              </h3>
              <p className="text-gray-600">
                We analyze what's working for your competitors and tell you exactly how to compete.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                30 Second Analysis
              </h3>
              <p className="text-gray-600">
                Paste your listing details, click analyze, and get instant recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to better listings
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Paste Your Listing
              </h3>
              <p className="text-gray-600">
                Copy your listing details - title, tags, price, description.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                AI Analyzes
              </h3>
              <p className="text-gray-600">
                Our AI compares against competitors and finds gaps.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Copy & Update
              </h3>
              <p className="text-gray-600">
                Get exact text to copy-paste. Update your listing. See sales increase.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <a 
              href={`${config.customerCenterUrl}/signup`}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:shadow-xl transition inline-flex items-center"
            >
              Try It Free Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
              </div>
              <p className="text-gray-600 mb-6">Try it out</p>
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  1 analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  All features
                </li>
              </ul>
              <a 
                href={`${config.customerCenterUrl}/signup`}
                className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold transition"
              >
                Get Started
              </a>
            </div>

            {/* Starter */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$19</span>
                <span className="text-gray-600">/mo</span>
              </div>
              <p className="text-gray-600 mb-6">For beginners</p>
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  50 analyses/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Save history
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Email support
                </li>
              </ul>
              <a 
                href={`${config.customerCenterUrl}/signup`}
                className="block text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Start Free Trial
              </a>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-xl shadow-2xl border-2 border-purple-400 transform md:scale-105">
              <div className="bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">$49</span>
                <span className="text-purple-200">/mo</span>
              </div>
              <p className="text-purple-100 mb-6">For growing shops</p>
              <ul className="space-y-3 mb-6 text-sm text-white">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-yellow-300 mr-2" />
                  250 analyses/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-yellow-300 mr-2" />
                  Weekly monitoring
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-yellow-300 mr-2" />
                  Priority support
                </li>
              </ul>
              <a 
                href={`${config.customerCenterUrl}/signup`}
                className="block text-center bg-white text-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-50 transition"
              >
                Start Free Trial
              </a>
            </div>

            {/* Unlimited */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlimited</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$79</span>
                <span className="text-gray-600">/mo</span>
              </div>
              <p className="text-gray-600 mb-6">For power users</p>
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Unlimited analyses
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  API access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  White-label option
                </li>
              </ul>
              <Link 
                to="/contact" 
                className="block text-center bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-lg font-semibold transition"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Increase Your Sales?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Join hundreds of users who have optimized their listings with AI
          </p>
          <a 
            href={`${config.customerCenterUrl}/signup`}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-purple-50 transition shadow-xl inline-flex items-center"
          >
            Get Your Free Analysis
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
          <p className="text-purple-200 text-sm mt-4">
            No credit card required • Takes 30 seconds
          </p>
        </div>
      </section>

      <Footer />
    </div>    
  );
}

export default LandingPage;