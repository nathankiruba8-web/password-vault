/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 20: frontend/src/context/AuthContext.jsx
 * Centralized Authentication State Context.
 * Governs session tokens, identity profiles, multi-factor logins, registration, and logout operations.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be utilized within an AuthProvider subtree.');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vault_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Query security statistic values to ensure token validity
        const response = await apiClient.get('/api/security/stats');
        
        if (response.status === 200) {
          const storedUser = localStorage.getItem('vault_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Baseline structure profile if cache gets decoupled
            setUser({ id: 'me', name: 'Vault Keeper', email: 'user@securevault.local' });
          }
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session security validation mismatch:', err.message);
        // Clear session state if we encounter credentials rejection
        if (err.response && err.response.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, [token]);

  /**
   * User Standard Password login
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const data = response.data;

      if (data.twoFactorRequired) {
        return { twoFactorRequired: true, userId: data.userId, email: data.email };
      }

      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login attempt failed.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * multi-Factor verification login
   */
  const login2FA = async (userId, tokenCode, isBackup = false) => {
    setAuthError(null);
    try {
      const endpoint = isBackup ? '/api/auth/login/backup' : '/api/auth/login/2fa';
      const payload = isBackup 
        ? { userId, backupCode: tokenCode }
        : { userId, token: tokenCode };

      const response = await apiClient.post(endpoint, payload);
      const data = response.data;

      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'MFA validation challenge failed.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * User Registration API
   */
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const response = await apiClient.post('/api/auth/register', { name, email, password });
      const data = response.data;

      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Registration failed.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * Purges cryptographic session variables and logouts
   */
  const logout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  /**
   * Synchronizes user's context status on MFA profile revisions
   */
  const syncMfaStatus = (isEnabled) => {
    if (user) {
      const updatedUser = { ...user, isTwoFactorEnabled: isEnabled };
      localStorage.setItem('vault_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    token,
    loading,
    authError,
    setAuthError,
    login,
    login2FA,
    register,
    logout,
    syncMfaStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
