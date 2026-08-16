// API Configuration for different environments
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000'
  },
  production: {
    API_BASE_URL: 'https://hollai-backend-b31l.onrender.com'
  }
};

// Determine current environment
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  window.location.hostname === '[::1]' ||
  // 127.0.0.0/8 are considered localhost for IPv4.
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

const currentEnv = isLocalhost ? 'development' : 'production';

// Export the API base URL for the current environment
export const API_BASE_URL = config[currentEnv].API_BASE_URL;

// Helper function to build API endpoints
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}/api${endpoint}`;
};
