/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 19: frontend/src/api/client.js
 * Configures the centralized Axios HTTP client.
 */

import axios from 'axios';

// Vite-ல் Environment Variable சரியாக உள்ளதா என உறுதி செய்தல்
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://password-vault-3ln6.onrender.com';

// கன்சோலில் URL-ஐச் சரிபார்த்தல் (Debug)
console.log("Connecting to API at:", API_BASE_URL); 

// Create a configured Axios instance
// குறிப்பு: baseURL-ல் '/api' என்று முடிவடையாமல் இருந்தால், ஒவ்வொரு call-லும் '/api' சேர்க்க வேண்டும்.
// உங்கள் பேக்கெண்ட் '/api' என்று தொடங்கினால், கீழே உள்ளதை கவனிக்கவும்.
const apiClient = axios.create({
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, 
});

// Request Interceptor: Automatically inject the stored JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vault_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle session expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Cryptographic session expired. Clearing cache.');
      localStorage.removeItem('vault_token');
      localStorage.removeItem('vault_user');
      
      const currentPath = window.location.pathname;
      const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      if (!authPaths.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;