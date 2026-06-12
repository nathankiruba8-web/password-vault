/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 23: frontend/src/pages/Login.jsx
 * Professional Gate Authentication panel with two-factor support,
 * custom error containers, and interactive password toggles.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Key, 
  QrCode, 
  AlertTriangle, 
  Info, 
  Eye, 
  EyeOff, 
  ShieldCheck 
} from 'lucide-react';

export default function Login() {
  const { login, login2FA, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Primary Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Multi-Factor Challenge State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isBackup, setIsBackup] = useState(false);

  // Redirect destination computed relative to router state
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
      console.error('Login action rejected:', err.message);
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
      console.error('MFA challenge authentication failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-200 select-none animate-fade-in" id="login-viewport-gate">
      
      {/* Upper Logo / Branding Center */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 bg-indigo-600 rounded-2xl items-center justify-center text-white border border-indigo-400/20 shadow-xl shadow-indigo-600/10">
          <Lock className="h-7 w-7" id="login-brand-icon" />
        </div>
        <h2 className="mt-6 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50">
          {mfaRequired ? 'Multi-Factor Validation' : 'Cryptographic Gate'}
        </h2>
        <p className="mt-2 text-xs font-mono text-slate-400 tracking-widest uppercase">
          {mfaRequired ? 'MFA Security Identity Check' : 'AES-256 Symmetrical Credentials decryption'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="login-form-card-container">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 rounded-3xl sm:px-10 shadow-2xl relative overflow-hidden">
          
          {/* Decorative neon subtle accent line */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-600 to-indigo-600" />

          {/* Network-Level Auth Errors */}
          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-xs text-rose-300" id="login-error-alert">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal font-medium">{authError}</div>
            </div>
          )}

          {!mfaRequired ? (
            <form className="space-y-5" onSubmit={handleStandardSubmit} id="standard-login-form">
              
              {/* Email Entry */}
              <div>
                <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Registered Email Inbox</label>
                <div className="mt-2 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="login-email-input"
                    className="block w-full pl-11 pr-4 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-sm py-3 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password Entry */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <label className="tracking-wider text-slate-450 uppercase font-semibold">Master Vault Password</label>
                  <Link to="/forgot-password" id="forgot-password-link" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    Reset Key?
                  </Link>
                </div>
                <div className="mt-2 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Key className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="login-password-input"
                    className="block w-full pl-11 pr-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-sm py-3 transition-all"
                    placeholder="••••••••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Login Confirmation CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  id="login-submit-btn"
                  className="w-full flex justify-center py-3.5 px-4 border border-indigo-500/30 rounded-xl shadow-lg shadow-indigo-600/10 text-xs font-mono font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
                >
                  {loading ? 'DISSOLVING CRYPTO PHRASE...' : 'MOUNT SECURED CORE'}
                </button>
              </div>

            </form>
          ) : (
            <form className="space-y-5" onSubmit={handle2faVerify} id="mfa-challenge-form">
              
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/30 rounded-2xl text-[11px] text-indigo-300 leading-relaxed flex items-start space-x-2.5">
                <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>
                  Dynamic 2-Factor Auth verified. Open Google Authenticator or submit one of your active backup emergency codes below to decrypt your records.
                </span>
              </div>

              {/* TOTP or Backup Code Entry */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <label className="tracking-wider text-slate-450 uppercase font-semibold">
                    {isBackup ? 'EMERGENCY BACKUP CODE' : 'Authenticator Key (TOTP PIN)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsBackup(!isBackup); setMfaCode(''); setAuthError(null); }}
                    className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {isBackup ? 'Use Authenticator PIN' : 'Use Backup Recovery'}
                  </button>
                </div>
                <div className="mt-2 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <QrCode className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    id="mfa-pin-input"
                    className="block w-full pl-11 pr-4 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-base py-3 transition-all font-mono tracking-widest text-center"
                    placeholder={isBackup ? 'XXXXX-XXXXX' : '••••••'}
                    maxLength={isBackup ? 24 : 6}
                    autoFocus
                  />
                </div>
              </div>

              {/* Multi-Factor Authentication Control Row */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setMfaRequired(false); setMfaCode(''); setAuthError(null); }}
                  className="w-1/2 text-center py-3.5 border border-slate-800 bg-slate-950 hover:bg-slate-850 rounded-xl text-slate-300 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  id="mfa-verify-btn"
                  className="w-1/2 flex justify-center py-3.5 px-4 border border-indigo-500/30 rounded-xl shadow-lg text-xs font-mono font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'CONFIRMING...' : 'DECOUPLE GATE'}
                </button>
              </div>

            </form>
          )}

          {/* Registration Redirect Footer Section */}
          <div className="mt-8 border-t border-slate-850 pt-5 flex items-center justify-center space-x-1.5 text-xs text-slate-450 font-mono">
            <span>New Committal Agent?</span>
            <Link to="/register" id="login-register-link" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Establish Keys
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
