/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client'; // நாம் செட் செய்த apiClient-ஐ இம்போர்ட் செய்கிறோம்

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
        const response = await apiClient.get('/api/security/stats');
        if (response.status === 200) {
          const storedUser = localStorage.getItem('vault_user');
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        if (err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, [token]);

  /**
   * User Registration API - திருத்தப்பட்டது
   */
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      // apiClient-ஐப் பயன்படுத்துவதால் இது தானாகவே Render URL-க்குச் செல்லும்
      const response = await apiClient.post('/api/auth/register', { name, email, password });
      
      const { token, user } = response.data;
      localStorage.setItem('vault_token', token);
      localStorage.setItem('vault_user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      // எரர் மெசேஜை சரியாகப் பிரித்து எடுக்கிறோம்
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    authError,
    setAuthError,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}