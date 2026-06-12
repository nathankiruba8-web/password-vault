/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 29: frontend/src/pages/Settings.jsx
 * Professional settings control center managing account preferences,
 * password generator defaults, security clipboard clears, auto-lock timeouts,
 * and high-integrity interactive multi-factor authentication (MFA) setup.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Unlock,
  Clock,
  Clipboard,
  Sliders,
  Grid,
  List,
  AlertTriangle,
  Check,
  X,
  Download,
  Copy,
  QrCode,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function Settings() {
  const { user, syncMfaStatus, logout } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'mfa'

  // General Status Message States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ---------------------------------------------------------
  // Settings Category A: Account & Password Generator Preferences
  // ---------------------------------------------------------
  const [defaultLayout, setDefaultLayout] = useState('grid');
  const [genDefaultLength, setGenDefaultLength] = useState(16);
  const [genDefaultUpper, setGenDefaultUpper] = useState(true);
  const [genDefaultLower, setGenDefaultLower] = useState(true);
  const [genDefaultNumbers, setGenDefaultNumbers] = useState(true);
  const [genDefaultSymbols, setGenDefaultSymbols] = useState(true);

  // ---------------------------------------------------------
  // Settings Category B: Hardened Clipboard & Auto-Lock Timeouts
  // ---------------------------------------------------------
  const [clipboardTimeout, setClipboardTimeout] = useState('30');
  const [autolockDuration, setAutolockDuration] = useState('15');

  // ---------------------------------------------------------
  // Settings Category C: Two-Factor Authentication Integration Workflow
  // ---------------------------------------------------------
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState('overview'); // 'overview' | 'scan' | 'verified'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [backupCodes, setBackupCodes] = useState([]);
  const [otpError, setOtpError] = useState('');

  // Refs for otp traversing focus digits
  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Initialize and load settings from local storage on mount
  useEffect(() => {
    setDefaultLayout(localStorage.getItem('vault_pref_layout') || 'grid');
    setGenDefaultLength(parseInt(localStorage.getItem('vault_pref_gen_length') || '16', 10));
    setGenDefaultUpper(localStorage.getItem('vault_pref_gen_upper') !== 'false');
    setGenDefaultLower(localStorage.getItem('vault_pref_gen_lower') !== 'false');
    setGenDefaultNumbers(localStorage.getItem('vault_pref_gen_numbers') !== 'false');
    setGenDefaultSymbols(localStorage.getItem('vault_pref_gen_symbols') !== 'false');
    setClipboardTimeout(localStorage.getItem('vault_pref_clipboard_decay') || '30');
    setAutolockDuration(localStorage.getItem('vault_pref_autolock') || '15');
  }, []);

  const flashMessage = (type, message) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(message);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  // Save account & password defaults settings
  const handleSaveAccountPreferences = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('vault_pref_layout', defaultLayout);
      localStorage.setItem('vault_pref_gen_length', genDefaultLength.toString());
      localStorage.setItem('vault_pref_gen_upper', genDefaultUpper.toString());
      localStorage.setItem('vault_pref_gen_lower', genDefaultLower.toString());
      localStorage.setItem('vault_pref_gen_numbers', genDefaultNumbers.toString());
      localStorage.setItem('vault_pref_gen_symbols', genDefaultSymbols.toString());

      flashMessage('success', 'Account view metrics and password defaults saved successfully.');
    } catch (err) {
      flashMessage('error', 'Failed saving local storage indicators.');
    }
  };

  // Save security constraints
  const handleSaveSecurityPreferences = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('vault_pref_clipboard_decay', clipboardTimeout);
      localStorage.setItem('vault_pref_autolock', autolockDuration);

      flashMessage('success', 'Security clipboard clearances and idle locks synchronized successfully.');
    } catch (err) {
      flashMessage('error', 'Failed syncing cryptographic boundaries.');
    }
  };

  // -------------------------------------------------------------
  // TWO FACTOR SHIELD PIPELINE HANDLERS
  // -------------------------------------------------------------

  // Initiates setup request to backend to draw secret & QR representations
  const handleSetup2FA = async () => {
    setMfaLoading(true);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    try {
      const response = await apiClient.post('/api/auth/2fa/setup');
      setQrCodeDataUrl(response.data.qrCodeUrl);
      setMfaSecret(response.data.secret);
      setMfaStep('scan');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed generating MFA enrollment keys.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    const cleanChar = value.replace(/[^0-9]/g, '');
    if (!cleanChar) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleanChar.slice(-1);
    setOtpDigits(updated);

    if (index < 5) {
      otpInputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        otpInputRefs[index - 1].current.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteContent = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteContent)) {
      const digitsArray = pasteContent.split('');
      setOtpDigits(digitsArray);
      otpInputRefs[5].current.focus();
    }
  };

  // Validate user inputs to enable double-gate enforcement
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setMfaLoading(true);
    setOtpError('');
    const tokenStr = otpDigits.join('');

    if (tokenStr.length < 6) {
      setOtpError('Must complete validation chain with all 6 digits.');
      setMfaLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/api/auth/2fa/verify', { token: tokenStr });
      setBackupCodes(response.data.backupCodes || []);
      syncMfaStatus(true);
      setMfaStep('verified');
      flashMessage('success', 'Two-Factor Authentication shield holds fully operational status.');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Validation rejected. Enter active authenticator token.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Disable 2FA workflow
  const handleDisable2FA = async () => {
    const consent = window.confirm(
      'STRATEGIC SECURITY NOTICE: Disabling multi-factor shields decreases authorization complexity. Are you absolutely sure?'
    );
    if (!consent) return;

    setMfaLoading(true);
    try {
      await apiClient.post('/api/auth/2fa/disable');
      syncMfaStatus(false);
      setBackupCodes([]);
      setMfaSecret('');
      setQrCodeDataUrl('');
      setMfaStep('overview');
      flashMessage('success', 'Two-Factor identification deactivated. Account returned to single password gate.');
    } catch (err) {
      flashMessage('error', err.response?.data?.error || 'System anomaly deactivating 2FA shield.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Copy backup codes to dashboard clipboard
  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const plainCodes = backupCodes.join('\n');
    navigator.clipboard.writeText(plainCodes);
    alert('Disaster recovery keys written to clipboard. Lock them safely!');
  };

  // File system persistent download for codes
  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const bodyStr = `SECUREVAULT MULTI-FACTOR AUTHENTICATION DISASTER RECOVERY CODES\n` +
      `ISSUED AT: ${new Date().toISOString()}\n` +
      `ACCOUNT IDENTITY: ${user?.email || 'unidentified'}\n` +
      `======================================================\n\n` +
      backupCodes.map((c, i) => `CODE ${i + 1}: ${c}`).join('\n') +
      `\n\n======================================================\n` +
      `WARNING: These codes allow bypass protection if your device breaks. Secure them offline.`;

    const blob = new Blob([bodyStr], { type: 'text/plain;charset=utf-8' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `SECUREVAULT_MFA_RECOVERY_KEYS_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  };

  return (
    <Layout>
      <div id="settings-viewport-shell" className="space-y-8 animate-fade-in text-slate-200">
        
        {/* Page title introduction */}
        <div className="flex items-start space-x-3.5 border-b border-slate-900 pb-5">
          <div className="p-3 bg-indigo-650 text-slate-100 rounded-2xl shadow-lg border border-indigo-500/20 max-w-fit mt-0.5">
            <SettingsIcon className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-indigo-50">Operational Configuration & Preferences</h1>
            <p className="text-[10px] font-mono text-slate-500 tracking-wider mt-1 uppercase font-semibold">
              Calibrate default layout vectors, default password generators, dynamic timeouts, and multi-factor guard shields
            </p>
          </div>
        </div>

        {/* Global Notifications system */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-xs text-emerald-400 font-medium animate-fade-in shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-3 text-xs text-rose-400 font-medium animate-fade-in shadow-lg">
            <ShieldAlert className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Settings Workspace Nav Toggles */}
        <div className="flex border-b border-slate-850 overflow-x-auto scrollbar-none" id="settings-tabs">
          
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); }}
            className={`py-3 px-5 text-[11px] font-mono uppercase font-bold tracking-wider relative transition-colors cursor-pointer flex items-center space-x-2 ${
              activeTab === 'profile' ? 'text-indigo-400' : 'text-slate-450 hover:text-slate-205'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile & Defaults</span>
            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('security'); }}
            className={`py-3 px-5 text-[11px] font-mono uppercase font-bold tracking-wider relative transition-colors cursor-pointer flex items-center space-x-2 ${
              activeTab === 'security' ? 'text-indigo-400' : 'text-slate-450 hover:text-slate-205'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeout Guards</span>
            {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('mfa'); }}
            className={`py-3 px-5 text-[11px] font-mono uppercase font-bold tracking-wider relative transition-colors cursor-pointer flex items-center space-x-2 ${
              activeTab === 'mfa' ? 'text-indigo-400' : 'text-slate-450 hover:text-slate-205'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Two-Factor Shield</span>
            {user?.isTwoFactorEnabled && (
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                ACTIVE
              </span>
            )}
            {activeTab === 'mfa' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>

        </div>

        {/* Settings panels switchboard */}
        <div className="min-h-[400px]">
          
          {/* TAB 1: Profile and Defaults */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveAccountPreferences} className="space-y-6" id="settings-form-preferences">
              
              {/* Identity viewcard */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                  <User className="h-36 w-36 text-slate-200" />
                </div>
                
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">ADMINISTRATOR DOMAIN</span>
                <h3 className="text-sm font-bold font-mono text-indigo-100 uppercase mt-1">Identified Operator credentials</h3>
                
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3 flex flex-col justify-center border border-slate-850 rounded-xl">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Identity Phrase Label</span>
                    <span className="text-xs font-semibold text-slate-200 truncate mt-0.5">{user?.name || 'Operator'}</span>
                  </div>
                  <div className="bg-slate-950 p-3 flex flex-col justify-center border border-slate-850 rounded-xl">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Session Email Address</span>
                    <span className="text-xs font-semibold text-slate-200 truncate mt-0.5">{user?.email || 'unassigned@securevault.local'}</span>
                  </div>
                </div>
              </div>

              {/* Layout default preference */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">RENDERING PARAMETERS</span>
                  <h3 className="text-sm font-bold font-mono text-indigo-100 uppercase mt-1">Default Cryptographic Hub Layout</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  {/* Grid Layout Option */}
                  <label className={`block p-4 border rounded-2xl cursor-pointer transition-all ${
                    defaultLayout === 'grid' 
                      ? 'bg-indigo-600/5 border-indigo-500 text-slate-150' 
                      : 'bg-slate-950/40 border-slate-850 text-slate-450 hover:bg-slate-950/70 hover:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Grid className={`h-5 w-5 ${defaultLayout === 'grid' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold font-mono uppercase">Multi-Column Cards Layout</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">High-density visual elements layout</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="layout_pref"
                        value="grid"
                        checked={defaultLayout === 'grid'}
                        onChange={() => setDefaultLayout('grid')}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center p-0.5 ${
                        defaultLayout === 'grid' ? 'border-indigo-500 text-indigo-400' : 'border-slate-850'
                      }`}>
                        {defaultLayout === 'grid' && <div className="h-full w-full rounded-full bg-indigo-500" />}
                      </div>
                    </div>
                  </label>

                  {/* List Layout Option */}
                  <label className={`block p-4 border rounded-2xl cursor-pointer transition-all ${
                    defaultLayout === 'list' 
                      ? 'bg-indigo-600/5 border-indigo-500 text-slate-150' 
                      : 'bg-slate-950/40 border-slate-850 text-slate-450 hover:bg-slate-950/70 hover:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <List className={`h-5 w-5 ${defaultLayout === 'list' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold font-mono uppercase">Compact Chronological List</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Sequential ledger line item rows</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="layout_pref"
                        value="list"
                        checked={defaultLayout === 'list'}
                        onChange={() => setDefaultLayout('list')}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center p-0.5 ${
                        defaultLayout === 'list' ? 'border-indigo-500 text-indigo-400' : 'border-slate-850'
                      }`}>
                        {defaultLayout === 'list' && <div className="h-full w-full rounded-full bg-indigo-500" />}
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              {/* Password Generator preset preferences */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">CIPHER PRESETS</span>
                  <h3 className="text-sm font-bold font-mono text-indigo-100 uppercase mt-1">Automatic Password Generator Defaults</h3>
                </div>

                <div className="space-y-4">
                  {/* Slider Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-450 uppercase font-semibold">DEFAULT CHARACTER COUNT STRENGTH</span>
                      <span className="text-indigo-400 font-extrabold">{genDefaultLength} CHARACTERS</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="8"
                        max="64"
                        value={genDefaultLength}
                        onChange={(e) => setGenDefaultLength(parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Checkboxes lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] pt-2">
                    
                    <label className="flex items-center space-x-3 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={genDefaultUpper}
                        onChange={(e) => setGenDefaultUpper(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <span className="text-slate-350 uppercase">UPPERCASE COEFFICIENTS (A-Z)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={genDefaultLower}
                        onChange={(e) => setGenDefaultLower(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <span className="text-slate-350 uppercase">LOWERCASE COEFFICIENTS (a-z)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={genDefaultNumbers}
                        onChange={(e) => setGenDefaultNumbers(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <span className="text-slate-350 uppercase">NUMERICAL VARIABLES (0-9)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={genDefaultSymbols}
                        onChange={(e) => setGenDefaultSymbols(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <span className="text-slate-350 uppercase">SPECIAL CHARACTERS SYMBOLS (@#*$)</span>
                    </label>

                  </div>
                </div>
              </div>

              {/* Submit preferences Button */}
              <div className="flex pt-2">
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/10 text-slate-100 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl active:bg-indigo-755 hover:shadow-lg hover:shadow-indigo-600/10 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Sliders className="h-4 w-4" />
                  <span>SYNC PRESET DEFAULTS</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: Timeout Guards & Clearances */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurityPreferences} className="space-y-6" id="settings-form-guards">
              
              {/* Clipboard clearance window config */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                <div className="flex items-start space-x-3">
                  <Clipboard className="h-5 w-5 text-indigo-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">DECAY WINDOW</span>
                    <h3 className="text-sm font-bold font-mono text-indigo-100 uppercase mt-1">Automatic Clipboard Cleansing Duration</h3>
                    <p className="text-xs text-slate-400 font-sans mt-1 leading-normal">
                      Specifies how many seconds secret ciphers copied to your clipboard should exist in memory before they are scrubbed by the clipboard buffer routine.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 font-mono text-[10px]">
                  {[
                    { label: '15 SECONDS', value: '15' },
                    { label: '30 SECONDS', value: '30' },
                    { label: '60 SECONDS', value: '60' },
                    { label: '120 SECONDS', value: '120' },
                    { label: 'NEVER PURGE', value: '0' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setClipboardTimeout(opt.value)}
                      className={`py-3 px-1 border font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        clipboardTimeout === opt.value
                          ? 'bg-indigo-650 text-slate-50 border-indigo-500 shadow-md'
                          : 'bg-slate-950 hover:bg-slate-850 text-slate-450 hover:text-slate-205 border-slate-850/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Autolock preferences */}
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-indigo-400 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">INACTIVITY AUTO LOCK</span>
                    <h3 className="text-sm font-bold font-mono text-indigo-100 uppercase mt-1">Symmetrical Session Inactivity Lock</h3>
                    <p className="text-xs text-slate-400 font-sans mt-1 leading-normal">
                      Specifies how long your system session can remain completely idle before automatic termination triggers occur, forcing a secure sign-out.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 font-mono text-[10px]">
                  {[
                    { label: '5 MINUTES', value: '5' },
                    { label: '15 MINUTES', value: '15' },
                    { label: '30 MINUTES', value: '30' },
                    { label: '60 MINUTES', value: '60' },
                    { label: 'NEVER LOCK', value: '0' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAutolockDuration(opt.value)}
                      className={`py-3 px-1 border font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        autolockDuration === opt.value
                          ? 'bg-indigo-655 text-slate-50 border-indigo-500'
                          : 'bg-slate-950 hover:bg-slate-850 text-slate-450 hover:text-slate-205 border-slate-850/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit timeouts button */}
              <div className="flex pt-2">
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/10 text-slate-100 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl active:bg-indigo-755 hover:shadow-lg hover:shadow-indigo-600/10 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Sliders className="h-4 w-4" />
                  <span>SYNC IDLE TIME GUARDS</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 3: Multi-Factor Guards */}
          {activeTab === 'mfa' && (
            <div className="space-y-6" id="settings-mfa-panel">
              
              {/* CURRENT ACTIVE MFA OVERVIEW STATE */}
              {user?.isTwoFactorEnabled ? (
                // State 1: Enabled -> Give option to deactivate
                <div className="bg-slate-900 border border-emerald-500/15 p-6 md:p-8 rounded-3xl space-y-6">
                  
                  <div className="flex items-start space-x-4 max-w-2xl">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex-shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">SHIELD ACTIVE</span>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide mt-1">
                        Double-Gate Authenticator Guard Multi-Factor holds Operational State
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                        Your account security holds optimal resilience posture. Every logon sequence is intercepted, requiring high-integrity numeric validation from your trusted mobile device authenticator.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl max-w-2xl text-[11px] font-mono text-slate-500 leading-normal">
                    <p className="flex items-center space-x-2 text-slate-400">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Google Authenticator (TOTP) configuration verified active.</span>
                    </p>
                    <p className="flex items-center space-x-2 text-slate-400 mt-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Local master keys decoupled from single-password risk factors.</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-850/60 max-w-2xl flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      disabled={mfaLoading}
                      className="px-6 py-3.5 bg-rose-655 hover:bg-rose-500 text-slate-100 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl border border-rose-500/25 active:bg-rose-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${mfaLoading ? 'animate-spin' : ''}`} />
                      <span>{mfaLoading ? 'TRANSMITTING CHANGE...' : 'DEACTIVATE MULTI-FACTOR GUARD'}</span>
                    </button>
                  </div>

                </div>
              ) : (
                // State 2: Disabled -> Guide through onboarding
                <div className="space-y-6">
                  
                  {/* Phase 1: Interactive Onboarding Overview */}
                  {mfaStep === 'overview' && (
                    <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-3xl space-y-6">
                      
                      <div className="flex items-start space-x-4 max-w-2xl">
                        <div className="p-3 bg-indigo-650 text-indigo-100 border border-indigo-500/10 rounded-2xl flex-shrink-0">
                          <QrCode className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">IDENTITY VERIFICATION</span>
                          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide mt-1">
                            Activate Symmetrical Multi-Factor Shield
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                            Add a cryptographic second layer of defense. System logon processes will require both your master passwords and a transient validation index from Google Authenticator, Authy, or compatible TOTP clients.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2 font-mono text-[10px] text-slate-450 leading-relaxed">
                        
                        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl relative overflow-hidden">
                          <span className="text-indigo-400 font-extrabold text-xs block mb-1">STEP 1</span>
                          <span className="font-bold text-slate-350 block uppercase mb-1">Generate Alignment</span>
                          <span>Establish secure cryptographical parameters of authentication between server and device.</span>
                        </div>

                        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl relative overflow-hidden">
                          <span className="text-indigo-400 font-extrabold text-xs block mb-1">STEP 2</span>
                          <span className="font-bold text-slate-350 block uppercase mb-1">Synchronize Token</span>
                          <span>Scan code representation visual markers inside preferred TOTP client layout.</span>
                        </div>

                        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl relative overflow-hidden">
                          <span className="text-indigo-400 font-extrabold text-xs block mb-1">STEP 3</span>
                          <span className="font-bold text-slate-350 block uppercase mb-1">Confirm Integrity</span>
                          <span>Validate sync accuracy to generate active backup relief codes list.</span>
                        </div>

                      </div>

                      <div className="pt-4 border-t border-slate-850/60 max-w-2xl flex">
                        <button
                          type="button"
                          onClick={handleSetup2FA}
                          disabled={mfaLoading}
                          className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-600 text-slate-100 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl border border-indigo-500/20 active:bg-indigo-755 hover:shadow-lg transition-all cursor-pointer flex items-center space-x-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${mfaLoading ? 'animate-spin' : ''}`} />
                          <span>{mfaLoading ? 'ALIGNING PROTOCOLS...' : 'INITIALIZE REGISTRATION SEQUENCE'}</span>
                        </button>
                      </div>

                    </div>
                  )}

                  {/* Phase 2: Enter Pin and Scan Visual Code */}
                  {mfaStep === 'scan' && (
                    <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-3xl space-y-6">
                      
                      <div className="flex flex-col lg:flex-row gap-8 items-start">
                        
                        {/* Column A: QR marker barcode render */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 mx-auto lg:mx-0 flex flex-col items-center">
                          {qrCodeDataUrl ? (
                            <img 
                              src={qrCodeDataUrl} 
                              alt="SecureVault MFA Alignment Barcode" 
                              className="w-44 h-44 rounded-lg bg-white p-2 border border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-44 h-44 bg-slate-900 rounded-lg animate-pulse flex items-center justify-center font-mono text-[10px] text-slate-500 uppercase">
                              Rendering Visual...
                            </div>
                          )}

                          <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider mt-4">
                            ALIGNMENT IDENTIFIER EXPLICIT DATA
                          </span>
                          <code className="text-[10px] text-indigo-400 font-mono select-all mt-1 bg-slate-900/60 py-1 px-2.5 rounded border border-slate-850/60">
                            {mfaSecret}
                          </code>
                        </div>

                        {/* Column B: Interactive form verification */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">VERIFICATION OF ALIGNMENT</span>
                            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide mt-1">
                              Scan barcode & verify synchronization status
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1.5">
                              Scan the barcode utilizing Google Authenticator. Then, input the current temporary six-digit numeric validation code below to confirm setup integrity.
                            </p>
                          </div>

                          {/* Pin errors alerts info */}
                          {otpError && (
                            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-450 font-mono rounded-xl flex items-start space-x-2 max-w-md">
                              <AlertTriangle className="h-4 w-4 text-rose-450 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{otpError}</span>
                            </div>
                          )}

                          <form onSubmit={handleVerify2FA} className="space-y-4 max-w-sm">
                            
                            <div className="space-y-2">
                              <label className="block text-xs font-mono tracking-wider text-slate-450 uppercase font-semibold">
                                Transmitted Active PIN:
                              </label>
                              <div 
                                className="flex justify-between gap-1.5" 
                                onPaste={handlePaste}
                                id="settings-otp-fields"
                              >
                                {otpDigits.map((digit, idx) => (
                                  <input
                                    key={idx}
                                    type="text"
                                    maxLength={1}
                                    ref={otpInputRefs[idx]}
                                    value={digit}
                                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className="w-10 h-12 text-center bg-slate-950 border border-slate-800 text-slate-100 text-base font-bold font-mono focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 rounded-xl transition-all"
                                    id={`settings-otp-digit-${idx}`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex space-x-2 pt-2">
                              <button
                                type="submit"
                                disabled={mfaLoading}
                                className="flex-1 py-3 px-4 bg-indigo-650 hover:bg-indigo-600 text-slate-100 font-mono text-xs font-bold uppercase tracking-wider rounded-xl border border-indigo-505 transition-all text-center flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                              >
                                <span>{mfaLoading ? 'VALIDATING...' : 'CONFIRM MFA CODE'}</span>
                                <ArrowRight className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => { setMfaStep('overview'); }}
                                className="px-4 py-3 bg-slate-950 hover:bg-slate-850 text-slate-450 border border-slate-850 hover:text-slate-200 rounded-xl font-mono text-xs font-bold uppercase transition-all"
                              >
                                ABORT
                              </button>
                            </div>

                          </form>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* Phase 3: Display Emergency Recovery/Backup keys */}
                  {mfaStep === 'verified' && (
                    <div className="bg-slate-900 border border-indigo-500/10 p-6 md:p-8 rounded-3xl space-y-6">
                      
                      <div className="flex items-start space-x-4 max-w-2xl">
                        <div className="p-3 bg-indigo-600 text-slate-100 border border-indigo-400/20 rounded-2xl flex-shrink-0 animate-pulse">
                          <Check className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">REGISTRATION SECURED</span>
                          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide mt-1">
                            Disaster Recovery Backup Credentials Generated
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                            MFA has verified holds. Keep these alphanumeric secondary backup indices. These values are displayed **only once** and represent the only administrative path to bypass the Authenticator lock if your device is compromised.
                          </p>
                        </div>
                      </div>

                      {/* Backup indexes list container */}
                      <div className="bg-slate-950 p-5 border border-slate-855 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-100 font-mono text-center font-bold text-xs select-all max-w-2xl">
                        {backupCodes.map((code, idx) => (
                          <span key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-slate-850 select-all tracking-wider text-indigo-200">
                            {code}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-2 mt-4 bg-rose-500/5 p-4 border border-rose-500/10 rounded-2xl max-w-2xl text-[10px] uppercase font-mono tracking-wide leading-relaxed text-rose-300">
                        <p className="font-bold flex items-center space-x-1.5 mb-1 text-rose-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span>CRITICAL SAFETY CONSTRAINT INFORCE:</span>
                        </p>
                        <ul className="list-disc list-inside space-y-1 pl-1 text-[9px]">
                          <li>Recovery codes will NOT be visible in settings panel once you dismiss this screen.</li>
                          <li>Each key provides a SINGLE-USE bypass trigger, then auto-decapsulates.</li>
                        </ul>
                      </div>

                      {/* Backup buttons actions */}
                      <div className="pt-4 border-t border-slate-850/60 max-w-2xl flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleCopyBackupCodes}
                          className="px-5 py-3.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white font-mono text-xs font-semibold uppercase tracking-wider rounded-2xl border border-slate-850 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                          <span>COPY RECOVERY CODES</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadBackupCodes}
                          className="px-5 py-3.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white font-mono text-xs font-semibold uppercase tracking-wider rounded-2xl border border-slate-850 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          <span>DOWNLOAD TEXT FILE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setMfaStep('overview'); }}
                          className="px-5 py-3.5 bg-indigo-650 hover:bg-indigo-600 text-slate-50 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl border border-indigo-505 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <span>FINALIZE REGISTRATION</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
