/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 24: frontend/src/pages/Register.jsx
 * Professional account establishment panel with client-side interactive validation,
 * master key complexity indicators, and robust error/success alert components.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Key, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react';

export default function Register() {
  const { register, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  // Registry Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Strength Indicator Score
  const calculatePasswordCriteria = (val) => {
    return {
      length: val.length >= 8,
      number: /[0-9]/.test(val),
      uppercase: /[A-Z]/.test(val),
      symbol: /[^A-Za-z0-9]/.test(val)
    };
  };

  const criteria = calculatePasswordCriteria(password);
  const criteriaTotalScore = Object.values(criteria).filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password.length < 8) {
      setAuthError('Your Master Key is too simple. It must consist of at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Master Key and confirmation passphrase do not match.');
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration processing failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-200 select-none" id="register-viewport-setup">
      
      {/* Upper Logo / Branding Center */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 bg-indigo-600 rounded-2xl items-center justify-center text-white border border-indigo-400/20 shadow-xl shadow-indigo-600/10">
          <User className="h-7 w-7" id="register-brand-icon" />
        </div>
        <h2 className="mt-6 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50">
          Establish Access Keys
        </h2>
        <p className="mt-2 text-xs font-mono text-slate-400 tracking-widest uppercase">
          Build a resilient AES symmetrical encryption envelope
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="register-form-card-container">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 rounded-3xl sm:px-10 shadow-2xl relative overflow-hidden">
          
          {/* Decorative neon visual line */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-indigo-600 to-indigo-500" />

          {/* Form Action Critical Errors */}
          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-xs text-rose-300" id="register-error-alert">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal font-medium">{authError}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} id="standard-register-form">
            
            {/* Operator Identifier Name */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Committing Operator Name</label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-mono">
                  <User className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  id="register-name-input"
                  className="block w-full pl-11 pr-4 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-sm py-3 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Registry Email Inbox */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Registered Email Inbox</label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="register-email-input"
                  className="block w-full pl-11 pr-4 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-sm py-3 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Master Key Password Input */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Master Password Key</label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="register-password-input"
                  className="block w-full pl-11 pr-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-sm py-3 transition-all"
                  placeholder="Password (Min 8 Chars...)"
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

            {/* Confirm Key Password Input */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Confirm Password Key</label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  id="register-confirm-password-input"
                  className="block w-full pl-11 pr-4 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-sm py-3 transition-all"
                  placeholder="Re-enter password state..."
                />
              </div>
            </div>

            {/* Dynamic Master Key Strength Audit Indicators */}
            {password.length > 0 && (
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl space-y-2" id="key-strength-audit-panel">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase font-bold">Key Strength Entropy:</span>
                  <span className={`font-bold uppercase ${
                    criteriaTotalScore <= 1 ? 'text-rose-400' :
                    criteriaTotalScore <= 3 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {criteriaTotalScore <= 1 ? 'WEAK' :
                     criteriaTotalScore <= 3 ? 'MODERATE' :
                     'SECURE'}
                  </span>
                </div>
                
                {/* Visual bar progress */}
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-full flex-1 transition-all ${
                        i < criteriaTotalScore 
                          ? (criteriaTotalScore <= 1 ? 'bg-rose-500' : criteriaTotalScore <= 3 ? 'bg-amber-500' : 'bg-emerald-500')
                          : 'bg-slate-850'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-slate-450">
                  <p className="flex items-center space-x-1">
                    <span className={criteria.length ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                    <span>8+ Chars</span>
                  </p>
                  <p className="flex items-center space-x-1">
                    <span className={criteria.uppercase ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                    <span>Capital A-Z</span>
                  </p>
                  <p className="flex items-center space-x-1">
                    <span className={criteria.number ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                    <span>Contains 0-9</span>
                  </p>
                  <p className="flex items-center space-x-1">
                    <span className={criteria.symbol ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                    <span>Symbol (!#%@)</span>
                  </p>
                </div>
              </div>
            )}

            {/* Launch Account CTA button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                id="register-submit-btn"
                className="w-full flex justify-center py-3.5 px-4 border border-indigo-500/30 rounded-xl shadow-lg shadow-indigo-600/10 text-xs font-mono font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? 'DEPLOYING INTEGRITY SUITE...' : 'ESTABLISH SECURITY PROFILE'}
              </button>
            </div>

          </form>

          {/* Login Redirect Footer Section */}
          <div className="mt-8 border-t border-slate-850 pt-5 flex items-center justify-center space-x-1.5 text-xs text-slate-450 font-mono">
            <span>Already secured previously?</span>
            <Link to="/login" id="register-login-link" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Log In Terminal
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
