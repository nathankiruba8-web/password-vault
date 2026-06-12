/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 18: frontend/src/App.jsx
 * Comprehensive React Router Configuration and Responsive Vault User Interface.
 * Contains:
 * - Reactive state providers for user authentication sessions
 * - Secure login forms with 2FA TOTP/MFA challenges & Backup recovery codes
 * - User registration, forgot password, and master password reset panels
 * - Responsive Dashboard incorporating Vault items, categories, search, and details
 * - Aesthetic interactive Automatic Password Generator tool
 * - Comprehensive Security Center managing Google Authenticator (TOTP) setups,
 *   Chronological security logs, Login login histories, and Decrypted Exports.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield, Key, Lock, Unlock, Server, AlertTriangle, CheckCircle, RefreshCw, 
  Copy, Plus, Edit, Trash2, Eye, EyeOff, Download, LogOut, Search, Menu, X, 
  ChevronRight, Calendar, List, Grid, Settings, QrCode, History, User, Mail, 
  FileText, Check, AlertCircle, Info, Database
} from 'lucide-react';

// ==============================================================================
// 1. CLIENT API INTEGRATION HELPER
// ==============================================================================
const API_URL = ''; // Relative path leverages Express proxy seamlessly

const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to complete network request.');
  }
  return data;
};

// ==============================================================================
// 2. AUTHENTICATION STATE CONTAINER (AUTH CONTEXT)
// ==============================================================================
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

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
        // Query health profile to check if token is valid
        const response = await fetch(`${API_URL}/api/security/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          // Resolve current user info from token storage
          const storedUser = localStorage.getItem('vault_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Decapsulate default structure
            setUser({ id: 'me', name: 'Vault Keeper', email: 'user@securevault' });
          }
        } else {
          // Destruct invalid token
          logout();
        }
      } catch (err) {
        console.error('Session validation failure:', err.message);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await apiCall('/api/auth/login', 'POST', { email, password });
      if (data.twoFactorRequired) {
        return { twoFactorRequired: true, userId: data.userId, email: data.email };
      }
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const login2FA = async (userId, tokenCode, isBackup = false) => {
    setAuthError(null);
    try {
      const endpoint = isBackup ? '/api/auth/login/backup' : '/api/auth/login/2fa';
      const payload = isBackup 
        ? { userId, backupCode: tokenCode }
        : { userId, token: tokenCode };

      const data = await apiCall(endpoint, 'POST', payload);
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const data = await apiCall('/api/auth/register', 'POST', { name, email, password });
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    setToken(null);
    setUser(null);
  };

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

// ==============================================================================
// 3. SECURITY AUTH GUARDS
// ==============================================================================
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100">
        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="font-mono text-sm tracking-wide">INITIALIZING CRYPTOGRAPHIC TRUST FRAME...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ==============================================================================
// 4. MAIN LAYOUT SHELL
// ==============================================================================
function NavigationLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Credentials Hub', path: '/dashboard', icon: Shield },
    { name: 'Security Audit', path: '/security', icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-xl border border-indigo-400">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg block">SECUREVAULT</span>
            <span className="text-xs text-indigo-400 font-mono font-semibold tracking-wider">AES-256 SYSTEM</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 pt-6 mt-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 flex items-center space-x-3">
            <div className="h-9 w-9 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <div className="truncate flex-1">
              <span className="font-semibold text-sm block truncate">{user?.name}</span>
              <span className="text-xs text-slate-500 truncate block">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center space-x-2 p-3 font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all font-mono text-sm border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>TERMINATE TERMINAL</span>
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Lock className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-md">SECUREVAULT</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-slate-100 p-2 bg-slate-800 rounded-lg"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 py-4 px-6 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full mt-4 flex items-center justify-center space-x-2 p-3 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>TERMINATE JOURNAL</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

// ==============================================================================
// 5. INTERACTIVE RANDOM PASSWORD GENERATOR COMPONENT
// ==============================================================================
function InteractivePasswordGenerator({ onGenerateComplete, inline = false }) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generatedResult, setGeneratedResult] = useState('');
  const [alertText, setAlertText] = useState('');

  const triggerGeneration = () => {
    if (!uppercase && !lowercase && !numbers && !symbols) {
      setAlertText('Choose at least one parameter constraint.');
      return;
    }
    setAlertText('');
    
    // Core password randomization logic
    let charPool = '';
    if (uppercase) charPool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) charPool += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) charPool += '0123456789';
    if (symbols) charPool += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * charPool.length);
      result += charPool[idx];
    }

    setGeneratedResult(result);
    if (onGenerateComplete) {
      onGenerateComplete(result);
    }
  };

  useEffect(() => {
    triggerGeneration();
  }, [length, uppercase, lowercase, numbers, symbols]);

  const copyResult = () => {
    navigator.clipboard.writeText(generatedResult);
    alert('Random key copied successfully.');
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 ${inline ? '' : 'shadow-xl'}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-indigo-400 font-mono text-sm tracking-wide">AUTO-GENERATE VAULT KEY</h4>
        <button onClick={triggerGeneration} className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>REROLL</span>
        </button>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between mb-4">
        <span className="font-mono text-sm tracking-widest break-all text-emerald-400 font-bold select-all">{generatedResult}</span>
        <button type="button" onClick={copyResult} className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all">
          <Copy className="h-4 w-4" />
        </button>
      </div>

      {alertText && <p className="text-rose-400 text-xs mb-3 font-mono">{alertText}</p>}

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
            <span>KEY DENSE SIZE:</span>
            <span className="text-indigo-400 font-bold">{length} CHARS</span>
          </div>
          <input
            type="range"
            min="8"
            max="40"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 h-1 bg-slate-850 rounded-lg cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center space-x-2 text-xs font-mono text-slate-355 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={() => setUppercase(!uppercase)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0"
            />
            <span>A-Z CAPITAL</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-mono text-slate-355 cursor-pointer">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={() => setLowercase(!lowercase)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0"
            />
            <span>a-z LOWER</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-mono text-slate-355 cursor-pointer">
            <input
              type="checkbox"
              checked={numbers}
              onChange={() => setNumbers(!numbers)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0"
            />
            <span>0-9 NUMBERS</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-mono text-slate-355 cursor-pointer">
            <input
              type="checkbox"
              checked={symbols}
              onChange={() => setSymbols(!symbols)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0"
            />
            <span>#!@* SYMBOLS</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 6. VIEW: AUTH - LOGIN
// ==============================================================================
function LoginPage() {
  const { login, login2FA, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state flow
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isBackup, setIsBackup] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setAuthError(null);
    try {
      const res = await login(email, password);
      if (res && res.twoFactorRequired) {
        setMfaRequired(true);
        setMfaUserId(res.userId);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login prompt failure:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2faVerify = async (e) => {
    e.preventDefault();
    if (!mfaCode) return;
    setLoading(true);
    setAuthError(null);
    try {
      await login2FA(mfaUserId, mfaCode, isBackup);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('MFA validation failure:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white border border-indigo-400">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-100">
          {mfaRequired ? 'AUTHENTICATION CHALLENGE' : 'SECURE ENVELOPE GATE'}
        </h2>
        <p className="mt-2 text-center text-xs font-mono text-slate-400 tracking-wider">
          {mfaRequired ? 'MULTI-FACTOR IDENTITY VALIDATION' : 'MASTER AES KEY SYMMETRIC DECIPHER'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 border border-slate-800 rounded-3xl sm:px-10 shadow-2xl">
          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-sm text-rose-300">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {!mfaRequired ? (
            <form className="space-y-6" onSubmit={handleStandardSubmit}>
              <div>
                <label className="block text-xs font-mono tracking-wide text-slate-400 uppercase">Registered Email:</label>
                <div className="mt-1.5 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-sm py-3 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono tracking-wide text-slate-400 uppercase">Master Vault Password:</label>
                  <Link to="/forgot-password" className="text-xs font-mono text-indigo-400 hover:text-indigo-300">FORGOT SECURITY PHRASE?</Link>
                </div>
                <div className="mt-1.5 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-sm py-3 transition-all"
                    placeholder="••••••••••••••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-indigo-500/50 rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-mono tracking-wider transition-all disabled:opacity-50"
                >
                  {loading ? 'SENSING SIGNATURES...' : 'MOUNT ENCRYPTED VAULT'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handle2faVerify}>
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/30 rounded-2xl text-xs text-indigo-300 flex items-start space-x-2.5">
                <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>
                  This account has active 2-Factor protection. Retrieve the security key from your Google Authenticator or input an emergency backup code.
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono tracking-wide text-slate-400 uppercase">
                    {isBackup ? 'EMERGENCY RESTORATION CODE:' : 'IDENTIFICATION TOTP PIN:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsBackup(!isBackup); setMfaCode(''); setAuthError(null); }}
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300"
                  >
                    {isBackup ? 'USE GOOGLE TOTP CODE' : 'USE BACKUP RESTORATION CODE'}
                  </button>
                </div>
                <div className="mt-1.5 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <QrCode className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="block w-full pl-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-sm py-3 transition-all font-mono tracking-widest text-center"
                    placeholder={isBackup ? 'XXXX-XXXX' : '••••••'}
                    maxLength={isBackup ? 20 : 6}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setMfaRequired(false); setMfaCode(''); setAuthError(null); }}
                  className="w-1/2 text-center py-3 border border-slate-800 hover:bg-slate-800 rounded-2xl text-slate-300 font-mono text-xs font-semibold transition-all"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 flex justify-center py-3 px-4 border border-indigo-500/50 rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none font-mono tracking-wider transition-all disabled:opacity-50"
                >
                  {loading ? 'CHECKING...' : 'DECODE PIN'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex justify-center text-xs">
            <span className="text-slate-500 font-mono">NEW COMMITTAL AGENT?</span>
            <Link to="/register" className="ml-1.5 font-bold font-mono text-indigo-400 hover:text-indigo-300">REGISTER HERE</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 7. VIEW: AUTH - REGISTER
// ==============================================================================
function RegisterPage() {
  const { register, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) {
      setAuthError('Master password must consist of at least 8 characters.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration layout failure:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white border border-indigo-400">
          <User className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-100">
          ESTABLISH ACCOUNT CREDENTIALS
        </h2>
        <p className="mt-2 text-center text-xs font-mono text-slate-400 tracking-wider">
          INITIATE A NEW RESILIENT SECURITY ENVELOPE
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 border border-slate-800 rounded-3xl sm:px-10 shadow-2xl">
          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-sm text-rose-300">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-mono tracking-wide text-slate-400 uppercase">Committing Identity Name:</label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-sm py-3 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wide text-slate-400 uppercase">Registry Email Inbox:</label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-sm py-3 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wide text-slate-400 uppercase">New Master Key Password (Min 8 chars):</label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-sm py-3 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-indigo-500/50 rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-mono tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? 'REGISTERING IDENTITY SYSTEMS...' : 'COMPOSE SECRET ENVELOPE'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex justify-center text-xs">
            <span className="text-slate-500 font-mono">ALREADY SECURED PREVIOUSLY?</span>
            <Link to="/login" className="ml-1.5 font-bold font-mono text-indigo-400 hover:text-indigo-300">LOG IN TERMINAL</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 7. VIEW: AUTH - FORGOT PASSWORD
// ==============================================================================
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrMessage('');
    try {
      await apiCall('/api/auth/forgot-password', 'POST', { email });
      setSuccess(true);
    } catch (err) {
      setErrMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-100 font-mono uppercase">
          RECOVER ENCRYPTED ACCESS
        </h2>
        <p className="mt-2 text-center text-xs font-mono text-slate-400 tracking-wider">
          DISPATCH PASSWORDS RESET ENVELOPE LINK
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 border border-slate-800 rounded-3xl sm:px-10 shadow-2xl">
          {errMessage && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-sm text-rose-300">
              {errMessage}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase">Input Registry Email Address:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full mt-2 bg-slate-950 border border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-xs py-3.5 px-4 transition-all"
                  placeholder="name@company.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-indigo-500/50 rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 font-mono tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? 'POSTING DISPATCH...' : 'TRIGGER RECOVERY PROCESS'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-300 font-medium space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                <p>Recovery link dispatched successfully!</p>
              </div>
              <div className="p-4 bg-indigo-950/40 border border-indigo-800/30 rounded-2xl text-xs space-y-3">
                <p className="font-mono text-indigo-400 uppercase font-semibold">📬 Sandbox Simulation Notice:</p>
                <p className="text-slate-300 leading-normal">
                  In unconfigured sandbox/mail systems, real emails are bypassed. The password reset URL link is printed securely inside the **Express Server Console Outputs!** Use your server terminals view to access the link.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center text-xs font-mono">
            <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300">ABORT AND RETURN TO TERMINAL</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 8. VIEW: AUTH - RESET PASSWORD
// ==============================================================================
function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // Extract Token parameter from routing path query string
  const pathToken = new URLSearchParams(location.search).get('token') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !pathToken) {
      setErrMessage('A password reset token parameter is outstanding or broken.');
      return;
    }
    if (password.length < 8) {
      setErrMessage('Master password key must consist of at least 8 characters.');
      return;
    }
    setLoading(true);
    setErrMessage('');
    try {
      await apiCall('/api/auth/reset-password', 'POST', { token: pathToken, password });
      setSuccess(true);
    } catch (err) {
      setErrMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-100 font-mono uppercase">
          RECONFIGURE MASTER KEY
        </h2>
        <p className="mt-2 text-center text-xs font-mono text-slate-400 tracking-wider">
          ESTABLISH A FRESH CRYPTOGRAPHIC ACCESS PASSWORD
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 border border-slate-800 rounded-3xl sm:px-10 shadow-2xl">
          {errMessage && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-sm text-rose-300">
              {errMessage}
            </div>
          )}

          {!pathToken && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs text-center font-mono">
              CRITICAL: MISSING CRYPTOGRAPHIC TOKEN PARAMETER. ACTION CANCELLED.
            </div>
          )}

          {pathToken && !success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase">New Master Password Key:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full mt-2 bg-slate-950 border border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 rounded-2xl sm:text-xs py-3.5 px-4 transition-all"
                  placeholder="Input minimum 8 characters..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-indigo-500/50 rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 font-mono tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? 'WRITING NEW KEYS...' : 'CONFIRM KEY UPDATE'}
              </button>
            </form>
          )}

          {success && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-300 font-medium">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p>New master password written successfully!</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold text-white font-mono transition-all"
              >
                PROCEED TO TERMINAL SIGN-IN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 9. VIEW: SECURED VAULT DASHBOARD HUB
// ==============================================================================
function DashboardHub() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Metrics, Credentials Lists, Search and Filter structures
  const [stats, setStats] = useState(null);
  const [passwords, setPasswords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals operations
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // On-demand Password Decryption view cache
  const [viewedPassword, setViewedPassword] = useState('');
  const [viewedRecordId, setViewedRecordId] = useState('');
  const [decryptingId, setDecryptingId] = useState('');

  // Password Add/Edit Form Values
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('General');
  const [expiryDate, setExpiryDate] = useState('');

  const categories = ['All', 'General', 'Logins', 'Financial', 'Social', 'Secure Notes'];

  const loadData = async () => {
    try {
      const statsRes = await apiCall('/api/security/stats', 'GET', null, token);
      setStats(statsRes.data);

      const passUrl = `/api/passwords?q=${encodeURIComponent(searchQuery)}${activeCategory !== 'All' ? `&category=${encodeURIComponent(activeCategory)}` : ''}`;
      const passwordsRes = await apiCall(passUrl, 'GET', null, token);
      setPasswords(passwordsRes.data);
    } catch (err) {
      console.error('Failed bringing up remote vault listings:', err.message);
      if (err.message.includes('expired') || err.message.includes('token')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, activeCategory]);

  const resetFormState = () => {
    setSiteName('');
    setUsername('');
    setPasswordValue('');
    setSiteUrl('');
    setNotes('');
    setCategory('General');
    setExpiryDate('');
  };

  const handleAddNewPassword = async (e) => {
    e.preventDefault();
    if (!siteName || !username || !passwordValue) return;
    try {
      await apiCall('/api/passwords', 'POST', {
        siteName,
        username,
        password: passwordValue,
        siteUrl,
        notes,
        category,
        expiryDate: expiryDate || null
      }, token);
      
      setIsAddOpen(false);
      resetFormState();
      loadData();
    } catch (err) {
      alert(`Vault committal failure: ${err.message}`);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setSiteName(record.siteName);
    setUsername(record.username);
    setPasswordValue(''); // Do not inject old hashed symbols
    setSiteUrl(record.siteUrl || '');
    setNotes(record.notes || '');
    setCategory(record.category || 'General');
    setExpiryDate(record.expiryDate ? record.expiryDate.split('T')[0] : '');
    setIsEditOpen(true);
  };

  const handleEditPassword = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      const payload = {
        siteName,
        username,
        siteUrl,
        notes,
        category,
        expiryDate: expiryDate || null
      };
      if (passwordValue) {
        payload.password = passwordValue;
      }

      await apiCall(`/api/passwords/${editingRecord._id}`, 'PUT', payload, token);
      
      setIsEditOpen(false);
      setEditingRecord(null);
      resetFormState();
      loadData();
    } catch (err) {
      alert(`Edit update failed: ${err.message}`);
    }
  };

  const handleDeletePassword = async (recordId) => {
    if (!window.confirm('Delete this credential permanently from the safe database? This cannot be undone.')) return;
    try {
      await apiCall(`/api/passwords/${recordId}`, 'DELETE', null, token);
      loadData();
    } catch (err) {
      alert(`Deletion failure: ${err.message}`);
    }
  };

  const decryptOnDemand = async (recordId) => {
    // If clicking on already decrypted code, close it
    if (viewedRecordId === recordId) {
      setViewedPassword('');
      setViewedRecordId('');
      return;
    }

    setDecryptingId(recordId);
    try {
      const data = await apiCall(`/api/passwords/${recordId}/decrypt`, 'POST', null, token);
      setViewedPassword(data.password);
      setViewedRecordId(recordId);

      // Obstruction timeout to auto-hide plain text passwords after 15 seconds
      setTimeout(() => {
        setViewedPassword((prev) => (viewedRecordId === recordId ? '' : prev));
        setViewedRecordId((prev) => (prev === recordId ? '' : prev));
      }, 15000);

    } catch (err) {
      alert(`Standard decryption routing failed: ${err.message}`);
    } finally {
      setDecryptingId('');
    }
  };

  const copyToMemory = (text) => {
    navigator.clipboard.writeText(text);
    alert('Credential copy memory set successfully.');
  };

  return (
    <NavigationLayout>
      {/* Header Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center space-x-2.5">
            <span>Secured Storage Center</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">AES-256 Symmetric-GCM Protected Password Registry</p>
        </div>
        <button
          onClick={() => { resetFormState(); setIsAddOpen(true); }}
          className="flex items-center justify-center space-x-2 p-3.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-2xl font-bold shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>VAULT A NEW MASTER</span>
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">PASSWORDS HELD</span>
              <span className="text-2xl font-bold text-slate-100">{stats.totalPasswords}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center space-x-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
              stats.healthScore >= 80 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">VAULT HEALTH RATING</span>
              <span className={`text-2xl font-bold ${
                stats.healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
              }`}>{stats.healthScore}%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">BREACH AUDITS ACTIVE</span>
              <span className="text-2xl font-bold text-slate-100">{stats.breachedCount}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">EXPIRING ENTRIES (30D)</span>
              <span className="text-2xl font-bold text-slate-100">{stats.expiredOrExpiringCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Query Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search service labels, username, urls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 placeholder-slate-600 text-slate-200 pl-10 pr-4 py-2 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
          />
          <Search className="h-4 w-4 text-slate-600 absolute top-3 left-3" />
        </div>
      </div>

      {/* Vault List Layout */}
      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-slate-500">DEPARSING BINARY STREAM...</div>
      ) : passwords.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 p-12 text-center rounded-3xl">
          <Info className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Empty directory list. Add a new secure vault key credential to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passwords.map(item => {
            const isCurrentDecrypted = viewedRecordId === item._id;
            return (
              <div key={item._id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-slate-700 transition-all shadow-md relative flex flex-col justify-between min-h-[220px]">
                {/* Meta details banner */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-md text-slate-100">{item.siteName}</h3>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase mt-0.5 tracking-wider">{item.category}</span>
                    </div>
                    {/* Password evaluation state badge */}
                    <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider ${
                      item.passwordStrength === 'Excellent' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      item.passwordStrength === 'Strong' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      item.passwordStrength === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {item.passwordStrength || 'WEAK'}
                    </span>
                  </div>

                  {/* Account detail row */}
                  <div className="space-y-2 mt-4 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>LOGIN ID:</span>
                      <span className="text-slate-200 max-w-[150px] truncate select-all">{item.username}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>VAULT PASSCODE:</span>
                      <div className="flex items-center space-x-1 font-mono text-xs">
                        {isCurrentDecrypted ? (
                          <span className="text-emerald-400 font-bold select-all break-all pr-2">{viewedPassword}</span>
                        ) : (
                          <span className="text-slate-600 block tracking-widest mr-2 select-none">••••••••</span>
                        )}
                        <button
                          onClick={() => decryptOnDemand(item._id)}
                          disabled={decryptingId === item._id}
                          className="text-[10px] text-slate-500 hover:text-slate-300 font-bold transition-all uppercase"
                        >
                          {decryptingId === item._id ? 'DECIPHERING...' : isCurrentDecrypted ? 'CONCEAL' : 'REVEAL'}
                        </button>
                      </div>
                    </div>
                    {item.siteUrl && (
                      <div className="flex justify-between text-slate-500 text-[10px] truncate">
                        <span>SERVICE PATH:</span>
                        <a href={item.siteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{item.siteUrl}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card operations */}
                <div className="mt-5 border-t border-slate-800/60 pt-4 flex justify-between items-center bg-slate-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-750 rounded-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePassword(item._id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {isCurrentDecrypted && (
                    <button
                      onClick={() => { copyToMemory(viewedPassword); }}
                      className="flex items-center space-x-1 px-3 py-1 bg-emerald-500/15 border border-emerald-500/20 rounded-lg font-mono text-[10px] text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Copy className="h-3 w-3" />
                      <span>COPY KEY</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==============================================================================
          ADD NEW PASSWORD CREDENTIAL MODAL DIALOG
          ============================================================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">New Vault safe credential</h2>
                <span className="text-xs text-slate-400 font-mono">ENCODE PARAMS INTO SYMMETRIC CYLINDER</span>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-500 hover:text-slate-350 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewPassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Service/Identity Tag:</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                    placeholder="e.g. Google Cloud, Personal Mail"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Registry User ID/Email:</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                    placeholder="e.g. user@domain.com, registry_id"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Base Target Domain URL:</label>
                  <input
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Expiry Reminder Date:</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Category Grouping:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 sm:text-xs text-slate-400 leading-tight"
                  >
                    <option value="General">General</option>
                    <option value="Logins">Logins</option>
                    <option value="Financial">Financial</option>
                    <option value="Social">Social</option>
                    <option value="Secure Notes">Secure Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Security Notes & Details:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                    placeholder="Optional details, identifiers, pin..."
                  />
                </div>
              </div>

              {/* Symmetric password generator module integrated in page */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-3 border-t border-slate-800/50">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Target Secret Password:</label>
                  <input
                    type="text"
                    required
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200 select-all font-mono"
                    placeholder="Enter manual phrase or use generator..."
                  />
                </div>
                <InteractivePasswordGenerator onGenerateComplete={(pwd) => setPasswordValue(pwd)} inline={true} />
              </div>

              <div className="flex space-x-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-3 border border-slate-800 rounded-xl text-xs font-mono font-semibold"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold font-mono text-slate-100"
                >
                  COMMIT INTO SAFE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
          EDIT EXPIRED / WEAK CREDENTIALS FORM DIALOG
          ============================================================================== */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">Edit Vault Registration</h2>
                <span className="text-xs text-slate-400 font-mono">MODIFY PARAMETERS FOR {siteName}</span>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-500 hover:text-slate-350 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditPassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Service NAME:</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Username / ID:</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Service URL:</label>
                  <input
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Expiry Reminder Date:</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 sm:text-xs text-slate-450 leading-tight"
                  >
                    <option value="General">General</option>
                    <option value="Logins">Logins</option>
                    <option value="Financial">Financial</option>
                    <option value="Social">Social</option>
                    <option value="Secure Notes">Secure Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Notes details:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-3 border-t border-slate-800/50">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Change password key (Leave bank to preserve):</label>
                  <input
                    type="text"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    className="block w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-xs text-slate-200 font-mono"
                    placeholder="Keep empty to leave unchanged..."
                  />
                </div>
                <InteractivePasswordGenerator onGenerateComplete={(pwd) => setPasswordValue(pwd)} inline={true} />
              </div>

              <div className="flex space-x-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-3 border border-slate-800 rounded-xl text-xs font-mono font-semibold"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold font-mono text-slate-100"
                >
                  WRITE UPDATES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </NavigationLayout>
  );
}

// ==============================================================================
// 10. VIEW: COMPREHENSIVE SECURITY CENTER PAGE
// ==============================================================================
function SecurityCenterPage() {
  const { token, user, syncMfaStatus } = useAuth();

  // Multi-Factor States
  const [isMfaActive, setIsMfaActive] = useState(user?.isTwoFactorEnabled || false);
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Security Logs & Session login history audits
  const [logs, setLogs] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchSecurityAuditRecords = async () => {
    try {
      setLoadingLogs(true);
      const logsRes = await apiCall('/api/security/logs', 'GET', null, token);
      setLogs(logsRes.data);

      const historyRes = await apiCall('/api/security/login-history', 'GET', null, token);
      setSessionHistory(historyRes.data);
    } catch (err) {
      console.error('Failed retrieving administrative logs:', err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSecurityAuditRecords();
  }, []);

  const triggerMfaSetup = async () => {
    try {
      const data = await apiCall('/api/auth/2fa/setup', 'POST', null, token);
      setMfaSetupData(data);
    } catch (err) {
      alert(`MFA initialization failure: ${err.message}`);
    }
  };

  const handleMfaVerifyAndEnable = async (e) => {
    e.preventDefault();
    if (!verificationCode) return;
    try {
      const res = await apiCall('/api/auth/2fa/verify', 'POST', { token: verificationCode }, token);
      setGeneratedBackupCodes(res.backupCodes);
      setIsMfaActive(true);
      syncMfaStatus(true);
      setMfaSetupData(null);
      setVerificationCode('');
      setShowBackupModal(true);
      fetchSecurityAuditRecords();
    } catch (err) {
      alert(`MFA PIN checking failed: ${err.message}`);
    }
  };

  const triggerDisableMfa = async () => {
    if (!window.confirm('WARNING: Remove multi-factor protection? This lowers account safe rating.')) return;
    try {
      await apiCall('/api/auth/2fa/disable', 'POST', null, token);
      setIsMfaActive(false);
      syncMfaStatus(false);
      setGeneratedBackupCodes([]);
      fetchSecurityAuditRecords();
      alert('Two-factor protection disabled.');
    } catch (err) {
      alert(`Error disabling MFA: ${err.message}`);
    }
  };

  const executeVaultExporter = async () => {
    if (!window.confirm('CRITICAL PROMPT: Keep and guard downloaded vault data. Download fully decrypted database JSON list now?')) return;
    try {
      const data = await apiCall('/api/security/export', 'POST', null, token);
      
      const fileData = JSON.stringify(data, null, 2);
      const blob = new Blob([fileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `secure_vault_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      fetchSecurityAuditRecords();
    } catch (err) {
      alert(`Decrypted vault export failed: ${err.message}`);
    }
  };

  return (
    <NavigationLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Security Command Center</h1>
        <p className="text-slate-400 text-sm mt-1">Multi-factor setups, chronological security logs, and export pipelines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Auth controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* MFA Panel */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-indigo-400" />
              <span>Multi-Factor Authentication</span>
            </h3>

            {isMfaActive ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-semibold bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>2FA IS ACTIVATED AND ENFORCED</span>
                </div>
                <button
                  type="button"
                  onClick={triggerDisableMfa}
                  className="w-full py-3 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-2xl text-xs font-mono font-bold transition-all"
                >
                  DEACTIVATE TWO-FACTOR
                </button>
              </div>
            ) : mfaSetupData ? (
              <form onSubmit={handleMfaVerifyAndEnable} className="space-y-4">
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex flex-col items-center">
                  <img src={mfaSetupData.qrCodeUrl} alt="Google Authenticator QR Code" className="w-40 h-40 bg-white p-2 rounded-xl" />
                  <span className="text-[9px] font-mono text-slate-500 mt-2 block break-all text-center">KEY: {mfaSetupData.secret}</span>
                </div>

                <div className="p-3 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl text-[10px] text-slate-300 select-none">
                  <p className="font-bold text-indigo-400 mb-1">STEPS:</p>
                  1. Scan standard barcode from Google Authenticator App.<br />
                  2. Input the generated 6-digit verification code below.
                </div>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit Code"
                    className="w-full text-center py-3 bg-slate-950 border border-slate-850 text-slate-100 font-mono tracking-widest text-sm rounded-2xl focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setMfaSetupData(null)}
                    className="w-1/2 py-3 border border-slate-850 hover:bg-slate-800 rounded-2xl font-mono text-[10px]"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-2xl font-bold font-mono text-[10px]"
                  >
                    ENABLE 2FA
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs leading-relaxed leading-normal">
                  Elevate accounts integrity. Require individual unique six digit verification pin when signing into sessions on unverified browsers.
                </p>
                <button
                  type="button"
                  onClick={triggerMfaSetup}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-2xl text-xs font-mono font-bold tracking-wider transition-all"
                >
                  CONFIGURE 2-FACTOR SECUREKEY
                </button>
              </div>
            )}
          </div>

          {/* Backup single-use restoration codes visual box */}
          {generatedBackupCodes.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
              <h4 className="font-bold text-sm mb-2 text-indigo-400 font-mono">BACKUP RECOVERY CODES</h4>
              <p className="text-[10px] text-slate-405 leading-normal mb-3">Copy emergency keys to backup directories. Each is single-use only.</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs max-h-40 overflow-y-auto">
                {generatedBackupCodes.map(code => (
                  <span key={code} className="p-1.5 bg-slate-950 rounded-lg text-slate-350 select-all border border-slate-900">{code}</span>
                ))}
              </div>
            </div>
          )}

          {/* Exporter module */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h3 className="font-bold text-lg mb-2 flex items-center space-x-2">
              <Download className="h-5 w-5 text-indigo-400" />
              <span>Full Decrypted Export</span>
            </h3>
            <p className="text-slate-405 text-xs mt-1 leading-relaxed">
              Downloads raw JSON list of clear text passwords and URLs. High severity administrative warning: decrypting records increases exposure threat if files leak.
            </p>
            <button
              onClick={executeVaultExporter}
              className="mt-4 w-full py-3.5 bg-rose-500/15 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl font-mono text-xs font-semibold transition-all"
            >
              TRIGGER DECRYPTED EXPORT (CRITICAL)
            </button>
          </div>
        </div>

        {/* Right Side: Logs views */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logs panel */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
              <History className="h-5 w-5 text-indigo-400" />
              <span>Chronological Security Audits</span>
            </h3>

            {loadingLogs ? (
              <div className="text-center py-10 font-mono text-xs text-slate-500">DEPARSING LOG RECORDS...</div>
            ) : logs.length === 0 ? (
              <p className="text-slate-500 text-xs py-10 text-center font-mono">NO CRITICAL EVENTS ENCRYPTED IN LOG</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/20">
                      <th className="py-2 px-3">EVENT TYPE</th>
                      <th className="py-2 px-3">DESCRIPTION</th>
                      <th className="py-2 px-3">SEVERITY</th>
                      <th className="py-2 px-3">IP ORIGIN</th>
                      <th className="py-2 px-3">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs font-mono">
                    {logs.map(log => (
                      <tr key={log._id} className="hover:bg-slate-850/20">
                        <td className="py-3 px-3 text-indigo-300 font-semibold">{log.eventType}</td>
                        <td className="py-3 px-3 text-slate-400 break-words max-w-[200px] leading-relaxed">{log.description}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            log.severity === 'Critical' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                            log.severity === 'High' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                            log.severity === 'Medium' ? 'bg-slate-500/15 text-slate-300 border border-slate-500/20' :
                            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {log.severity || 'Low'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{log.ipAddress}</td>
                        <td className="py-3 px-3 text-slate-505 text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Session Login History list */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
              <Server className="h-5 w-5 text-indigo-400" />
              <span>Active Console Sessions Logs</span>
            </h3>

            {loadingLogs ? (
              <div className="text-center py-5 font-mono text-xs text-slate-500">DEPARSING CODES...</div>
            ) : sessionHistory.length === 0 ? (
              <p className="text-slate-500 text-xs py-5 text-center font-mono">NO TERMINALS REGISTERED</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      <th className="py-2 px-3">INTEGRITY</th>
                      <th className="py-2 px-3">IP ADDRESS</th>
                      <th className="py-2 px-3">BROWSER PATH</th>
                      <th className="py-2 px-3">LAYOUT</th>
                      <th className="py-2 px-3">LOG DATE (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
                    {sessionHistory.map(session => (
                      <tr key={session._id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            session.loginStatus === 'Success' ? 'bg-emerald-500/10 text-emerald-400 font-bold' :
                            session.loginStatus === '2FA_Pending' ? 'bg-indigo-500/10 text-indigo-400' :
                            'bg-rose-500/10 text-rose-400 font-bold animate-pulse'
                          }`}>
                            {session.loginStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-350">{session.ipAddress}</td>
                        <td className="py-3 px-3 text-slate-400">{session.browser}</td>
                        <td className="py-3 px-3 text-slate-550">{session.device}</td>
                        <td className="py-3 px-3 text-[10px] text-slate-550">{new Date(session.createdAt).toISOString().replace('T', ' ').substr(0, 19)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup recovery emergency notification popup dialog */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md text-center max-h-[85vh] overflow-y-auto">
            <Shield className="h-12 w-12 text-emerald-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl font-bold font-mono">DISASTER RESTORATION KEY REGISTERED</h2>
            <p className="text-xs text-slate-400 font-mono mt-1 mb-5">IMMEDIATELY SAVE CODE TO PRINTED PAPER FILE</p>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 leading-relaxed rounded-2xl mb-5 text-left font-sans">
              <strong>CRITICAL ADMINISTRATIVE WARNING:</strong> These backup recovery codes represent the absolute disaster recovery mechanism to bypass multi-factor locking. We do not store recovery records in unencrypted channels. If you lose your configuration files, you will permanently lose access to this vault if your device fails.
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl grid grid-cols-2 gap-2 text-slate-100 font-mono text-center font-semibold mb-6 select-all">
              {generatedBackupCodes.map(code => (
                <span key={code} className="p-2 bg-slate-900 rounded-lg text-xs leading-none border border-slate-855 select-all">{code}</span>
              ))}
            </div>

            <button
              onClick={() => setShowBackupModal(false)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold rounded-2xl font-mono text-xs tracking-widest transition-all"
            >
              ACKNOWLEDGE AND DISMISS
            </button>
          </div>
        </div>
      )}
    </NavigationLayout>
  );
}

// ==============================================================================
// 11. MAIN ENTRY ROUTER MOUNT POINT
// ==============================================================================
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Gateway Envelopes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Secure Protected Inner Shell Environments */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedRoute>
                <SecurityCenterPage />
              </ProtectedRoute>
            }
          />

          {/* Root Fallthrough Redirect configurations */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
