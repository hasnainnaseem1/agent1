const mongoose = require('mongoose');
const { MarketingPage } = require('../../models/admin');
require('dotenv').config();

/**
 * Seed Script — Create default marketing pages (Sellsera — Etsy Seller Toolkit)
 * Run: node src/scripts/seed/seedMarketingPages.js
 *
 * Creates 7 pages: Landing (homepage), Features, Pricing, Contact, Privacy, Terms, Blog
 * Each page is fully editable from the Admin Center.
 *
 * SEO / GEO / AIO optimised:
 *   • Primary keywords:  Etsy SEO tool, Etsy keyword research, Etsy seller tools,
 *     Etsy listing optimization, Etsy shop analytics, Etsy competitor analysis,
 *     eRank alternative, grow Etsy shop, sell on Etsy, Etsy rank checker,
 *     Etsy search optimization, best Etsy tools 2025, Etsy tag generator,
 *     Etsy trend finder, Etsy profit calculator, Etsy niche research
 *   • Long-tail & conversational (LLM-friendly):
 *     "What is the best tool for Etsy sellers?",
 *     "How do I rank higher on Etsy search?",
 *     "What is the best eRank alternative?",
 *     "How to find trending products on Etsy?"
 */

const defaultPages = [
  // ════════════════════════════════════════════════════════════════
  //  LANDING / HOMEPAGE
  // ════════════════════════════════════════════════════════════════
  {
    title: 'Home',
    slug: 'home',
    description: 'Sellsera — the all-in-one Etsy seller toolkit for keyword research, shop analytics, listing optimization, and competitor analysis.',
    metaTitle: 'Sellsera — #1 Etsy SEO Tool & Seller Toolkit | Keyword Research, Shop Analytics & More',
    metaDescription: 'Sellsera is the best Etsy seller tool for keyword research, listing optimization, competitor analysis, and shop analytics. The top-rated eRank alternative trusted by 50,000+ Etsy sellers. Start free today.',
    metaKeywords: 'Etsy SEO tool, Etsy keyword research, Etsy seller tools, Etsy listing optimization, Etsy shop analytics, Etsy competitor analysis, eRank alternative, grow Etsy shop, sell on Etsy, Etsy rank checker, Etsy search optimization, best Etsy tools 2025, Etsy tag generator, Etsy trend finder',
    status: 'published',
    isHomePage: true,
    showInNavigation: false,
    navigationOrder: 0,
    blocks: [
      // ── Hero ──────────────────────────────────────────────
      {
        type: 'hero',
        title: 'Rank Higher on Etsy. Sell More. Grow Faster.',
        subtitle: 'Sellsera is the all-in-one Etsy SEO tool that gives you keyword research, listing optimization, shop analytics, and competitor insights — everything you need to dominate Etsy search and grow your handmade business. Trusted by 50,000+ Etsy sellers worldwide as the #1 eRank alternative.',
        buttonText: 'Start Free — No Credit Card',
        buttonLink: '/signup',
        secondaryButtonText: 'See All Features',
        secondaryButtonLink: '/features',
        order: 0,
        visible: true,
      },
      // ── Social-Proof Stats ────────────────────────────────
      {
        type: 'stats',
        title: 'The Etsy seller toolkit trusted by top-performing shops',
        items: [
          { title: '50,000+', description: 'Active Etsy Sellers' },
          { title: '12M+', description: 'Keywords Researched' },
          { title: '3.2M+', description: 'Listings Optimized' },
          { title: '4.9 / 5', description: 'Average User Rating' },
        ],
        order: 1,
        visible: true,
      },
      // ── Core Features Overview ────────────────────────────
      {
        type: 'features',
        title: 'Everything Etsy Sellers Need in One Platform',
        subtitle: 'From finding winning keywords to tracking your competitors, Sellsera replaces a dozen browser tabs with a single powerful dashboard. Here is why sellers switch from eRank and other Etsy tools to Sellsera.',
        items: [
          {
            title: 'Etsy Keyword Research',
            description: 'Discover high-volume, low-competition Etsy keywords in seconds. Sellsera analyzes millions of Etsy search queries so you can find the exact keywords buyers type when looking for products like yours. Stop guessing tags — start ranking.',
            icon: 'search',
          },
          {
            title: 'Listing Optimization Score',
            description: 'Get an instant SEO score for every listing. Sellsera audits your title, tags, description, images, and attributes against Etsy best practices and tells you exactly what to fix to climb higher in Etsy search results.',
            icon: 'sparkles',
          },
          {
            title: 'Shop Analytics Dashboard',
            description: 'Track revenue, visits, conversion rate, and listing performance in a beautiful real-time dashboard. Understand which products drive profit and which ones need attention — all in one place.',
            icon: 'bar-chart',
          },
          {
            title: 'Competitor Analysis',
            description: 'See what top Etsy shops in your niche are doing right. Analyze their bestsellers, pricing strategy, tags, and estimated revenue. Use data-driven insights to stay ahead of the competition.',
            icon: 'target',
          },
          {
            title: 'Etsy Trend Finder',
            description: 'Spot trending products and seasonal demand before the crowd. Sellsera surfaces rising Etsy search trends, popular categories, and emerging niches so you can list the right products at the right time.',
            icon: 'trending-up',
          },
          {
            title: 'Profit & Fee Calculator',
            description: 'Know your real profit on every sale. Sellsera accounts for Etsy fees, shipping costs, material expenses, and taxes so you can price your products for maximum margin — no more spreadsheet headaches.',
            icon: 'calculator',
          },
        ],
        order: 2,
        visible: true,
      },
      // ── Testimonials ──────────────────────────────────────
      {
        type: 'testimonials',
        title: 'Loved by Etsy Sellers Around the World',
        subtitle: 'See why thousands of Etsy shop owners choose Sellsera over eRank, Marmalead, and other Etsy SEO tools.',
        items: [
          {
            title: 'Jessica M.',
            description: 'Sellsera helped me go from 20 sales a month to over 300. The keyword research tool is a game-changer — I found low-competition tags I never would have thought of. Best eRank alternative I have tried.',
            icon: 'Owner, Juniper & Thread (Handmade Jewelry)',
            image: '',
          },
          {
            title: 'David K.',
            description: 'The competitor analysis feature alone is worth the subscription. I can see exactly which tags and pricing strategies top sellers in my niche use. My revenue jumped 140% in three months.',
            icon: 'Owner, WoodCraft Wonders (Custom Woodwork)',
            image: '',
          },
          {
            title: 'Priya S.',
            description: 'I switched from eRank to Sellsera and never looked back. The dashboard is 10x cleaner, the data is more accurate, and the listing optimization score tells me exactly what to fix. My shop went from page 3 to page 1.',
            icon: 'Owner, Priya\'s Print Studio (Digital Downloads)',
            image: '',
          },
        ],
        order: 3,
        visible: true,
      },
      // ── Bottom CTA ────────────────────────────────────────
      {
        type: 'cta',
        title: 'Ready to Grow Your Etsy Shop?',
        subtitle: 'Join 50,000+ Etsy sellers who use Sellsera to find winning keywords, optimize listings, and outsell their competition. Start your free trial today — no credit card required.',
        buttonText: 'Start Free Trial',
        buttonLink: '/signup',
        secondaryButtonText: 'View Pricing',
        secondaryButtonLink: '/pricing',
        order: 4,
        visible: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  FEATURES PAGE
  // ════════════════════════════════════════════════════════════════
  {
    title: 'Features',
    slug: 'features',
    description: 'Explore every Sellsera feature — Etsy keyword research, listing SEO audit, shop analytics, competitor tracker, trend finder, and more.',
    metaTitle: 'Sellsera Features — Etsy Keyword Research, Listing Optimization, Shop Analytics & Competitor Tools',
    metaDescription: 'Explore all Sellsera features: Etsy keyword research, listing SEO audit, shop analytics, competitor analysis, trend finder, profit calculator, and more. The most complete Etsy seller toolkit available.',
    metaKeywords: 'Etsy keyword research tool, Etsy listing optimization, Etsy shop analytics, Etsy competitor analysis, Etsy trend finder, Etsy tag generator, Etsy SEO audit, Etsy profit calculator, Etsy niche research, eRank alternative features',
    status: 'published',
    isHomePage: false,
    showInNavigation: true,
    navigationOrder: 1,
    navigationLabel: 'Features',
    blocks: [
      // Hero
      {
        type: 'hero',
        title: 'Powerful Etsy Seller Tools — All in One Place',
        subtitle: 'Sellsera gives you every tool you need to research, optimize, analyze, and grow your Etsy shop. No more juggling five different apps — one subscription, complete coverage.',
        buttonText: 'Try Free for 14 Days',
        buttonLink: '/signup',
        order: 0,
        visible: true,
      },
      // Core Features
      {
        type: 'features',
        title: 'Core Etsy SEO & Research Tools',
        subtitle: 'The foundation of every successful Etsy shop: data-driven keyword research and listing optimization.',
        items: [
          {
            title: 'Advanced Etsy Keyword Research',
            description: 'Search our database of millions of Etsy keywords. See monthly search volume, competition level, click rate, and keyword trends over time. Filter by category, price range, or tag count. Export keyword lists in one click to apply directly to your Etsy listings. The most comprehensive Etsy keyword tool on the market.',
            icon: 'search',
          },
          {
            title: 'Listing SEO Audit & Optimizer',
            description: 'Paste any Etsy listing URL and get a detailed SEO score with actionable recommendations. Sellsera checks your title structure, tag usage, description keyword density, image alt-text, attributes, and category selection. Fix the issues and watch your Etsy search ranking improve.',
            icon: 'sparkles',
          },
          {
            title: 'Etsy Tag Generator',
            description: 'Automatically generate the best 13 tags for any Etsy listing based on search volume, relevancy, and competition data. Sellsera suggests long-tail Etsy keywords that real shoppers use, helping your listings appear in more search results.',
            icon: 'tag',
          },
          {
            title: 'Long-Tail Keyword Explorer',
            description: 'Find profitable long-tail Etsy search phrases that your competitors overlook. Sellsera surfaces "hidden gem" keywords with high purchase intent and low competition — perfect for new listings or shops looking to break into a niche.',
            icon: 'compass',
          },
          {
            title: 'Keyword Rank Tracker',
            description: 'Track where your listings rank for target keywords day by day. See historical charts, spot ranking drops early, and measure the impact of your SEO changes. Know exactly where you stand in Etsy search results.',
            icon: 'trending-up',
          },
          {
            title: 'Category & Attribute Advisor',
            description: 'Choosing the wrong category or missing attributes hurts your Etsy SEO. Sellsera recommends the optimal category, sub-category, and attributes for every listing based on what top-ranking competitors use.',
            icon: 'layers',
          },
        ],
        order: 1,
        visible: true,
      },
      // Analytics & Intelligence
      {
        type: 'features',
        title: 'Shop Analytics & Competitive Intelligence',
        subtitle: 'Data-driven insights that turn guesses into strategy. Understand your shop, your market, and your competition.',
        items: [
          {
            title: 'Real-Time Shop Dashboard',
            description: 'See your Etsy shop performance at a glance — revenue, visits, orders, conversion rate, and average order value — updated in real time. Drill into individual listings to find your top performers and underperformers.',
            icon: 'bar-chart',
          },
          {
            title: 'Competitor Shop Tracker',
            description: 'Add any Etsy shop to your watchlist and track their new listings, pricing changes, bestsellers, estimated monthly revenue, and tag strategy. Understand what top sellers in your niche are doing differently.',
            icon: 'target',
          },
          {
            title: 'Etsy Trend & Demand Finder',
            description: 'Discover what Etsy shoppers are searching for right now. Sellsera identifies rising trends, seasonal spikes, and emerging niches weeks before they peak — so you can list first and profit most.',
            icon: 'flame',
          },
          {
            title: 'Profit & Fee Calculator',
            description: 'Enter your product cost, shipping, and selling price — Sellsera calculates your true profit after Etsy listing fees, transaction fees, payment processing fees, and taxes. Price smarter, earn more.',
            icon: 'calculator',
          },
          {
            title: 'Niche Research & Opportunity Score',
            description: 'Evaluate any Etsy niche before you enter it. Sellsera calculates an Opportunity Score based on demand, competition saturation, average price, and revenue potential. Find profitable niches with confidence.',
            icon: 'compass',
          },
          {
            title: 'Custom Reports & Exports',
            description: 'Build custom reports combining keyword data, listing scores, and shop analytics. Export as CSV or PDF. Share live report links with your team or virtual assistant for seamless collaboration.',
            icon: 'file-text',
          },
        ],
        order: 2,
        visible: true,
      },
      // CTA
      {
        type: 'cta',
        title: 'See Sellsera in Action',
        subtitle: 'Start a free 14-day trial and explore every feature — no credit card required. Join the Etsy sellers who rank higher, sell more, and grow faster with Sellsera.',
        buttonText: 'Start Free Trial',
        buttonLink: '/signup',
        secondaryButtonText: 'View Pricing',
        secondaryButtonLink: '/pricing',
        order: 3,
        visible: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  PRICING PAGE
  // ════════════════════════════════════════════════════════════════
  {
    title: 'Pricing',
    slug: 'pricing',
    description: 'Sellsera pricing plans for Etsy sellers of every size. Free, Starter, Professional, and Enterprise plans available with monthly and yearly billing.',
    metaTitle: 'Sellsera Pricing — Affordable Etsy SEO Tool Plans | Free, Starter, Pro & Enterprise',
    metaDescription: 'Compare Sellsera pricing plans. Free plan available. Affordable Etsy keyword research, listing optimization, and shop analytics for hobby sellers to enterprise brands. Save 20% with annual billing.',
    metaKeywords: 'Sellsera pricing, Etsy SEO tool price, Etsy keyword research cost, eRank alternative pricing, best Etsy tool free plan, Etsy seller tools pricing, affordable Etsy analytics',
    status: 'published',
    isHomePage: false,
    showInNavigation: true,
    navigationOrder: 2,
    navigationLabel: 'Pricing',
    blocks: [
      // Hero
      {
        type: 'hero',
        title: 'Simple, Transparent Pricing for Every Etsy Seller',
        subtitle: 'Whether you are just starting your Etsy shop or running a six-figure handmade business, Sellsera has a plan that fits. No hidden fees. No long-term contracts. Cancel anytime.',
        order: 0,
        visible: true,
      },
      // Pricing block (rendered dynamically from Plans model, but seed provides fallback)
      {
        type: 'pricing',
        title: 'Choose the Right Plan for Your Etsy Shop',
        subtitle: 'All plans include a 14-day free trial. No credit card needed to start.',
        items: [
          {
            title: 'Free',
            price: '$0',
            description: 'Perfect for new Etsy sellers exploring keyword research and basic SEO tools.',
            features: [
              'Up to 50 keyword searches / month',
              'Listing SEO score (3 listings)',
              'Basic shop dashboard',
              'Etsy fee calculator',
              'Community support',
            ],
            highlighted: false,
          },
          {
            title: 'Starter',
            price: '$19/mo',
            description: 'For growing Etsy shops that need more keyword data and listing optimization.',
            features: [
              'Unlimited keyword searches',
              'Listing SEO score (unlimited)',
              'Etsy tag generator',
              'Keyword rank tracking (25 keywords)',
              'Competitor tracker (3 shops)',
              'Email support',
            ],
            highlighted: false,
          },
          {
            title: 'Professional',
            price: '$39/mo',
            description: 'For serious Etsy sellers who want every competitive advantage.',
            features: [
              'Everything in Starter',
              'Keyword rank tracking (unlimited)',
              'Competitor tracker (25 shops)',
              'Trend & demand finder',
              'Niche opportunity scorer',
              'Custom reports & CSV export',
              'Priority support',
            ],
            highlighted: true,
          },
          {
            title: 'Enterprise',
            price: 'Custom',
            description: 'For Etsy agencies, large shops, and multi-store brands.',
            features: [
              'Everything in Professional',
              'Unlimited competitor tracking',
              'API access for custom integrations',
              'Dedicated account manager',
              'Team collaboration (unlimited seats)',
              'Custom onboarding & training',
              'SLA & priority phone support',
            ],
            highlighted: false,
          },
        ],
        order: 1,
        visible: true,
      },
      // FAQ
      {
        type: 'faq',
        title: 'Pricing FAQs',
        subtitle: 'Frequently asked questions about Sellsera plans and billing.',
        items: [
          {
            title: 'Is there really a free plan?',
            description: 'Yes. Sellsera offers a genuinely free plan with 50 keyword searches per month, listing scores for 3 listings, and a basic shop dashboard. No credit card required — sign up and start researching in minutes.',
          },
          {
            title: 'Can I switch or cancel my plan anytime?',
            description: 'Absolutely. You can upgrade, downgrade, or cancel your Sellsera subscription at any time from your account settings. There are no cancellation fees or long-term commitments.',
          },
          {
            title: 'Do you offer a discount for annual billing?',
            description: 'Yes! Save 20% when you choose annual billing on any paid plan. The discount is applied automatically at checkout.',
          },
          {
            title: 'What payment methods do you accept?',
            description: 'Sellsera accepts all major credit and debit cards (Visa, Mastercard, American Express, Discover), PayPal, and bank transfers for Enterprise plans.',
          },
          {
            title: 'How does the 14-day free trial work?',
            description: 'When you sign up for any paid plan, you get full access to every feature for 14 days at no cost. No credit card is required to start. If you decide not to continue, your account automatically reverts to the free plan.',
          },
          {
            title: 'How is Sellsera different from eRank?',
            description: 'Sellsera is built as a modern, all-in-one Etsy seller toolkit. Compared to eRank, Sellsera offers a faster interface, deeper keyword data, real-time shop analytics, a built-in Etsy tag generator, niche opportunity scoring, and a cleaner dashboard — all at a competitive price.',
          },
        ],
        order: 2,
        visible: true,
      },
      // CTA
      {
        type: 'cta',
        title: 'Start Growing Your Etsy Shop Today',
        subtitle: 'Sign up in 30 seconds. No credit card required. Explore every feature free for 14 days.',
        buttonText: 'Get Started Free',
        buttonLink: '/signup',
        order: 3,
        visible: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  CONTACT PAGE
  // ════════════════════════════════════════════════════════════════
  {
    title: 'Contact Us',
    slug: 'contact',
    description: 'Contact the Sellsera team for support, partnerships, or general inquiries.',
    metaTitle: 'Contact Sellsera — Etsy Seller Support & Inquiries',
    metaDescription: 'Have questions about Sellsera, Etsy keyword research, or your account? Contact our support team. We typically respond within 24 hours.',
    metaKeywords: 'contact Sellsera, Sellsera support, Etsy tool help, Etsy SEO support, Sellsera customer service',
    status: 'published',
    isHomePage: false,
    showInNavigation: true,
    navigationOrder: 3,
    navigationLabel: 'Contact',
    blocks: [
      // Hero
      {
        type: 'hero',
        title: 'We Are Here to Help You Succeed on Etsy',
        subtitle: 'Whether you have a question about Sellsera features, need help optimizing your Etsy shop, or want to explore a partnership — our team is ready to help.',
        order: 0,
        visible: true,
      },
      // Contact Form + Info
      {
        type: 'contact',
        title: 'Send Us a Message',
        subtitle: 'Fill out the form below and a member of our team will get back to you within 24 hours.',
        content: 'Our support team is available Monday through Friday, 9 AM to 6 PM (EST). For urgent account issues, email support@sellsera.com directly.',
        items: [
          {
            title: 'Email',
            description: 'support@sellsera.com',
            icon: 'mail',
          },
          {
            title: 'Social',
            description: '@sellsera on Twitter, Instagram & Facebook',
            icon: 'message',
          },
        ],
        order: 1,
        visible: true,
      },
      // FAQ
      {
        type: 'faq',
        title: 'Common Questions Before You Reach Out',
        items: [
          {
            title: 'What is Sellsera\'s typical response time?',
            description: 'We respond to most inquiries within 24 hours on business days. Priority support plan members receive responses within 4 hours.',
          },
          {
            title: 'Do you offer live demos of Sellsera?',
            description: 'Yes! Mention "live demo" in your message and we will schedule a personalized walkthrough of the platform, tailored to your Etsy niche.',
          },
          {
            title: 'I need help connecting my Etsy shop. What do I do?',
            description: 'Our getting-started guide walks you through the process step by step. If you still need help, send us a message and we will assist you personally.',
          },
          {
            title: 'Can I request a feature?',
            description: 'Absolutely! We build Sellsera based on seller feedback. Submit your idea through this contact form and our product team will review it.',
          },
        ],
        order: 2,
        visible: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  PRIVACY POLICY
  // ════════════════════════════════════════════════════════════════
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    description: 'Sellsera privacy policy — how we collect, use, and protect your data.',
    metaTitle: 'Privacy Policy — Sellsera',
    metaDescription: 'Learn how Sellsera collects, uses, and protects your personal information. We are committed to transparency and data security for all Etsy sellers using our platform.',
    metaKeywords: 'Sellsera privacy policy, Etsy tool data privacy, Sellsera data protection',
    status: 'published',
    isHomePage: false,
    showInNavigation: false,
    navigationOrder: 90,
    blocks: [
      {
        type: 'text',
        title: 'Privacy Policy',
        subtitle: 'Last updated: February 2026',
        content: `Your privacy is important to Sellsera. This Privacy Policy explains how Sellsera ("we", "our", "us") collects, uses, discloses, and safeguards your information when you use our Etsy seller toolkit, website, and related services (collectively, the "Service").

1. Information We Collect

We collect information you provide directly to us when you create a Sellsera account, connect your Etsy shop, subscribe to a plan, or contact our support team. This includes:
• Your name, email address, and account credentials
• Etsy shop URL and public shop data (used to power analytics and listing optimization features)
• Billing and payment information (processed securely by our payment provider — we never store your full card number)
• Usage data such as keyword searches, listings analyzed, and features used
• Device information, browser type, IP address, and referral source
• Cookies and similar tracking technologies (see Section 6)

2. How We Use Your Information

We use the information collected to:
• Provide, maintain, and improve the Sellsera platform and its features
• Generate Etsy keyword research results, listing SEO scores, and shop analytics for your account
• Process payments and manage your subscription
• Send you transactional emails (account verification, billing receipts, usage alerts)
• Send optional product updates and Etsy seller tips (you can unsubscribe at any time)
• Monitor platform performance, detect abuse, and ensure security
• Comply with legal obligations

3. Etsy Data

When you connect your Etsy shop, Sellsera accesses publicly available shop data through the Etsy API. We do not access your Etsy password or private financial information. We use this data solely to provide you with analytics, listing scores, and recommendations within the Sellsera platform.

4. Information Sharing

We do not sell, rent, or trade your personal information. We may share data with:
• Service providers who help us operate Sellsera (hosting, payment processing, email delivery) — bound by strict data-processing agreements
• Legal authorities when required by law or to protect our legal rights
• A successor entity in the event of a merger, acquisition, or asset sale — you will be notified in advance

5. Data Security

Sellsera implements industry-standard security measures including TLS encryption in transit, AES-256 encryption at rest, regular security audits, and role-based access controls. While no system is 100% secure, we take every reasonable step to protect your data.

6. Cookies

We use cookies and similar technologies to:
• Keep you signed in across sessions
• Remember your preferences and settings
• Analyze usage patterns to improve the platform
• Serve relevant product announcements

You can control cookies through your browser settings. Disabling cookies may limit certain features of the Service.

7. Your Rights

Depending on your jurisdiction, you may have the right to:
• Access and download your personal data
• Correct inaccurate information
• Request deletion of your account and data
• Opt out of marketing communications
• Object to or restrict certain data processing activities

To exercise any of these rights, contact us at privacy@sellsera.com.

8. Data Retention

We retain your data for as long as your Sellsera account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.

9. Children's Privacy

Sellsera is not directed to individuals under the age of 16. We do not knowingly collect personal information from children.

10. International Transfers

Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place in accordance with applicable data-protection laws.

11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on the Sellsera platform. The "Last updated" date at the top reflects the most recent revision.

12. Contact Us

If you have questions about this Privacy Policy or how Sellsera handles your data, please contact us at privacy@sellsera.com or through our Contact page.`,
        order: 0,
        visible: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  TERMS & CONDITIONS
  // ════════════════════════════════════════════════════════════════
  {
    title: 'Terms & Conditions',
    slug: 'terms',
    description: 'Sellsera terms and conditions of service.',
    metaTitle: 'Terms & Conditions — Sellsera',
    metaDescription: 'Read the Sellsera terms of service governing your use of our Etsy seller toolkit, website, and subscription plans.',
    metaKeywords: 'Sellsera terms of service, Sellsera terms and conditions, Etsy tool terms',
    status: 'published',
    isHomePage: false,
    showInNavigation: false,
    navigationOrder: 91,
    blocks: [
      {
        type: 'text',
        title: 'Terms & Conditions',
        subtitle: 'Last updated: February 2026',
        content: `Welcome to Sellsera. By accessing or using the Sellsera website, platform, and related services (collectively, the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree, please do not use the Service.

1. Definitions

"Sellsera" refers to the Sellsera platform, website, and all related tools and services.
"User", "you", "your" refers to any individual or entity that accesses or uses the Service.
"Etsy" is a trademark of Etsy, Inc. Sellsera is an independent third-party tool and is not affiliated with, endorsed by, or sponsored by Etsy, Inc.

2. Account Registration

To access paid features, you must create a Sellsera account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.

3. Subscription & Billing

• Sellsera offers free and paid subscription plans as described on our Pricing page.
• Paid subscriptions are billed in advance on a monthly or annual basis, depending on the plan you choose.
• All prices are in USD unless otherwise stated.
• You may upgrade, downgrade, or cancel your plan at any time from your account settings.
• Refunds are handled on a case-by-case basis. Contact support@sellsera.com for refund requests.
• We reserve the right to modify pricing with at least 30 days' prior notice.

4. Acceptable Use

You agree not to:
• Use Sellsera for any unlawful purpose or to violate any third-party rights
• Attempt to scrape, reverse-engineer, or copy Sellsera data or features
• Share your account credentials with unauthorized third parties
• Use the Service to send spam, misleading content, or malicious code
• Interfere with or disrupt the platform's operation or security
• Resell or redistribute Sellsera data without written permission

5. Etsy Data & Third-Party Services

Sellsera uses publicly available Etsy data and the Etsy API to provide keyword research, listing analysis, and shop analytics. We do not guarantee the accuracy, completeness, or timeliness of third-party data. Your use of Etsy is subject to Etsy's own terms of service.

6. Intellectual Property

All content, features, design, code, and trademarks of the Sellsera platform are owned by Sellsera and protected by intellectual property laws. You may not reproduce, modify, or distribute any part of the Service without prior written consent.

7. Limitation of Liability

Sellsera is provided "as is" and "as available" without warranties of any kind, whether express or implied. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of revenue, data, or business opportunities.

8. Indemnification

You agree to indemnify and hold harmless Sellsera, its officers, employees, and affiliates from any claims, damages, or losses arising from your use of the Service or violation of these Terms.

9. Termination

We may suspend or terminate your account if you violate these Terms. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately, and we may delete your data in accordance with our Privacy Policy.

10. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict-of-law principles.

11. Changes to Terms

We reserve the right to modify these Terms at any time. We will notify you of material changes via email or platform notice. Continued use of Sellsera after changes constitutes acceptance of the revised Terms.

12. Severability

If any provision of these Terms is found unenforceable, the remaining provisions shall continue in full force and effect.

13. Contact

For questions about these Terms, contact us at legal@sellsera.com or through our Contact page.`,
        order: 0,
        visible: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  BLOG PAGE
  // ════════════════════════════════════════════════════════════════
  {
    title: 'Blog',
    slug: 'blog',
    description: 'Sellsera blog — Etsy seller tips, keyword research guides, listing optimization tutorials, and platform updates.',
    metaTitle: 'Sellsera Blog — Etsy Seller Tips, SEO Guides & Keyword Research Strategies',
    metaDescription: 'Read the Sellsera blog for expert Etsy selling tips, keyword research strategies, listing optimization guides, shop growth tactics, and product updates. Level up your Etsy game.',
    metaKeywords: 'Etsy seller tips, Etsy SEO guide, Etsy keyword research blog, how to sell on Etsy, Etsy listing tips, grow Etsy shop, Sellsera updates, Etsy seller blog',
    status: 'published',
    isHomePage: false,
    showInNavigation: true,
    navigationOrder: 4,
    navigationLabel: 'Blog',
    blocks: [
      // Hero
      {
        type: 'hero',
        title: 'The Sellsera Blog — Your Etsy Growth Playbook',
        subtitle: 'Actionable Etsy SEO tips, keyword research strategies, listing optimization guides, and data-driven insights to help you rank higher, sell more, and grow your handmade business.',
        order: 0,
        visible: true,
      },
      // Featured Articles (placeholder cards)
      {
        type: 'features',
        title: 'Latest Articles & Guides',
        subtitle: 'Expert-written content to help every Etsy seller — from beginners to six-figure shops.',
        items: [
          {
            title: 'Etsy SEO in 2025: The Complete Guide to Ranking #1',
            description: 'Learn how the Etsy search algorithm works, how to research and choose the right keywords, optimize your titles and tags, and measure your Etsy SEO performance with Sellsera.',
            icon: 'search',
            image: '',
          },
          {
            title: 'How to Find Profitable Etsy Niches with Data',
            description: 'Step-by-step guide to using Sellsera\'s niche opportunity scorer to identify low-competition, high-demand product categories before you invest time or money.',
            icon: 'compass',
            image: '',
          },
          {
            title: '13 Etsy Tag Mistakes That Kill Your Rankings',
            description: 'Are your Etsy tags hurting your visibility? We break down the 13 most common tagging mistakes sellers make and show you how to fix them using Sellsera\'s tag generator.',
            icon: 'tag',
            image: '',
          },
          {
            title: 'Sellsera vs. eRank: A Detailed Feature Comparison',
            description: 'Wondering how Sellsera compares to eRank? We put both tools side-by-side across keyword research, listing optimization, analytics, pricing, and ease of use.',
            icon: 'target',
            image: '',
          },
          {
            title: 'How to Set Up Your Sellsera Account in 5 Minutes',
            description: 'A quick-start guide covering account creation, Etsy shop connection, your first keyword search, and how to run a listing SEO audit. You will be up and running in minutes.',
            icon: 'sparkles',
            image: '',
          },
          {
            title: 'Seasonal Etsy Trends: What to Sell & When',
            description: 'Discover the seasonal trends that drive Etsy sales throughout the year. From Valentine\'s Day to Christmas, learn when to launch new products and which keywords to target.',
            icon: 'trending-up',
            image: '',
          },
        ],
        order: 1,
        visible: true,
      },
      // Newsletter CTA
      {
        type: 'cta',
        title: 'Get Etsy Selling Tips in Your Inbox',
        subtitle: 'Subscribe to the Sellsera newsletter for weekly Etsy SEO tips, keyword trends, and growth strategies. No spam — unsubscribe anytime.',
        buttonText: 'Subscribe Now',
        buttonLink: '/contact',
        order: 2,
        visible: true,
      },
    ],
  },
];


const seedMarketingPages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check existing pages
    const existingCount = await MarketingPage.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing marketing page(s).`);
      console.log('   Deleting existing pages before re-seeding...');
      await MarketingPage.deleteMany({});
      console.log('   Deleted all existing marketing pages.');
    }

    // Insert all pages
    const created = await MarketingPage.insertMany(defaultPages);
    console.log(`\n🎉 Successfully created ${created.length} marketing pages:\n`);
    created.forEach((page) => {
      console.log(`   ${page.isHomePage ? '🏠' : '📄'} ${page.title.padEnd(22)} → /${page.slug} (${page.blocks.length} blocks) [${page.status}]`);
    });

    console.log('\n✅ Seed complete! You can now edit these pages from the Admin Center → Marketing Site → Pages.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedMarketingPages();
