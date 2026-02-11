const dns = require('dns').promises;

/**
 * List of known temporary/disposable email domains
 * You can expand this list or use an API service for comprehensive blocking
 */
const TEMP_EMAIL_DOMAINS = [
  // Common temporary email services
  '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.org',
  'sharklasers.com', 'guerrillamail.net', 'guerrillamail.biz', 'spam4.me',
  'grr.la', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
  'mailinator.com', 'maildrop.cc', 'temp-mail.org', 'tempmail.com',
  'throwaway.email', 'yopmail.com', 'fake-mail.com', 'fakeinbox.com',
  'trashmail.com', 'mailnesia.com', 'emailondeck.com', 'mintemail.com',
  'mytemp.email', 'tempinbox.com', 'dispostable.com', 'emailtemporanea.net',
  'burnermail.io', 'getnada.com', 'mohmal.com', 'anonbox.net',
  'mailcatch.com', 'mailsac.com', 'tempr.email', 'throwawaymail.com',
  'crazymailing.com', 'spamgourmet.com', 'mailforspam.com', 'getairmail.com',
  'harakirimail.com', 'mailexpire.com', 'tempemail.net', 'temp-email.org',
  
  // Add more as needed
  'tmail.ws', 'tafmail.com', 'moakt.com', 'tempsky.com', 'clrmail.com',
  'freemail.ms', 'tmails.net', 'emailnax.com', 'devnullmail.com',
  'mailzi.ru', 'mailzi.com', 'inboxbear.com', 'mail-temporaire.fr',
  'disposableemailaddresses.com', 'disposeamail.com', 'disposemail.com',
  'fakemail.net', 'spambox.us', 'trashmail.net', 'spamfree24.org'
];

/**
 * Validate email and check if it's from a temporary email service
 */
const validateEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(); // Let the route handler handle missing email
    }

    // Extract domain from email
    const domain = email.toLowerCase().split('@')[1];
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check against temporary email domains list
    if (TEMP_EMAIL_DOMAINS.includes(domain)) {
      return res.status(400).json({
        success: false,
        message: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.',
        errorCode: 'TEMP_EMAIL_NOT_ALLOWED'
      });
    }

    // Optional: Verify domain has valid MX records (more thorough check)
    // This helps catch more obscure temporary email services
    try {
      await dns.resolveMx(domain);
      // Domain has valid MX records, proceed
      next();
    } catch (dnsError) {
      // Domain doesn't have valid MX records
      return res.status(400).json({
        success: false,
        message: 'Email domain does not appear to be valid. Please use a valid email address.',
        errorCode: 'INVALID_EMAIL_DOMAIN'
      });
    }

  } catch (error) {
    console.error('Email validation error:', error);
    // Don't block the request if validation fails
    // Let it proceed and handle errors downstream
    next();
  }
};

/**
 * Check if email is temporary (for use in routes)
 */
const isTemporaryEmail = (email) => {
  const domain = email.toLowerCase().split('@')[1];
  return TEMP_EMAIL_DOMAINS.includes(domain);
};

/**
 * Add custom temporary email domain
 */
const addTempEmailDomain = (domain) => {
  if (!TEMP_EMAIL_DOMAINS.includes(domain.toLowerCase())) {
    TEMP_EMAIL_DOMAINS.push(domain.toLowerCase());
  }
};

/**
 * Remove temporary email domain from blocklist
 */
const removeTempEmailDomain = (domain) => {
  const index = TEMP_EMAIL_DOMAINS.indexOf(domain.toLowerCase());
  if (index > -1) {
    TEMP_EMAIL_DOMAINS.splice(index, 1);
  }
};

/**
 * Get all blocked domains
 */
const getBlockedDomains = () => {
  return [...TEMP_EMAIL_DOMAINS];
};

module.exports = {
  validateEmail,
  isTemporaryEmail,
  addTempEmailDomain,
  removeTempEmailDomain,
  getBlockedDomains
};
