import React, { createContext, useContext, useState, useEffect } from 'react';
import config from '../config';

const defaultSite = {
  googleSSO: { enabled: false, clientId: '' },
  enableCustomerSignup: true,
  enableLogin: true,
  enableAnalysis: true,
  enableSubscriptions: true,
  maintenance: { enabled: false, message: '' },
};

const SiteContext = createContext({ siteConfig: defaultSite, loaded: false });

/** Inject favicon into <head> — mirrors the marketing-site logic */
const injectFavicon = (url) => {
  if (!url) return;
  // Update every existing icon link
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((el) => { el.href = url; });
  // Ensure a shortcut icon exists
  if (!document.querySelector('link[rel="shortcut icon"]')) {
    const link = document.createElement('link');
    link.rel = 'shortcut icon';
    link.href = url;
    document.head.appendChild(link);
  }
};

export const SiteProvider = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState(defaultSite);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${config.apiUrl}/api/v1/public/site`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.site) {
          setSiteConfig({ ...defaultSite, ...data.site });

          // Dynamic favicon
          if (data.site.faviconUrl) {
            injectFavicon(data.site.faviconUrl);
          }

          // Dynamic page title
          const name = data.site.companyName || data.site.siteName || 'Dashboard';
          document.title = `${name} — Dashboard`;
        }
      })
      .catch(() => {
        // Use defaults silently on network error
      })
      .finally(() => setLoaded(true));
  }, []);

  return (
    <SiteContext.Provider value={{ siteConfig, loaded }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
