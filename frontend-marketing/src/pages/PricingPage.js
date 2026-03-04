import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle, X, ArrowRight, HelpCircle, Zap, Shield, Star } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import config from '../config';

const FAQ_ITEMS = [
  { q: 'Can I cancel anytime?', a: "Yes! You can cancel your subscription at any time. No questions asked, no cancellation fees." },
  { q: 'Is there a free trial?', a: "Yes! Start with our Free plan — no credit card required. Paid plans also include a free trial period." },
  { q: 'What payment methods do you accept?', a: "We accept all major credit cards (Visa, Mastercard, AmEx) securely via Stripe or LemonSqueezy." },
  { q: 'Can I upgrade or downgrade my plan?', a: "Absolutely. You can change your plan at any time. Upgrades take effect immediately; downgrades apply at renewal." },
  { q: 'Do you offer refunds?', a: "We offer a 7-day money-back guarantee on all paid plans if you\u2019re not satisfied — no questions asked." },
  { q: 'Is my data secure?', a: "Yes. We use industry-standard encryption, and we never share your data with third parties." },
];

function PricingPage() {
  const { site } = useSite();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  const brandName = site.companyName || site.siteName || 'Sellsera';

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/v1/public/plans`);
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan) => {
    if (!plan.price) return 0;
    return billingCycle === 'yearly'
      ? (plan.price.yearly || 0)
      : (plan.price.monthly || 0);
  };

  const isPopular = (plan) =>
    plan.metadata?.popular || plan.name.toLowerCase() === 'pro';

  const isFree = (plan) => getPrice(plan) === 0;

  return (
    <div className="bg-white overflow-x-hidden">
      <Navbar />
      
      {/* ═══ HERO ═══ */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-8">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-semibold">Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Affordable Plans for<br />Every Shop Size
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Start free, no credit card required. Upgrade when you're ready to grow faster.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-base font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-blue-200'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-yellow-400' : 'bg-purple-400'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-base font-semibold ${billingCycle === 'yearly' ? 'text-white' : 'text-blue-200'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full">
                Save up to 20%
              </span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full fill-white">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ═══════════ PRICING CARDS ═══════════ */}
      <section className="py-20 -mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-64 h-96 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No plans available at the moment. Please check back soon.</p>
            </div>
          ) : (
            <div className={`grid gap-6 max-w-6xl mx-auto items-end ${
              plans.length === 1 ? 'max-w-sm' :
              plans.length === 2 ? 'md:grid-cols-2 max-w-2xl' :
              plans.length === 3 ? 'md:grid-cols-3 max-w-4xl' :
              'md:grid-cols-4'
            }`}>
              {plans.map((plan, i) => {
                const price = getPrice(plan);
                const popular = isPopular(plan);
                const free = isFree(plan);

                return (
                  <div
                    key={plan._id || i}
                    className={`relative rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                      popular
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-300/40 p-8 scale-105'
                        : 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-xl p-7'
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-purple-900 text-xs font-bold px-5 py-1.5 rounded-full shadow whitespace-nowrap">
                        ★ MOST POPULAR
                      </div>
                    )}

                    <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${popular ? 'text-blue-200' : 'text-purple-600'}`}>
                      {plan.name}
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-5xl font-extrabold">${price}</span>
                      {!free && (
                        <span className={`text-sm ${popular ? 'text-blue-200' : 'text-gray-400'}`}>
                          /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                        </span>
                      )}
                    </div>

                    {billingCycle === 'yearly' && !free && plan.price?.monthly > 0 && (
                      <div className={`text-xs mb-2 ${popular ? 'text-yellow-300' : 'text-green-600'}`}>
                        Save ${((plan.price.monthly * 12) - (plan.price.yearly || 0)).toFixed(0)}/yr
                      </div>
                    )}

                    {plan.description && (
                      <p className={`text-sm mb-4 leading-relaxed ${popular ? 'text-blue-100' : 'text-gray-500'}`}>
                        {plan.description}
                      </p>
                    )}

                    {plan.trialDays > 0 && (
                      <div className={`inline-flex items-center gap-1 text-xs font-semibold mb-4 px-3 py-1 rounded-full w-fit ${ popular ? 'bg-yellow-400/20 text-yellow-300' : 'bg-purple-50 text-purple-600'}`}>
                        <Zap className="w-3 h-3" />
                        {plan.trialDays}-day free trial
                      </div>
                    )}

                    <ul className="space-y-3 mb-8 flex-1">
                      {(plan.features || []).map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm">
                          {f.enabled !== false ? (
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${popular ? 'text-yellow-300' : 'text-green-500'}`} />
                          ) : (
                            <X className={`w-4 h-4 flex-shrink-0 mt-0.5 ${popular ? 'text-blue-300/50' : 'text-gray-300'}`} />
                          )}
                          <span className={
                            f.enabled !== false
                              ? (popular ? 'text-white' : 'text-gray-700')
                              : (popular ? 'text-blue-300/50' : 'text-gray-400')
                          }>
                            {f.featureName || f.label || f.name || f}
                            {f.limit != null && f.enabled !== false && (
                              <strong className={popular ? 'text-yellow-300' : 'text-purple-600'}>
                                {' '}({f.limit === -1 ? 'Unlimited' : f.limit})
                              </strong>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={`${config.customerCenterUrl}/signup`}
                      className={`block text-center py-3.5 rounded-xl font-bold transition-all ${
                        popular
                          ? 'bg-white text-purple-700 hover:bg-purple-50 shadow-lg'
                          : free
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200'
                      }`}
                    >
                      {free ? 'Get Started Free' : 'Start Free Trial'}
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-8">
            All plans include a free tier to get started. <Link to="/contact" className="text-purple-600 hover:underline font-medium">Questions? Contact us.</Link>
          </p>
        </div>
      </section>

      {/* ═══════════ TRUST BADGES ═══════════ */}
      <section className="py-12 border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <Shield className="w-6 h-6" />, label: 'No Credit Card Required', sub: 'For the Free Plan' },
              { icon: <Zap className="w-6 h-6" />, label: 'Instant Access', sub: 'Set up in minutes' },
              { icon: <CheckCircle className="w-6 h-6" />, label: 'Cancel Anytime', sub: 'No lock-in contracts' },
              { icon: <Star className="w-6 h-6" />, label: '7-Day Money Back', sub: 'On all paid plans' },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">{b.icon}</div>
                <div className="font-bold text-gray-900 text-sm">{b.label}</div>
                <div className="text-gray-500 text-xs">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-lg">Everything you need to know about {brandName} plans.</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <span className={`text-2xl font-light flex-shrink-0 text-purple-600 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-500">
              Still have questions?{' '}
              <Link to="/contact" className="text-purple-600 font-semibold hover:underline">
                Contact our team →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-20 bg-gradient-to-br from-purple-700 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Grow Your Etsy Shop?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of sellers using {brandName} to optimize listings and increase revenue.
          </p>
          <a
            href={`${config.customerCenterUrl}/signup`}
            className="group inline-flex items-center gap-2 bg-white text-purple-700 px-10 py-4 rounded-xl text-lg font-bold hover:bg-purple-50 transition-all shadow-2xl"
          >
            Get Started for FREE
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
          <p className="text-blue-200 text-sm mt-5">Free plan available · No credit card required</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PricingPage;
