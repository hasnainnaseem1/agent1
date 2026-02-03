// Centralized configuration
const config = {
    // User App URL (where authentication and dashboard live)
    userAppUrl: process.env.REACT_APP_USER_APP_URL || 'http://localhost:3002',
    
    // API endpoints (for future use)
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  };
  
  export default config;