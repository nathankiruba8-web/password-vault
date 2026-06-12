/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 19: frontend/src/api/client.js
 * Configures the centralized Axios HTTP client.
 */

import axios from 'axios';

// Vite-ல் Environment Variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://password-vault-3ln6.onrender.com';

// Create a configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL, // இப்போது கோரிக்கைகள் சரியாக Render சர்வருக்குச் செல்லும்
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
      
      // Redirect to login only if not already on an auth page
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