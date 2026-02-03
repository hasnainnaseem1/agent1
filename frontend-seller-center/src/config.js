// Centralized configuration for User App
const config = {
    // Backend API URL
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    
    // Marketing website URL (for logout redirect, etc.)
    marketingUrl: process.env.REACT_APP_MARKETING_URL || 'http://localhost:3000',
  };
  
  export default config;