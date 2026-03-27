/**
 * One-off migration: Update Privacy Policy page with explicit OAuth 2.0 / credential security language.
 *
 * Etsy requires app developers to clearly disclose:
 *   1. OAuth 2.0 with PKCE is used (not passwords)
 *   2. No plain-text credentials are stored
 *   3. Users can revoke access at any time
 *
 * Run:  node src/scripts/migration/updatePrivacyOAuth.js
 */

const mongoose = require('mongoose');
const { MarketingPage } = require('../../models/admin');
require('dotenv').config();

const UPDATED_CONTENT = `Your privacy is important to Sellsera. This Privacy Policy explains how Sellsera ("we", "our", "us") collects, uses, discloses, and safeguards your information when you use our Etsy seller toolkit, website, and related services (collectively, the "Service").

1. Information We Collect

We collect information you provide directly to us when you create a Sellsera account, connect your Etsy shop, subscribe to a plan, or contact our support team. This includes:
• Your name, email address, and account credentials
• Etsy shop URL and public shop data (used to power analytics and listing optimization features)
• Billing and payment information (processed securely by our payment provider — we never store your full card number)
• Usage data such as keyword searches, listings analyzed, and features used
• Device information, browser type, IP address, and referral source
• Cookies and similar tracking technologies (see Section 7)

2. How We Use Your Information

We use the information collected to:
• Provide, maintain, and improve the Sellsera platform and its features
• Generate Etsy keyword research results, listing SEO scores, and shop analytics for your account
• Process payments and manage your subscription
• Send you transactional emails (account verification, billing receipts, usage alerts)
• Send optional product updates and Etsy seller tips (you can unsubscribe at any time)
• Monitor platform performance, detect abuse, and ensure security
• Comply with legal obligations

3. Etsy Data & OAuth Integration

Sellsera connects to your Etsy shop using the Etsy Open API v3 via the industry-standard OAuth 2.0 protocol with PKCE (Proof Key for Code Exchange). This means:

• We never see, access, or store your Etsy password. Authentication is handled entirely by Etsy's own secure login page.
• When you authorize Sellsera, Etsy issues a scoped OAuth access token and refresh token. These tokens grant Sellsera limited, read-only access to your public shop data — they do not provide access to your Etsy password, payment methods, or private financial information.
• OAuth tokens are encrypted at rest using AES-256-GCM encryption and transmitted exclusively over TLS-encrypted connections.
• You can revoke Sellsera's access at any time by disconnecting your Etsy shop from your Sellsera account settings. This immediately invalidates all stored tokens.
• We use the data retrieved through the Etsy API solely to provide you with analytics, listing optimization scores, keyword recommendations, and competitor insights within the Sellsera platform.

4. Authentication & Credential Security

Sellsera takes credential security seriously:
• Sellsera account passwords are one-way hashed using bcrypt with a strong salt factor. We never store passwords in plain text and cannot retrieve your original password.
• If you sign in via Google SSO, authentication is handled through Google's OAuth 2.0 flow — we receive only your name, email, and profile photo. We never receive or store your Google password.
• All Etsy API keys used by the platform are encrypted with AES-256-GCM and rotated regularly as part of our key management practices.
• All sensitive data is transmitted over HTTPS/TLS. Plain-text credential transmission is never used.

5. Information Sharing

We do not sell, rent, or trade your personal information. We may share data with:
• Service providers who help us operate Sellsera (hosting, payment processing, email delivery) — bound by strict data-processing agreements
• Legal authorities when required by law or to protect our legal rights
• A successor entity in the event of a merger, acquisition, or asset sale — you will be notified in advance

6. Data Security

Sellsera implements industry-standard security measures including TLS encryption in transit, AES-256 encryption at rest, regular security audits, and role-based access controls. While no system is 100% secure, we take every reasonable step to protect your data.

7. Cookies

We use cookies and similar technologies to:
• Keep you signed in across sessions
• Remember your preferences and settings
• Analyze usage patterns to improve the platform
• Serve relevant product announcements

You can control cookies through your browser settings. Disabling cookies may limit certain features of the Service.

8. Your Rights

Depending on your jurisdiction, you may have the right to:
• Access and download your personal data
• Correct inaccurate information
• Request deletion of your account and data
• Opt out of marketing communications
• Object to or restrict certain data processing activities

To exercise any of these rights, contact us at privacy@sellsera.com.

9. Data Retention

We retain your data for as long as your Sellsera account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.

10. Children's Privacy

Sellsera is not directed to individuals under the age of 16. We do not knowingly collect personal information from children.

11. International Transfers

Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place in accordance with applicable data-protection laws.

12. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on the Sellsera platform. The "Last updated" date at the top reflects the most recent revision.

13. Contact Us

If you have questions about this Privacy Policy or how Sellsera handles your data, please contact us at privacy@sellsera.com or through our Contact page.`;

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const page = await MarketingPage.findOne({ slug: 'privacy' });
    if (!page) {
      console.error('ERROR: No marketing page with slug "privacy" found. Run seedMarketingPages first.');
      process.exit(1);
    }

    // Find the text block that contains the privacy policy content
    const textBlock = page.blocks.find(b => b.type === 'text' && b.title === 'Privacy Policy');
    if (!textBlock) {
      console.error('ERROR: No text block titled "Privacy Policy" found on the privacy page.');
      process.exit(1);
    }

    textBlock.content = UPDATED_CONTENT;
    textBlock.subtitle = 'Last updated: March 2026';

    await page.save();

    console.log('✅ Privacy Policy updated successfully with OAuth 2.0 and credential security language.');
    console.log('   Sections added/updated:');
    console.log('   • Section 3: "Etsy Data & OAuth Integration" — OAuth 2.0 PKCE, token encryption, revocation');
    console.log('   • Section 4: "Authentication & Credential Security" — bcrypt, Google SSO, API key encryption');
    console.log('   • Sections 5-13 renumbered accordingly');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
