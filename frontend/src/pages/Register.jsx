/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    
    // அடிப்படை சரிபார்ப்பு
    if (!name || !email || !password) {
      setAuthError('All fields are required.');
      return;
    }

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
      // AuthContext-ல் உள்ள register-ஐ அழைக்கிறோம்
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      // API-ல் இருந்து வரும் எரரை சரியாகக் காட்டுகிறோம்
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-200 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 bg-indigo-600 rounded-2xl items-center justify-center text-white border border-indigo-400/20 shadow-xl shadow-indigo-600/10">
          <User className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50">Establish Access Keys</h2>
        <p className="mt-2 text-xs font-mono text-slate-400 tracking-widest uppercase">Build a resilient AES symmetrical encryption envelope</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 rounded-3xl sm:px-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-indigo-600 to-indigo-500" />

          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-xs text-rose-300">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal font-medium">{authError}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Committing Operator Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 block w-full pl-4 pr-4 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl py-3" placeholder="John Doe" />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Registered Email Inbox</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 block w-full pl-4 pr-4 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl py-3" placeholder="name@company.com" />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Master Password Key</label>
              <div className="mt-1.5 relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-4 pr-11 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl py-3" placeholder="Min 8 Chars..." />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">Confirm Password Key</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5 block w-full pl-4 pr-4 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl py-3" placeholder="Re-enter password..." />
            </div>

            <button type="submit" disabled={loading} className="w-full mt-4 py-3.5 border border-indigo-500/30 rounded-xl shadow-lg text-xs font-mono font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all">
              {loading ? 'DEPLOYING INTEGRITY SUITE...' : 'ESTABLISH SECURITY PROFILE'}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-850 pt-5 text-center text-xs text-slate-450 font-mono">
            <span>Already secured?</span>
            <Link to="/login" className="ml-1.5 font-bold text-indigo-400 hover:text-indigo-300">Log In Terminal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}