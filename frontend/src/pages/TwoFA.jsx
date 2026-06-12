/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 25: frontend/src/pages/TwoFA.jsx
 * Comprehensive OTP/TOTP Dynamic Verification and Backup Authentication Page.
 * Implements:
 * - Interactive 6-digit block-code input fields with auto-focus traversal & backspace guards
 * - Clean switching to backup alphanumeric restoration keys
 * - Simulated resend cooldown timer structures for high-fidelity interactive flow
 * - Symmetric design palette matching SECUREVAULT's high-contrast dark visual aesthetics
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  QrCode, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  ChevronLeft, 
  ArrowRight,
  Info
} from 'lucide-react';

export default function TwoFA() {
  const { login2FA, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Multi-digit block inputs state container
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cool-down timers state
  const [cooldown, setCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // References list to traverse dynamic input boxes
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Retrieve temporary login identity state from routing parameters or session cache
  const userId = location.state?.userId || localStorage.getItem('vault_temp_userId') || '';
  const email = location.state?.email || localStorage.getItem('vault_temp_email') || '';

  // Redirect target after success verification matching state defaults
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // If no userId reference can be resolved, route operator back to login gate
    if (!userId) {
      navigate('/login', { replace: true });
    }
  }, [userId, navigate]);

  useEffect(() => {
    let intervalId;
    if (cooldown > 0 && !canResend) {
      intervalId = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [cooldown, canResend]);

  // Handles character insertion on OTP digit elements
  const handleDigitChange = (index, value) => {
    // Sanitize to only numeric character representations
    const cleanChar = value.replace(/[^0-9]/g, '');
    if (!cleanChar) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const updated = [...otpDigits];
    // Keep only the last typed character in case of double-keypress
    updated[index] = cleanChar.slice(-1);
    setOtpDigits(updated);

    // Auto-traverse to next logical entry slot if present
    if (index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Traverses backward on backspace strikes inside blank fields
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        inputRefs[index - 1].current.focus();
      }
    }
  };

  // Handle direct clipboards paste operations
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteContent = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteContent)) {
      const digitsArray = pasteContent.split('');
      setOtpDigits(digitsArray);
      inputRefs[5].current.focus();
    }
  };

  // Resets the cooldown clock to simulate an OTP resend
  const triggerResendCode = () => {
    if (!canResend) return;
    setCooldown(30);
    setCanResend(false);
    setAuthError(null);
    alert('Dynamic OTP pin dispatched successfully. In sandboxed mode, use active tokens configured in Google Authenticator.');
  };

  // Confirm verification processing
  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setAuthError(null);

    const tokenCode = isBackupMode ? backupCode : otpDigits.join('');

    if (tokenCode.length < (isBackupMode ? 8 : 6)) {
      setAuthError(isBackupMode 
        ? 'Emergency backup code must consist of at least 8 alphanumeric characters.' 
        : 'Symmetric verification PIN must consist of exactly 6 digits.'
      );
      return;
    }

    setLoading(true);
    try {
      await login2FA(userId, tokenCode, isBackupMode);
      
      // Clean up backup temporary storage identifiers
      localStorage.removeItem('vault_temp_userId');
      localStorage.removeItem('vault_temp_email');

      navigate(from, { replace: true });
    } catch (err) {
      console.error('OTP Authentication challenge rejected:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-200 select-none" id="twofa-viewport-gate">
      
      {/* Navigation Return Hook */}
      <div className="absolute top-6 left-6">
        <Link 
          to="/login" 
          onClick={() => setAuthError(null)}
          className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 hover:text-slate-300 transition-colors"
          id="twofa-back-link"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>ABORT SYSTEM SIGN-IN</span>
        </Link>
      </div>

      {/* Main Container branding headings */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 bg-indigo-600 rounded-2xl items-center justify-center text-white border border-indigo-400/20 shadow-xl shadow-indigo-600/10">
          <QrCode className="h-7 w-7" id="twofa-main-icon" />
        </div>
        <h2 className="mt-6 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50">
          {isBackupMode ? 'Emergency Recovery' : 'Verification Challenge'}
        </h2>
        <p className="mt-2 text-xs font-mono text-slate-400 tracking-widest uppercase">
          {isBackupMode ? 'RESTORATION ACCESS VERIFICATION' : 'INPUT MULTI-FACTOR IDENTIFICATION PIN'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="twofa-verification-container">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 rounded-3xl sm:px-10 shadow-2xl relative overflow-hidden">
          
          {/* Accent border decorations */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-600 to-indigo-600" />

          {/* Verification Warning Alert */}
          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-xs text-rose-350" id="twofa-error-alert">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal font-medium">{authError}</div>
            </div>
          )}

          {/* Context indicator info box */}
          <div className="mb-6 p-3.5 bg-slate-950 border border-slate-850 rounded-2xl text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2.5">
            <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>Account identifier is locked under active double-gated shield rules: </span>
              <span className="font-bold text-slate-200 truncate block mt-0.5">{email || 'operator@securevault.local'}</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmitVerification} id="twofa-verification-form">
            
            {!isBackupMode ? (
              // Option A: Standard 6-Digit Authenticator Block Array
              <div className="space-y-4">
                <label className="block text-center text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">
                  Secure Pin (TOTP Code)
                </label>
                
                <div 
                  className="flex justify-between gap-2 max-w-xs mx-auto" 
                  onPaste={handlePaste}
                  id="otp-digits-input-group"
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      ref={inputRefs[index]}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-13 text-center bg-slate-950 border border-slate-800 text-slate-100 text-lg md:text-xl font-bold font-mono focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl transition-all"
                      id={`otp-digit-box-${index}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Option B: Backup Alphanumeric key Entry Field
              <div>
                <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">
                  Emergency Restoration Code
                </label>
                <div className="mt-2.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Key className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                    className="block w-full pl-11 pr-4 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl text-xs sm:text-sm py-3.5 transition-all font-mono tracking-widest text-center"
                    placeholder="XXXXX-XXXXX"
                    id="twofa-backup-field"
                  />
                </div>
              </div>
            )}

            {/* Verification triggers / actions */}
            <div className="space-y-3.5 pt-2">
              <button
                type="submit"
                disabled={loading}
                id="twofa-verify-btn"
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 border border-indigo-500/30 rounded-xl shadow-lg shadow-indigo-600/10 text-xs font-mono font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                <span>{loading ? 'SENSING SIGNATURES...' : 'CONFIRM ACCESS AUTHORIZATION'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Mode Toggle Controls */}
              <button
                type="button"
                onClick={() => {
                  setIsBackupMode(!isBackupMode);
                  setOtpDigits(['', '', '', '', '', '']);
                  setBackupCode('');
                  setAuthError(null);
                }}
                className="w-full text-center py-2.5 border border-slate-850 bg-slate-950/40 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-200 font-mono text-xs font-semibold transition-colors uppercase"
                id="twofa-mode-toggle-btn"
              >
                {isBackupMode ? 'Verify via OTP Authenticator Pin' : 'Lose access? Verify via backup code'}
              </button>
            </div>

          </form>

          {/* Simulated Resend Verification clock trigger */}
          {!isBackupMode && (
            <div className="mt-8 border-t border-slate-850 pt-5 text-center">
              <button
                type="button"
                disabled={!canResend}
                onClick={triggerResendCode}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-indigo-400 disabled:text-slate-550 transition-colors uppercase font-bold"
                id="twofa-resend-btn"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${(!canResend && cooldown > 0) ? 'animate-spin' : ''}`} />
                <span>
                  {canResend ? 'Resend verification code' : `Resend in ${cooldown}s`}
                </span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
