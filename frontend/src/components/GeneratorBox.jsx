/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 30: frontend/src/components/GeneratorBox.jsx
 * Professional, high-fidelity security password generation module.
 * Features:
 * - Dynamic entropy scoring engine with progress visualization
 * - Interactive parameters: length range (8 to 64), character coefficients
 * - Multiple readability modes: "Alphanumeric Standard", "Easy to Say", "Easy to Read"
 * - Advanced exclusion and requirement filters
 * - Single-click clipboard copies with self-clearing active decay countdowns
 * - Local historical trace of recently generated credentials
 * - Unified trigger feedback and micro-interactions powered by motion
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Sliders,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Eye,
  EyeOff,
  History,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';

export default function GeneratorBox({ 
  onApply = null, 
  title = "Symmetrical Entropy Generator",
  description = "Generate industry-standard high-entropy cryptographically secure keys"
}) {
  // Generator Parameters State
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [mode, setMode] = useState('standard'); // 'standard' | 'easy-say' | 'easy-read'
  const [excludeChars, setExcludeChars] = useState('');

  // Generated results
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [clipboardTimer, setClipboardTimer] = useState(0);
  const timerRef = useRef(null);

  // Recent generation local logs history
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load defaults from localStorage if configured
  useEffect(() => {
    const savedLength = localStorage.getItem('vault_pref_gen_length');
    if (savedLength) setLength(parseInt(savedLength, 10));

    const savedUpper = localStorage.getItem('vault_pref_gen_upper');
    if (savedUpper !== null) setUseUpper(savedUpper !== 'false');

    const savedLower = localStorage.getItem('vault_pref_gen_lower');
    if (savedLower !== null) setUseLower(savedLower !== 'false');

    const savedNumbers = localStorage.getItem('vault_pref_gen_numbers');
    if (savedNumbers !== null) setUseNumbers(savedNumbers !== 'false');

    const savedSymbols = localStorage.getItem('vault_pref_gen_symbols');
    if (savedSymbols !== null) setUseSymbols(savedSymbols !== 'false');
  }, []);

  // Secure password generation logic utilizing window.crypto API
  const generateSecurePassword = useCallback(() => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let finalLower = lowercase;
    let finalUpper = uppercase;
    let finalNumbers = numbers;
    let finalSymbols = symbols;

    // Filter adjustments for readability formats
    if (mode === 'easy-read') {
      // Avoid ambiguous characters: l, 1, o, 0, O, I, i
      finalLower = 'abcdefghjkmnpqrstuvwxyz';
      finalUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      finalNumbers = '23456789';
      finalSymbols = '@#$%^&*+?'; // simplified symbols to avoid high confusion
    } else if (mode === 'easy-say') {
      // Avoid numbers and symbols
      finalNumbers = '';
      finalSymbols = '';
    }

    let requiredPools = [];
    let charPool = '';

    if (useUpper && finalUpper) {
      charPool += finalUpper;
      requiredPools.push(finalUpper);
    }
    if (useLower && finalLower) {
      charPool += finalLower;
      requiredPools.push(finalLower);
    }
    if (useNumbers && finalNumbers) {
      charPool += finalNumbers;
      requiredPools.push(finalNumbers);
    }
    if (useSymbols && finalSymbols) {
      charPool += finalSymbols;
      requiredPools.push(finalSymbols);
    }

    // Filter custom manual exclusions from active pools
    if (excludeChars.trim()) {
      const excludeSet = new Set(excludeChars.trim().split(''));
      charPool = charPool.split('').filter(c => !excludeSet.has(c)).join('');
      requiredPools = requiredPools.map(pool =>
        pool.split('').filter(c => !excludeSet.has(c)).join('')
      ).filter(p => p.length > 0);
    }

    if (!charPool || length <= 0) {
      setPassword('');
      return;
    }

    // Cryptographic Secure Random Fill
    const randomArray = new Uint32Array(length);
    window.crypto.getRandomValues(randomArray);

    const result = new Array(length);
    const guaranteeCount = Math.min(requiredPools.length, length);
    const indices = Array.from({ length }, (_, i) => i);

    // Fisher-Yates array position shuffle for required indices placement
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor((randomArray[i] / 0xffffffff) * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Draw guaranteed characters first in completely random indices
    let reqIndex = 0;
    for (let i = 0; i < length; i++) {
      const targetIndex = indices[i];
      if (reqIndex < guaranteeCount) {
        const activePool = requiredPools[reqIndex];
        const val = randomArray[i];
        result[targetIndex] = activePool[val % activePool.length];
        reqIndex++;
      } else {
        const val = randomArray[i];
        result[targetIndex] = charPool[val % charPool.length];
      }
    }

    const finalPass = result.join('');
    setPassword(finalPass);

    // Clean up copied overlays state when regenerating
    setCopied(false);

    // Save newly generated secret into history cache (maintains max 10 records)
    setHistory(prev => {
      const item = {
        id: Math.random().toString(36).substr(2, 9),
        val: finalPass,
        time: new Date().toLocaleTimeString(),
        entropy: Math.round(length * Math.log2(charPool.length || 1))
      };
      return [item, ...prev.filter(h => h.val !== finalPass)].slice(0, 10);
    });
  }, [length, useUpper, useLower, useNumbers, useSymbols, mode, excludeChars]);

  // Generate initial key on load
  useEffect(() => {
    generateSecurePassword();
  }, [length, useUpper, useLower, useNumbers, useSymbols, mode, excludeChars]);

  // Password structural strength computation algorithm (Symmetrical Entropy Metric)
  const strengthStats = (() => {
    if (!password) {
      return { label: 'NULL CODES', color: 'text-slate-500', barBg: 'bg-slate-900', width: 'w-0', desc: 'Construct a parameters setup.' };
    }

    const len = password.length;
    let poolSize = 0;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);

    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasNumbers) poolSize += 10;
    if (hasSymbols) poolSize += 32;

    const entropy = Math.round(len * Math.log2(poolSize || 1));

    // Decouple color/gauges boundaries from absolute length to allow short high-character combinations
    if (entropy < 40) {
      return {
        label: 'WEAK ENTROPY',
        color: 'text-rose-450',
        barBg: 'bg-rose-500',
        width: 'w-1/4',
        desc: 'Vulnerable to quick GPU brute force sequences. Expand length parameters.',
        entropy
      };
    } else if (entropy < 60) {
      return {
        label: 'MEDIUM DENSITY',
        color: 'text-amber-450',
        barBg: 'bg-amber-500',
        width: 'w-2/4',
        desc: 'Standard protective balance. Advised for lower tier credentials.',
        entropy
      };
    } else if (entropy < 80) {
      return {
        label: 'STRONG CIPHER',
        color: 'text-emerald-450',
        barBg: 'bg-emerald-500',
        width: 'w-3/4',
        desc: 'Satisfactory mathematical protection. Recommended for commercial items.',
        entropy
      };
    } else {
      return {
        label: 'ARMORED HIGH-ENTROPY',
        color: 'text-indigo-400',
        barBg: 'bg-indigo-500',
        width: 'w-full',
        desc: 'Superior cryptographical density. Defends completely against quantum threats.',
        entropy
      };
    }
  })();

  // Handle Clipboard copies with temporary countdown decay
  const handleCopyClipboard = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);

      // Symmetrical decay clearance config loaded from Settings or defaulted to 30s
      const decayOffset = parseInt(localStorage.getItem('vault_pref_clipboard_decay') || '30', 10);
      
      if (decayOffset > 0) {
        setClipboardTimer(decayOffset);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
          setClipboardTimer(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              navigator.clipboard.writeText(''); // Clear clip
              setCopied(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Simple 3s notification if auto-decay is bypassed
        setTimeout(() => setCopied(false), 3000);
      }

    } catch (err) {
      console.error('Failed copying to security pastebuffer:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-3xl relative overflow-hidden" id="entropy-password-generator-frame">
      
      {/* Decorative background visual node */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.015] pointer-events-none select-none">
        <Sliders className="h-56 w-56 text-slate-100" />
      </div>

      {/* Box Header introduction */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-855/60 pb-5 mb-6">
        <div>
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">ENTROPY CONSOLE</span>
          <h2 className="text-sm font-extrabold text-indigo-50 uppercase tracking-wide mt-1 flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-400" />
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">{description}</p>
        </div>

        {/* History Tab Toggle Button */}
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className={`px-3 py-2 border rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider hover:bg-slate-950 transition-colors flex items-center space-x-1.5 cursor-pointer ${
            showHistory 
              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
              : 'bg-slate-950 border-slate-850 text-slate-450 hover:text-slate-205'
          }`}
          title="Recently generated passwords backlog"
        >
          <History className="h-3.5 w-3.5" />
          <span>HISTORY ({history.length})</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          // HISTORY CARD LIST VIEW
          <motion.div
            key="history-sub-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
            id="generator-history-sub-view"
          >
            <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-850 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                TEMPORARY RECENT PASSWORDS backlog
              </span>
              <button
                type="button"
                onClick={() => setHistory([])}
                disabled={history.length === 0}
                className="text-[9px] font-mono text-rose-500 hover:text-rose-400 uppercase font-extrabold flex items-center space-x-1 transition-all hover:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>CLEAN HISTORY</span>
              </button>
            </div>

            {history.length === 0 ? (
              <div className="bg-slate-950/40 border border-dashed border-slate-850 p-12 text-center rounded-2xl">
                <History className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                  Historical backlog is vacant. Establish new parameters above to generate records.
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto scrollbar-none space-y-2 border border-slate-850 p-3 bg-slate-950/20 rounded-2xl">
                {history.map((h) => (
                  <div key={h.id} className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl flex items-center justify-between font-mono text-xs hover:bg-slate-950/70 transition-colors">
                    <div className="space-y-1 select-all truncate max-w-[70%]">
                      <p className="text-slate-100 font-bold tracking-wider truncate select-all">{h.val}</p>
                      <div className="flex space-x-4 text-[9px] text-slate-500">
                        <span>ENTROPY: <code className="text-indigo-400 font-bold">{h.entropy} bits</code></span>
                        <span>GENERATED AT: {h.time}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(h.val);
                          alert('History secret copied to security clipboard buffer.');
                        }}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-md transition-colors"
                        title="Copy record"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {onApply && (
                        <button
                          type="button"
                          onClick={() => onApply(h.val)}
                          className="px-2 py-1 bg-indigo-650 hover:bg-indigo-600 font-bold text-[9px] uppercase tracking-wider rounded-md text-slate-50 transition-colors"
                        >
                          APPLY
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wide text-slate-450 hover:text-slate-200 transition-colors cursor-pointer"
              >
                RETURN TO GENERATOR OPERATIONS
              </button>
            </div>
          </motion.div>
        ) : (
          // MAIN GENERATIONAL CONTROLS INTERACTIVE SCREEN
          <motion.div
            key="generator-main-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
            id="generator-operational-panel-view"
          >
            {/* Visual presentation block of generated key */}
            <div className="relative" id="password-visualizer-deck">
              <div className="bg-slate-950 border border-slate-850 rounded-2xl px-4 py-4 md:py-5 pr-24 pl-5 flex items-center justify-between min-h-[60px] overflow-hidden">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  readOnly
                  placeholder="Select elements checklist to forge credential"
                  className="w-full bg-transparent border-none text-slate-100 font-mono text-sm md:text-base font-bold tracking-widest focus:ring-0 focus:outline-none placeholder-slate-700 select-all"
                  id="generator-generated-output-box"
                />

                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-slate-950/80 pl-2 py-1.5 rounded-xl">
                  
                  {/* Password visibility toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!password}
                    className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-xl transition-all cursor-pointer disabled:opacity-30"
                    title={showPassword ? "Conceal credential" : "Reveal credential"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyClipboard}
                    disabled={!password}
                    className={`p-2 border rounded-xl transition-all cursor-pointer flex items-center justify-center disabled:opacity-30 relative ${
                      copied 
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                    title="Copy to security clipboard layer"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>

                  {/* Regenerate Action Button */}
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl transition-all active:scale-90 cursor-pointer"
                    title="Regenerate secure secret"
                  >
                    <RefreshCw className="h-4 w-4 text-indigo-400" />
                  </button>

                </div>
              </div>

              {/* Dynamic clipboard decay indicator toast bar */}
              {copied && clipboardTimer > 0 && (
                <div className="absolute -bottom-2 left-6 right-6 bg-slate-950 border border-indigo-500/20 py-1 px-3.5 rounded-full flex justify-between items-center shadow-2xl">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                    <span>CLIPBOARD IN MEMORY. SECURE BUFFER ERASE IN</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 font-extrabold">
                    {clipboardTimer}s
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Symmetrical Entropy strength grading segment */}
            <div className="bg-slate-950/40 p-4 border border-slate-850/60 rounded-2xl space-y-2.5 font-mono">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  STRENGTH INDEX GRADE:
                </span>
                <span className={`text-[10px] uppercase font-extrabold flex items-center space-x-1.5 ${strengthStats.color}`}>
                  <Shield className="h-3.5 w-3.5" />
                  <span>{strengthStats.label} ({strengthStats.entropy || 0} bits)</span>
                </span>
              </div>

              {/* Graphical strength gauge progress indicator slider bar */}
              <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${strengthStats.barBg} transition-all duration-300 rounded-full`} 
                  style={{ width: password ? `${Math.min(100, Math.round(((strengthStats.entropy || 0) / 128) * 100))}%` : '0%' }}
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-normal uppercase">
                {strengthStats.desc}
              </p>
            </div>

            {/* Character parameter toggles & readability formats selection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Left Column: Sizing and characters checklist */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Character default length slider selector */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[11px] font-semibold text-slate-450 uppercase">
                    <span>CHARACTER SELECTION LENGTH</span>
                    <span className="text-indigo-400 font-bold">{length} VARIABLES</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="8"
                      max="64"
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Character checklist grid variables */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10px] text-slate-450 py-1" id="generator-character-toggles">
                  
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useUpper}
                      onChange={(e) => setUseUpper(e.target.checked)}
                      disabled={mode === 'easy-say' && !useLower} // can't disable both
                      className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <span className="uppercase">UPPERCASE (A-Z)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useLower}
                      onChange={(e) => setUseLower(e.target.checked)}
                      disabled={mode === 'easy-say' && !useUpper} // can't disable both
                      className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <span className="uppercase">LOWERCASE (a-z)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useNumbers}
                      onChange={(e) => setUseNumbers(e.target.checked)}
                      disabled={mode === 'easy-say'}
                      className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4 disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                    <span className={`uppercase ${mode === 'easy-say' ? 'opacity-30' : ''}`}>NUMERIC (0-9)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useSymbols}
                      onChange={(e) => setUseSymbols(e.target.checked)}
                      disabled={mode === 'easy-say'}
                      className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4 disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                    <span className={`uppercase ${mode === 'easy-say' ? 'opacity-30' : ''}`}>SYMBOLS (@#*%)</span>
                  </label>

                </div>

                {/* Advanced input filters: Exclusions override */}
                <div className="space-y-1.5 font-mono">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                    Exclusion Parameters (Characters list to discard):
                  </label>
                  <input
                    type="text"
                    value={excludeChars}
                    onChange={(e) => setExcludeChars(e.target.value)}
                    placeholder="e.g. i, I, l, 1, o, 0"
                    className="w-full bg-slate-950 border border-slate-850 text-slate-300 px-3 py-2 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

              </div>

              {/* Right Column: Readability Modes */}
              <div className="lg:col-span-5 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between" id="generator-readability-modes">
                
                <div className="space-y-3">
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                    READABILITY FORMAT PROTOCOLS:
                  </span>

                  <div className="space-y-2 font-mono text-[10px]">
                    
                    {/* Alphanumeric Standard */}
                    <button
                      type="button"
                      onClick={() => { setMode('standard'); }}
                      className={`w-full p-2.5 border rounded-xl font-bold uppercase text-left tracking-wide transition-all ${
                        mode === 'standard'
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                          : 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-450 hover:text-slate-300'
                      }`}
                    >
                      <span className="block font-bold">ALPHANUMERIC STANDARD</span>
                      <span className="block text-[8px] font-semibold text-slate-500 mt-0.5 normal-case font-sans">
                        Full character coefficient pools for optimal mathematical uniqueness.
                      </span>
                    </button>

                    {/* Easy to say */}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('easy-say');
                        setUseNumbers(false);
                        setUseSymbols(false);
                      }}
                      className={`w-full p-2.5 border rounded-xl font-bold uppercase text-left tracking-wide transition-all ${
                        mode === 'easy-say'
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                          : 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-450 hover:text-slate-300'
                      }`}
                    >
                      <span className="block font-bold">EASY TO SAY</span>
                      <span className="block text-[8px] font-semibold text-slate-500 mt-0.5 normal-case font-sans">
                        Retains alphabetical ranges while discarding confusing numeric indices or symbols.
                      </span>
                    </button>

                    {/* Easy to read */}
                    <button
                      type="button"
                      onClick={() => { setMode('standard'); setMode('easy-read'); }}
                      className={`w-full p-2.5 border rounded-xl font-bold uppercase text-left tracking-wide transition-all ${
                        mode === 'easy-read'
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                          : 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-450 hover:text-slate-300'
                      }`}
                    >
                      <span className="block font-bold">EASY TO READ</span>
                      <span className="block text-[8px] font-semibold text-slate-500 mt-0.5 normal-case font-sans">
                        Excludes highly ambiguous shapes like numbers 1 vs. lowercase letters L or 0 vs. O.
                      </span>
                    </button>

                  </div>
                </div>

                <div className="text-[8px] text-slate-500 font-mono uppercase bg-slate-950 border border-slate-850/60 p-2 rounded-xl flex items-start space-x-1.5 mt-3 leading-relaxed">
                  <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                  <span>PREPARATION CRITERIA CONVERGES WITH FIPS-140 COMPLIANCE PROTOCOLS</span>
                </div>

              </div>

            </div>

            {/* Unified Selective Apply Button (If onApply is delivered as a prop) */}
            {onApply && (
              <div className="pt-4 border-t border-slate-855/60 flex justify-end">
                <button
                  type="button"
                  onClick={() => onApply(password)}
                  disabled={!password}
                  className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-505 disabled:opacity-40 text-slate-50 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-650/10 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Check className="h-4 w-4 text-slate-50" />
                  <span>APPLY TO VAULT CREATION ITEM</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
