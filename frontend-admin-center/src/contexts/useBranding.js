import { useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Lightweight hook that fetches public site branding (favicon, title)
 * and injects it into the <head>.  Runs once on mount.
 *
 * No provider needed — just call useBranding() inside the top-level App.
 */
const injectFavicon = (url) => {
  if (!url) return;
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((el) => { el.href = url; });
  if (!document.querySelector('link[rel="shortcut icon"]')) {
    const link = document.createElement('link');
    link.rel = 'shortcut icon';
    link.href = url;
    document.head.appendChild(link);
  }
};

export const useBranding = () => {
  useEffect(() => {
    fetch(`${API}/api/v1/public/site`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.site) {
          if (data.site.faviconUrl) injectFavicon(data.site.faviconUrl);
          const name = data.site.companyName || data.site.siteName || 'Admin Center';
          document.title = `${name} — Admin`;
        }
      })
      .catch(() => { /* silent */ });
  }, []);
};
