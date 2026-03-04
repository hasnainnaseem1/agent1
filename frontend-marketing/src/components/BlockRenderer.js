import React, { useState, useEffect } from 'react';
import { useSite } from '../context/SiteContext';
import config from '../config';
import {
  Zap, Star, Shield, BarChart3, Upload, Clock, CheckCircle, ChevronDown,
  Mail, MessageCircle, Phone, MapPin, Send, ArrowRight, Sparkles, Target, Users,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   DESIGN SYSTEM
   ─────────────
   Dark sections  : bg-gray-950 (#030712) — hero, CTA, footer
   Light sections  : bg-white, bg-gray-50
   Primary accents : purple-600 (overridden by admin theme via CSS vars)
   No random blue bands. No jarring color breaks. Everything flows.
   ═══════════════════════════════════════════════════════════════════════════════ */

// Icon mapping for dynamic icons from admin
const iconMap = {
  zap: Zap, star: Star, shield: Shield, 'bar-chart': BarChart3,
  upload: Upload, clock: Clock, check: CheckCircle, mail: Mail,
  message: MessageCircle, phone: Phone, map: MapPin, send: Send,
  sparkles: Sparkles, target: Target, users: Users, arrow: ArrowRight,
};

const getIcon = (iconName, className = 'w-6 h-6') => {
  if (!iconName) return null;
  if (/[^\x00-\x7F]/.test(iconName)) return <span className="text-2xl">{iconName}</span>;
  const Ic = iconMap[iconName.toLowerCase()];
  if (Ic) return <Ic className={className} />;
  return <span className="text-2xl">{iconName}</span>;
};

// Check signup / login visibility based on admin feature flags
const shouldShowAuthLink = (href, site) => {
  if (!href) return true;
  if (href.includes('/signup') && site?.enableCustomerSignup === false) return false;
  if (href.includes('/login') && site?.enableLogin === false) return false;
  return true;
};

// Cycling accent colors for feature cards (keeps variety without jarring full-width bands)
const CARD_ACCENTS = [
  { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100' },
  { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
];

/* ══════════════════════════════════════════════════════════════════════════════
   HERO BLOCK — Premium dark section
   ══════════════════════════════════════════════════════════════════════════════ */
const HeroBlock = ({ block }) => {
  const { site } = useSite();
  const brandName = site.companyName || site.siteName || '';

  // Custom background color set by admin → simpler themed layout
  if (block.backgroundColor) {
    return (
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: block.backgroundColor,
          backgroundImage: block.backgroundImage ? `url(${block.backgroundImage})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          color: block.textColor || '#fff',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">{block.title || brandName}</h1>
          {block.subtitle && <p className="text-xl md:text-2xl opacity-90 mb-10 max-w-3xl mx-auto">{block.subtitle}</p>}
          {block.content && <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto">{block.content}</p>}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {block.buttonText && shouldShowAuthLink(block.buttonLink || `${config.customerCenterUrl}/signup`, site) && (
              <a href={block.buttonLink || `${config.customerCenterUrl}/signup`} className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
                {block.buttonText}
              </a>
            )}
            {block.secondaryButtonText && shouldShowAuthLink(block.secondaryButtonLink || '/features', site) && (
              <a href={block.secondaryButtonLink || '/features'} className="border-2 border-white border-opacity-40 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-all">
                {block.secondaryButtonText}
              </a>
            )}
          </div>
        </div>
        {/* Smooth transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 56" fill="none" preserveAspectRatio="none" className="w-full h-10 md:h-14">
            <path d="M0,56 L0,28 Q360,56 720,28 Q1080,0 1440,28 L1440,56 Z" fill="white" />
          </svg>
        </div>
      </section>
    );
  }

  // Default: Premium dark hero
  return (
    <section className="relative overflow-hidden bg-gray-950">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600 opacity-[0.07] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600 opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.12] rounded-full px-5 py-2 text-sm font-medium text-gray-300 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Trusted by Etsy Sellers Worldwide
          </div>

          {/* Headline — clean white, no rainbow gradient */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
            {block.title || `Grow Your Etsy Shop with ${brandName}`}
          </h1>

          {block.subtitle && (
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              {block.subtitle}
            </p>
          )}
          {block.content && (
            <p className="text-base text-gray-500 mb-10 max-w-xl mx-auto">{block.content}</p>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            {block.buttonText && shouldShowAuthLink(block.buttonLink || `${config.customerCenterUrl}/signup`, site) && (
              <a
                href={block.buttonLink || `${config.customerCenterUrl}/signup`}
                className="group bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-500/30 flex items-center justify-center gap-2"
              >
                {block.buttonText}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}
            {block.secondaryButtonText && shouldShowAuthLink(block.secondaryButtonLink || '/features', site) && (
              <a
                href={block.secondaryButtonLink || '/features'}
                className="border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 px-8 py-4 rounded-full font-semibold text-lg transition-all"
              >
                {block.secondaryButtonText}
              </a>
            )}
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            {['No credit card required', 'Free plan available', 'Cancel anytime'].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Smooth wave transition */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 56" fill="none" preserveAspectRatio="none" className="w-full h-10 md:h-14">
          <path d="M0,56 L0,28 Q360,56 720,28 Q1080,0 1440,28 L1440,56 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   FEATURES BLOCK — Clean cards on white / light bg
   ══════════════════════════════════════════════════════════════════════════════ */
const FeaturesBlock = ({ block }) => (
  <section className="py-20 md:py-28" style={{ backgroundColor: block.backgroundColor || '#ffffff', color: block.textColor || undefined }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {block.title && (
        <div className="text-center mb-16">
          <p className="text-purple-600 font-semibold text-sm tracking-wide uppercase mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{block.title}</h2>
          {block.subtitle && <p className="text-lg text-gray-500 max-w-2xl mx-auto">{block.subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {(block.items || []).map((item, idx) => {
          const a = CARD_ACCENTS[idx % CARD_ACCENTS.length];
          return (
            <div key={idx} className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className={`w-12 h-12 ${a.bg} rounded-xl flex items-center justify-center mb-5 ring-1 ${a.ring} group-hover:scale-105 transition-transform`}>
                {getIcon(item.icon, `w-6 h-6 ${a.text}`)}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed text-[15px]">{item.description}</p>
              {item.image && <img src={item.image} alt={item.title} className="mt-5 rounded-xl w-full" />}
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════════════════════════════
   PRICING BLOCK — Fetches real plans from admin-created plans API
   Shows plan name, monthly/yearly toggle, description, assigned features.
   ══════════════════════════════════════════════════════════════════════════════ */
const PricingBlock = ({ block }) => {
  const { site } = useSite();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Fetch live plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/v1/public/plans`);
        const data = await res.json();
        if (data.success && data.plans?.length) {
          setPlans(data.plans);
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Use API plans if available, otherwise fall back to block.items (admin page-builder content)
  const displayPlans = plans.length > 0 ? plans : (block.items || []);
  const isLive = plans.length > 0;

  const formatPrice = (plan) => {
    if (!isLive) return plan.price || 'Free';
    const price = billingCycle === 'yearly' ? plan.price?.yearly : plan.price?.monthly;
    if (!price || price === 0) return '$0';
    const currency = plan.currency === 'USD' ? '$' : plan.currency;
    return `${currency}${price}`;
  };

  const getPeriod = (plan) => {
    if (!isLive) return '';
    const price = billingCycle === 'yearly' ? plan.price?.yearly : plan.price?.monthly;
    if (!price || price === 0) return '';
    return billingCycle === 'yearly' ? '/yr' : '/mo';
  };

  const getPlanFeatures = (plan) => {
    if (!isLive) return plan.features || [];
    return (plan.features || []).filter(f => f.enabled);
  };

  const formatFeatureLabel = (f) => {
    if (typeof f === 'string') return f;
    if (!isLive) return f.featureName || f.label || f.name || '';
    let label = f.featureName || f.featureKey;
    if (f.limit != null) {
      label = `${f.limit === -1 ? 'Unlimited' : f.limit.toLocaleString()} ${label}`;
    } else if (f.value != null && f.value !== '' && f.value !== true) {
      label = `${f.value} ${label}`;
    }
    return label;
  };

  const getColsClass = () => {
    const len = displayPlans.length;
    if (len <= 2) return 'grid-cols-1 md:grid-cols-2 max-w-3xl';
    if (len === 3) return 'grid-cols-1 md:grid-cols-3 max-w-5xl';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl';
  };

  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: block.backgroundColor || '#f9fafb', color: block.textColor || undefined }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {block.title && (
          <div className="text-center mb-12">
            <p className="text-purple-600 font-semibold text-sm tracking-wide uppercase mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{block.title}</h2>
            {block.subtitle && <p className="text-lg text-gray-500 max-w-2xl mx-auto">{block.subtitle}</p>}
          </div>
        )}

        {/* Billing toggle (only when live plans from API) */}
        {isLive && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loadingPlans && plans.length === 0 && (block.items || []).length === 0 && (
          <div className={`grid gap-6 md:gap-8 mx-auto grid-cols-1 md:grid-cols-3 max-w-5xl`}>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-10 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-8" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(j => <div key={j} className="h-4 bg-gray-100 rounded w-full" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plan cards */}
        {displayPlans.length > 0 && (
          <div className={`grid gap-6 md:gap-8 mx-auto ${getColsClass()}`}>
            {displayPlans.map((plan, idx) => {
              const pop = isLive ? plan.isPopular : plan.highlighted;
              const planHref = plan.link || `${config.customerCenterUrl}/signup`;
              const features = getPlanFeatures(plan);
              const priceDisplay = formatPrice(plan);
              const isCustom = isLive && !plan.price?.monthly && !plan.price?.yearly && plan.name?.toLowerCase() !== 'free';
              const isFree = priceDisplay === '$0' || priceDisplay === 'Free';

              return (
                <div
                  key={plan._id || idx}
                  className={`relative rounded-2xl p-8 flex flex-col transition-shadow duration-300 ${
                    pop
                      ? 'bg-gray-950 text-white shadow-2xl ring-2 ring-purple-500/40 scale-[1.03]'
                      : 'bg-white shadow-sm border border-gray-200 hover:shadow-md'
                  }`}
                >
                  {pop && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide uppercase">
                      Most Popular
                    </div>
                  )}

                  {/* Plan name */}
                  <h3 className={`text-xl font-bold mb-2 ${pop ? 'text-white' : 'text-gray-900'}`}>
                    {isLive ? plan.name : plan.title}
                  </h3>

                  {/* Price */}
                  <div className={`mb-1 ${pop ? 'text-white' : 'text-gray-900'}`}>
                    {isCustom ? (
                      <span className="text-4xl font-extrabold">Custom</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold">{isFree ? '$0' : priceDisplay}</span>
                        {!isFree && <span className={`text-base font-medium ${pop ? 'text-gray-400' : 'text-gray-500'}`}>{getPeriod(plan)}</span>}
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className={`text-sm mb-6 ${pop ? 'text-gray-400' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                  )}

                  {/* Features list */}
                  {features.length > 0 && (
                    <ul className="space-y-3 mb-8 flex-1">
                      {features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2.5">
                          <CheckCircle className={`w-4.5 h-4.5 mt-0.5 flex-shrink-0 ${pop ? 'text-emerald-400' : 'text-emerald-500'}`} />
                          <span className={`text-sm ${pop ? 'text-gray-300' : 'text-gray-600'}`}>
                            {formatFeatureLabel(f)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA button */}
                  {shouldShowAuthLink(planHref, site) && (
                    <a
                      href={planHref}
                      className={`block w-full text-center py-3 rounded-full font-semibold text-sm transition-all mt-auto ${
                        pop
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      Get Started
                    </a>
                  )}

                  {/* Trial note */}
                  {isLive && plan.trialDays > 0 && (
                    <p className={`text-xs text-center mt-3 ${pop ? 'text-gray-500' : 'text-gray-400'}`}>
                      {plan.trialDays}-day free trial
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   CTA BLOCK — Dark section matching hero tone
   ══════════════════════════════════════════════════════════════════════════════ */
const CtaBlock = ({ block }) => {
  const { site } = useSite();
  const hasBg = !!block.backgroundColor;

  return (
    <section
      className={`relative overflow-hidden ${!hasBg ? 'bg-gray-950' : ''}`}
      style={hasBg ? { backgroundColor: block.backgroundColor, color: block.textColor || undefined, backgroundImage: block.backgroundImage ? `url(${block.backgroundImage})` : undefined, backgroundSize: 'cover' } : undefined}
    >
      {/* Top wave */}
      {!hasBg && (
        <div className="absolute top-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 56" fill="none" preserveAspectRatio="none" className="w-full h-10 md:h-14">
            <path d="M0,0 L0,28 Q360,0 720,28 Q1080,56 1440,28 L1440,0 Z" fill="white" />
          </svg>
        </div>
      )}

      {/* Ambient glow */}
      {!hasBg && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600 opacity-[0.06] rounded-full blur-[100px] pointer-events-none" />}

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
        {block.title && (
          <h2 className={`text-3xl md:text-5xl font-extrabold mb-6 ${!hasBg ? 'text-white' : ''}`}>{block.title}</h2>
        )}
        {block.subtitle && (
          <p className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${!hasBg ? 'text-gray-400' : 'opacity-80'}`}>{block.subtitle}</p>
        )}
        {block.content && (
          <p className={`text-base mb-8 max-w-xl mx-auto ${!hasBg ? 'text-gray-500' : 'opacity-70'}`}>{block.content}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {block.buttonText && shouldShowAuthLink(block.buttonLink || `${config.customerCenterUrl}/signup`, site) && (
            <a
              href={block.buttonLink || `${config.customerCenterUrl}/signup`}
              className={`group px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                !hasBg
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25'
                  : 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg'
              }`}
            >
              {block.buttonText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
          {block.secondaryButtonText && shouldShowAuthLink(block.secondaryButtonLink || '#', site) && (
            <a
              href={block.secondaryButtonLink || '#'}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all ${
                !hasBg
                  ? 'border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
                  : 'border-2 border-current opacity-80 hover:opacity-100'
              }`}
            >
              {block.secondaryButtonText}
            </a>
          )}
        </div>

        {!hasBg && (
          <p className="text-gray-600 text-sm mt-8">Free plan available · No credit card required</p>
        )}
      </div>

      {/* Bottom wave */}
      {!hasBg && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 56" fill="none" preserveAspectRatio="none" className="w-full h-10 md:h-14">
            <path d="M0,56 L0,28 Q360,56 720,28 Q1080,0 1440,28 L1440,56 Z" fill="white" />
          </svg>
        </div>
      )}
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   FAQ BLOCK
   ══════════════════════════════════════════════════════════════════════════════ */
const FaqBlock = ({ block }) => {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: block.backgroundColor || '#ffffff', color: block.textColor || undefined }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {block.title && (
          <div className="text-center mb-14">
            <p className="text-purple-600 font-semibold text-sm tracking-wide uppercase mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{block.title}</h2>
            {block.subtitle && <p className="text-lg text-gray-500">{block.subtitle}</p>}
          </div>
        )}
        <div className="space-y-3">
          {(block.items || []).map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="text-base font-semibold text-gray-900 pr-4">{item.title}</span>
                <span className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5" />
                </span>
              </button>
              {openIndex === idx && (
                <div className="px-6 pb-5 text-gray-500 leading-relaxed text-[15px] border-t border-gray-100 pt-4">
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   TEXT / CONTENT BLOCK
   ══════════════════════════════════════════════════════════════════════════════ */
const TextBlock = ({ block }) => (
  <section className="py-16 md:py-24" style={{ backgroundColor: block.backgroundColor || '#ffffff', color: block.textColor || undefined }}>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {block.title && <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{block.title}</h2>}
      {block.subtitle && <p className="text-lg text-gray-500 mb-6">{block.subtitle}</p>}
      {block.content && (
        <div className="prose prose-lg prose-gray max-w-none leading-relaxed whitespace-pre-line">
          {block.content}
        </div>
      )}
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════════════════════════════
   CONTACT BLOCK
   ══════════════════════════════════════════════════════════════════════════════ */
const ContactBlock = ({ block }) => {
  const { site } = useSite();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: block.backgroundColor || '#f9fafb', color: block.textColor || undefined }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {block.title && (
          <div className="text-center mb-14">
            <p className="text-purple-600 font-semibold text-sm tracking-wide uppercase mb-3">Contact</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{block.title}</h2>
            {block.subtitle && <p className="text-lg text-gray-500">{block.subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {submitted ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input type="email" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea rows={5} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors resize-none" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </div>
          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            {block.content && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-gray-500 leading-relaxed text-[15px] whitespace-pre-line">{block.content}</p>
              </div>
            )}
            {site.contactEmail && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email Us</p>
                  <a href={`mailto:${site.contactEmail}`} className="text-sm text-purple-600 hover:underline">{site.contactEmail}</a>
                </div>
              </div>
            )}
            {(block.items || []).map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getIcon(item.icon, 'w-5 h-5 text-gray-600')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   STATS BLOCK — Light section, primary-colored numbers (NO jarring blue band)
   ══════════════════════════════════════════════════════════════════════════════ */
const StatsBlock = ({ block }) => {
  const hasBg = !!block.backgroundColor;
  return (
    <section
      className={`py-16 md:py-20 ${!hasBg ? 'bg-gray-50' : ''}`}
      style={hasBg ? { backgroundColor: block.backgroundColor, color: block.textColor || undefined } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {block.title && (
          <div className="text-center mb-12">
            <h2 className={`text-2xl md:text-3xl font-extrabold mb-2 ${hasBg ? '' : 'text-gray-900'}`}>{block.title}</h2>
            {block.subtitle && <p className={`text-base ${hasBg ? 'opacity-80' : 'text-gray-500'}`}>{block.subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {(block.items || []).map((item, idx) => (
            <div key={idx} className="text-center">
              <div className={`text-3xl md:text-4xl font-extrabold mb-1 ${hasBg ? '' : 'text-gray-900'}`}>
                {item.title}
              </div>
              <div className={`text-sm font-medium ${hasBg ? 'opacity-70' : 'text-gray-500'}`}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   TESTIMONIALS BLOCK
   ══════════════════════════════════════════════════════════════════════════════ */
const TestimonialsBlock = ({ block }) => (
  <section className="py-20 md:py-28" style={{ backgroundColor: block.backgroundColor || '#ffffff', color: block.textColor || undefined }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {block.title && (
        <div className="text-center mb-16">
          <p className="text-purple-600 font-semibold text-sm tracking-wide uppercase mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{block.title}</h2>
          {block.subtitle && <p className="text-lg text-gray-500 max-w-2xl mx-auto">{block.subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {(block.items || []).map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-gray-600 leading-relaxed text-[15px] mb-6">"{item.description}"</p>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-sm">{(item.title || '?')[0]}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                {item.icon && <p className="text-xs text-gray-500">{item.icon}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ══════════════════════════════════════════════════════════════════════════════
   CUSTOM HTML BLOCK
   ══════════════════════════════════════════════════════════════════════════════ */
const CustomBlock = ({ block }) => (
  <section style={{ backgroundColor: block.backgroundColor || undefined, color: block.textColor || undefined }}>
    <div dangerouslySetInnerHTML={{ __html: block.content || '' }} />
  </section>
);

/* ══════════════════════════════════════════════════════════════════════════════
   BLOCK RENDERER
   ══════════════════════════════════════════════════════════════════════════════ */
const blockComponents = {
  hero: HeroBlock,
  features: FeaturesBlock,
  pricing: PricingBlock,
  cta: CtaBlock,
  faq: FaqBlock,
  text: TextBlock,
  contact: ContactBlock,
  stats: StatsBlock,
  testimonials: TestimonialsBlock,
  custom: CustomBlock,
};

const BlockRenderer = ({ blocks = [] }) => (
  <>
    {blocks.map((block, idx) => {
      const Component = blockComponents[block.type];
      if (!Component) return null;
      return <Component key={block._id || idx} block={block} />;
    })}
  </>
);

export default BlockRenderer;
