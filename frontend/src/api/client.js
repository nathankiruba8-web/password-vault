/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 19: frontend/src/api/client.js
 * Configures the centralized Axios HTTP client.
 * Implements automated request interception to transparently inject JWT tokens,
 * and response interception to seamlessly capture authorization expired events (401 errors).
 */

import axios from 'axios';

// Create a configured Axios instance
const apiClient = axios.create({
  baseURL: '', // Empty base URL routes requests relative to current host
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Safe 15-second retrieval safety margin
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

// Response Interceptor: Route authorization failures to session termination handlers
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Audit response status structures
    if (error.response) {
      const { status } = error.response;
      
      // If unauthorized token is identified, purge session storage gracefully
      if (status === 401) {
        console.warn('Cryptographic session expired or denied. Terminating cache elements.');
        localStorage.removeItem('vault_token');
        localStorage.removeItem('vault_user');
        
        // Optionally reload page or dispatch window event to trigger app-level re-evaluation
        if (typeof window !== 'undefined') {
          // Prevent infinite loops on authenticating directories
          const path = window.location.pathname;
          if (path !== '/login' && path !== '/register' && path !== '/forgot-password' && path !== '/reset-password') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
