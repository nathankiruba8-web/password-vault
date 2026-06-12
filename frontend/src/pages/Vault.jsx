/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 27: frontend/src/pages/Vault.jsx
 * Multi-featured secure credentials storage panel inside SECUREVAULT.
 * Features:
 * - Robust filtering by categories, search terms, and key-strength indicators
 * - Grid configuration with symmetric dark visual elements
 * - On-demand cryptography decoding, password meters, and secure note previewers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import {
  Lock,
  Unlock,
  Shield,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Edit,
  Trash2,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Database,
  Sliders,
  Sparkles
} from 'lucide-react';

// ==============================================================================
// INNER COMPONENT: STANDALONE VAULT STRENGTH CALCULATOR/METER
// ==============================================================================
function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const getStrengthScore = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 14) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const score = getStrengthScore(password);
  
  const getLabelAndColor = (s) => {
    switch (s) {
      case 0:
      case 1:
        return { label: 'CRITICAL WARNING (WEAK)', color: 'bg-rose-500', text: 'text-rose-400' };
      case 2:
      case 3:
        return { label: 'MODERATE (MEDIUM)', color: 'bg-amber-500', text: 'text-amber-400' };
      case 4:
        return { label: 'SECURE (STRONG)', color: 'bg-emerald-500', text: 'text-emerald-400' };
      case 5:
      default:
        return { label: 'ARMORED (EXCELLENT)', color: 'bg-indigo-500', text: 'text-indigo-400' };
    }
  };

  const { label, color, text } = getLabelAndColor(score);

  return (
    <div className="space-y-1.5 mt-2" id="vault-pwd-meter-inner">
      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-slate-500">DYNAMIC CAPACITY BAR:</span>
        <span className={`font-bold uppercase ${text}`}>{label}</span>
      </div>
      <div className="h-1 bg-slate-950 rounded-full overflow-hidden flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 transition-all duration-300 ${
              i < score ? color : 'bg-slate-850'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ==============================================================================
// INNER COMPONENT: FLOATING COMPLEX CRASH INTEGRATION GENERATOR
// ==============================================================================
function VaultPasswordGenerator({ onSelectPassword }) {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedKey, setGeneratedKey] = useState('');

  const generateKey = () => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pool = '';
    if (includeUpper) pool += uppercaseChars;
    if (includeLower) pool += lowercaseChars;
    if (includeNumbers) pool += numberChars;
    if (includeSymbols) pool += symbolChars;

    if (!pool) {
      setGeneratedKey('CONFIGURE ENVELOPE PARAMETERS First');
      return;
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    setGeneratedKey(result);
  };

  useEffect(() => {
    generateKey();
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  return (
    <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-4" id="vault-standalone-interactive-generator">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-indigo-400">
          <Sparkles className="h-4 w-4" />
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider">Entropy Key Synthesizer</h4>
        </div>
        <button
          type="button"
          onClick={generateKey}
          className="text-[10px] font-mono text-slate-450 hover:text-slate-200 uppercase underline"
        >
          RE-GENERATE
        </button>
      </div>

      {/* Generated output row */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between select-all font-mono text-slate-100 text-xs tracking-widest break-all">
        <span className="font-bold text-emerald-400">{generatedKey}</span>
        <button
          type="button"
          onClick={() => onSelectPassword(generatedKey)}
          className="ml-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-mono text-[10px] uppercase tracking-wider font-bold rounded-lg transition-colors border border-indigo-400/20"
        >
          APPLY
        </button>
      </div>

      {/* Slider configs */}
      <div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1">
          <span>KEY LENGTH INDEX:</span>
          <span className="text-indigo-400 font-bold">{length} SYMBOLS</span>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value, 10))}
          className="w-full accent-indigo-500 bg-slate-900 h-1 rounded cursor-pointer"
        />
      </div>

      {/* Option checkboxes */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-mono text-slate-450">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeUpper}
            onChange={() => setIncludeUpper(!includeUpper)}
            className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span>CAPITAL LETTERS</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeLower}
            onChange={() => setIncludeLower(!includeLower)}
            className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span>LOWERCASE STATE</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={() => setIncludeNumbers(!includeNumbers)}
            className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span>CONTAIN NUMERALS</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSymbols}
            onChange={() => setIncludeSymbols(!includeSymbols)}
            className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span>INCLUDE CHARS</span>
        </label>
      </div>
    </div>
  );
}

// ==============================================================================
// PRIMARY MAIN COMPONENT EXPORT
// ==============================================================================
export default function Vault() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Search, filtration states
  const [passwords, setPasswords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStrength, setSelectedStrength] = useState('All');
  const [loading, setLoading] = useState(true);

  // Static options lists
  const categoriesList = ['All', 'General', 'Logins', 'Financial', 'Social', 'Secure Notes'];
  const strengthLevels = ['All', 'Excellent', 'Strong', 'Medium', 'Weak'];

  // Temporary dialog management state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [recordForEdit, setRecordForEdit] = useState(null);

  // On-demand decryption state caching
  const [viewedRecordId, setViewedRecordId] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [decryptingId, setDecryptingId] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Symmetrical Record values
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('General');
  const [expiryDate, setExpiryDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const url = `/api/passwords?q=${encodeURIComponent(searchQuery)}${
        selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : ''
      }`;
      const response = await apiClient.get(url);
      let data = response.data.data;

      // Secondary client-filtration for password strength metric
      if (selectedStrength !== 'All') {
        data = data.filter(item => item.passwordStrength === selectedStrength);
      }

      setPasswords(data);
    } catch (err) {
      console.error('SECUREVAULT encryption pipeline fail:', err.message);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedStrength]);

  const clearFormState = () => {
    setSiteName('');
    setUsername('');
    setPassword('');
    setSiteUrl('');
    setNotes('');
    setCategory('General');
    setExpiryDate('');
  };

  const handleCreateCredential = async (e) => {
    e.preventDefault();
    if (!siteName || !username || !password) return;
    try {
      await apiClient.post('/api/passwords', {
        siteName,
        username,
        password,
        siteUrl,
        notes,
        category,
        expiryDate: expiryDate || null
      });
      setIsAddOpen(false);
      clearFormState();
      loadData();
    } catch (err) {
      alert(`Credentials register error: ${err.response?.data?.error || err.message}`);
    }
  };

  const openEditor = (record) => {
    setRecordForEdit(record);
    setSiteName(record.siteName);
    setUsername(record.username);
    setPassword(''); // Secure blank default
    setSiteUrl(record.siteUrl || '');
    setNotes(record.notes || '');
    setCategory(record.category || 'General');
    setExpiryDate(record.expiryDate ? record.expiryDate.split('T')[0] : '');
    setIsEditOpen(true);
  };

  const handleUpdateCredential = async (e) => {
    e.preventDefault();
    if (!recordForEdit) return;
    try {
      const payload = {
        siteName,
        username,
        siteUrl,
        notes,
        category,
        expiryDate: expiryDate || null
      };
      if (password) {
        payload.password = password;
      }

      await apiClient.put(`/api/passwords/${recordForEdit._id}`, payload);
      setIsEditOpen(false);
      setRecordForEdit(null);
      clearFormState();
      loadData();
    } catch (err) {
      alert(`Edit credentials error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Wipe this credential item from the local decryptor state permanently? This action is terminal.')) return;
    try {
      await apiClient.delete(`/api/passwords/${id}`);
      loadData();
    } catch (err) {
      alert(`Purge execution fail: ${err.response?.data?.error || err.message}`);
    }
  };

  const decryptCredential = async (id) => {
    if (viewedRecordId === id) {
      setDecryptedText('');
      setViewedRecordId('');
      return;
    }
    setDecryptingId(id);
    try {
      const res = await apiClient.post(`/api/passwords/${id}/decrypt`);
      setDecryptedText(res.data.password);
      setViewedRecordId(id);

      // Auto-conceal timer inside 10 seconds boundary
      setTimeout(() => {
        setDecryptedText((prev) => (viewedRecordId === id ? '' : prev));
        setViewedRecordId((prev) => (prev === id ? '' : prev));
      }, 10000);

    } catch (err) {
      alert(`Decryption challenge failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setDecryptingId('');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 3000);
  };

  return (
    <Layout>
      <div id="password-vault-layout-viewport" className="space-y-8 select-none animate-fade-in relative z-10 text-slate-200">
        
        {/* Banner introduction details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-indigo-650 text-slate-100 rounded-2xl shadow-lg border border-indigo-500/20 max-w-fit mt-0.5">
              <Database className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-indigo-50">Symmetric Vault Cylinder</h1>
              <p className="text-[10px] font-mono text-slate-500 tracking-wider mt-1 uppercase font-semibold">
                Client-encrypted entries compiled under standard high-fidelity guards
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => { clearFormState(); setIsAddOpen(true); }}
              id="vault-new-credentials-trigger"
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl border border-indigo-400/20 flex items-center space-x-2 transition-all shadow-lg"
            >
              <Plus className="h-4.5 w-4.5 text-slate-100" />
              <span>COMMIT ENTRY</span>
            </button>
          </div>
        </div>

        {/* Filters control deck wrapper */}
        <div id="vault-filter-control-deck" className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Column A: Search Input */}
            <div className="md:col-span-6 relative">
              <input
                type="text"
                placeholder="Search matching service tag, domain links, or account names..."
                value={searchQuery}
                aria-label="Vault Search Box"
                onChange={(e) => { setSearchQuery(e.target.value); setViewedRecordId(''); }}
                className="w-full bg-slate-950 border border-slate-850 pl-11 pr-4 py-3 placeholder-slate-650 text-slate-100 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-mono"
              />
              <Search className="h-4.5 w-4.5 text-slate-600 absolute top-3.5 left-4" />
            </div>

            {/* Column B: Selected Category Filter dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setViewedRecordId(''); }}
                  aria-label="Vault Category Selector"
                  className="w-full bg-slate-950 border border-slate-850 text-slate-300 font-mono text-[11px] px-3.5 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all uppercase font-semibold cursor-pointer appearance-none"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c === 'All' ? 'ANY CATEGORY (ALL)' : `${c.toUpperCase()} GROUP`}</option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-500 absolute top-3.5 right-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Column C: Dynamic strength filter */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedStrength}
                  onChange={(e) => { setSelectedStrength(e.target.value); setViewedRecordId(''); }}
                  aria-label="Vault Password Strength Filter"
                  className="w-full bg-slate-950 border border-slate-850 text-slate-300 font-mono text-[11px] px-3.5 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all uppercase font-semibold cursor-pointer appearance-none"
                >
                  {strengthLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl === 'All' ? 'ANY STRENGTH (ALL)' : `${lvl.toUpperCase()} THRESHOLD`}</option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-500 absolute top-3.5 right-3.5 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Quick Stats overview of filters */}
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-850/60 pt-3">
            <span className="uppercase">Safe Filter Results:</span>
            <span>FOUND {passwords.length} CREDENTIAL ENTRIES MATCHING DESIGN FILTERS</span>
          </div>
        </div>

        {/* Directory details grid/list layout */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-slate-500 flex items-center justify-center space-x-2.5 uppercase tracking-widest">
            <RefreshCw className="h-4.5 w-4.5 animate-spin text-indigo-400" />
            <span>Resolving Cipher Directory Structures...</span>
          </div>
        ) : passwords.length === 0 ? (
          <div className="bg-slate-900 border border-slate-850 p-16 text-center rounded-3xl" id="vault-empty-result-card">
            <Info className="h-10 w-10 text-slate-705 mx-auto mb-3.5" />
            <h3 className="text-slate-300 font-bold text-sm tracking-wide">Dynamic Safe is Unoccupied</h3>
            <p className="text-[11px] text-slate-505 font-mono uppercase mt-1 tracking-widest leading-relaxed max-w-md mx-auto">
              Correct matching descriptors were not detected under current category or search queries. Select another query param.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="vault-items-grid">
            {passwords.map((item) => {
              const isCurrentViewed = viewedRecordId === item._id;
              const hasExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
              
              return (
                <div 
                  key={item._id}
                  id={`vault-card-instance-${item._id}`}
                  className="bg-slate-900 border border-slate-850 p-5 rounded-3xl hover:border-slate-800 transition-all flex flex-col justify-between min-h-[260px] relative hover:shadow-2xl hover:shadow-slate-950/20"
                >
                  <div>
                    {/* Header: Title details */}
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="truncate">
                        <h3 className="font-extrabold text-sm text-slate-50 truncate leading-tight">{item.siteName}</h3>
                        <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-400 block uppercase mt-1">{item.category}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-full border uppercase ${
                        item.passwordStrength === 'Excellent' ? 'bg-indigo-500/10 text-indigo-450 border-indigo-500/20' :
                        item.passwordStrength === 'Strong' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' :
                        item.passwordStrength === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-450 border-rose-500/20'
                      }`}>
                        {item.passwordStrength || 'WEAK'}
                      </span>
                    </div>

                    {/* Expiration Banner if present */}
                    {item.expiryDate && (
                      <div className={`mt-2 p-1.5 px-3 rounded-lg flex items-center justify-between border text-[9px] font-mono uppercase tracking-wider ${
                        hasExpired 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                          : 'bg-slate-950 border-slate-850 text-slate-450'
                      }`}>
                        <span className="font-bold flex items-center space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>EXP DATE:</span>
                        </span>
                        <span>{new Date(item.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Meta parameter specifications listed */}
                    <div className="space-y-2 mt-4 font-mono text-[11px] border-t border-slate-850/50 pt-3">
                      
                      {/* Sub-identity row */}
                      <div className="flex justify-between text-slate-500 leading-none py-0.5">
                        <span className="font-bold">USER LOGIN ID:</span>
                        <div className="flex items-center space-x-1.5 truncate max-w-[190px]">
                          <span className="text-slate-205 font-semibold truncate select-all">{item.username}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.username, `${item._id}-user`)}
                            className="text-slate-600 hover:text-slate-300 transition-colors"
                          >
                            {copiedId === `${item._id}-user` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Cipher decoding row */}
                      <div className="flex justify-between text-slate-500 py-0.5">
                        <span className="font-bold">CIPHER PHRASE:</span>
                        <div className="flex items-center space-x-2">
                          {isCurrentViewed ? (
                            <span className="text-emerald-400 font-bold tracking-widest font-mono bg-emerald-950/20 border border-emerald-500/10 px-1 rounded-md select-all">
                              {decryptedText}
                            </span>
                          ) : (
                            <span className="text-slate-650 tracking-widest">••••••••</span>
                          )}

                          <button
                            type="button"
                            className="text-[9px] font-bold underline font-mono text-slate-400 hover:text-slate-205 transition-colors uppercase cursor-pointer"
                            onClick={() => decryptCredential(item._id)}
                            disabled={decryptingId === item._id}
                          >
                            {decryptingId === item._id ? 'DECODING...' : isCurrentViewed ? 'HIDE' : 'DECRYPT'}
                          </button>

                          {isCurrentViewed && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(decryptedText, `${item._id}-pass`)}
                              className="text-slate-400 hover:text-slate-100 transition-colors"
                            >
                              {copiedId === `${item._id}-pass` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Domain URL parameters */}
                      {item.siteUrl && (
                        <div className="flex justify-between text-slate-500 text-[10px] items-center">
                          <span className="font-bold">DOM URL LINK:</span>
                          <a
                            href={item.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1 truncate max-w-[170px]"
                          >
                            <span className="truncate">{item.siteUrl}</span>
                            <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                          </a>
                        </div>
                      )}

                    </div>

                    {/* Notes item block */}
                    {item.notes && (
                      <div className="mt-3 bg-slate-950/40 p-2 border border-slate-850/60 rounded-xl">
                        <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">SECURE MEMORANDUM LOG:</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-normal font-sans select-all">{item.notes}</p>
                      </div>
                    )}

                  </div>

                  {/* Vault action tools */}
                  <div className="mt-5 border-t border-slate-850/80 pt-3.5 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 tracking-wider font-mono">ID: {item._id.slice(-8).toUpperCase()}</span>
                    
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditor(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 border border-slate-850 bg-slate-950 rounded-xl transition-all"
                        id={`edit-vault-item-${item._id}`}
                        title="Edit entry metadata"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(item._id)}
                        className="p-1.5 text-rose-450 hover:text-rose-350 bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all"
                        id={`delete-vault-item-${item._id}`}
                        title="Delete permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ==============================================================================
            MODAL SUB-VIEW: VAULT ADD GATE
            ============================================================================== */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative animate-scale-up shadow-2xl">
              
              {/* Header metadata details */}
              <div className="flex justify-between items-start border-b border-slate-855 pb-4 mb-5">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-slate-50">Commit Symmetrical Credential</h2>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-semibold">WRITE NEW DECRYPTION PHRASES INTO STORAGE CYLINDERS</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)} 
                  className="text-slate-505 hover:text-slate-350 bg-slate-910 p-1.5 rounded-xl border border-slate-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCredential} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Service Input */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Service Target / Client Name</label>
                    <input
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                      placeholder="e.g. Amazon Web Services"
                    />
                  </div>

                  {/* Username identity */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Login ID / Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                      placeholder="e.g. admin_operator"
                    />
                  </div>

                  {/* Target URL */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Target Domain URL</label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                      placeholder="https://aws.amazon.com"
                    />
                  </div>

                  {/* Expiry datepicker */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Expiry Gate Reminder</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-405 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Dropdown grouping */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Category Grouping</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono uppercase"
                    >
                      <option value="General">General</option>
                      <option value="Logins">Logins</option>
                      <option value="Financial">Financial</option>
                      <option value="Social">Social</option>
                      <option value="Secure Notes">Secure Notes</option>
                    </select>
                  </div>

                  {/* Notes registry config */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Memo logs / Parameters</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="Optional server description logs..."
                    />
                  </div>

                </div>

                {/* Symmetrical generation module integrated inline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t border-slate-850/60 mt-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Password cipher state</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono select-all font-bold"
                      placeholder="Manual secret input or click apply..."
                    />
                    <PasswordStrengthMeter password={password} />
                  </div>

                  <VaultPasswordGenerator onSelectPassword={(newPwd) => setPassword(newPwd)} />
                </div>

                {/* Action tool CTA list */}
                <div className="flex space-x-3 justify-end pt-4 border-t border-slate-850/40 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2.5 border border-slate-850 bg-slate-955 hover:bg-slate-850 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest border border-indigo-400/20 shadow-md transition-all cursor-pointer"
                  >
                    COMMIT TO VAULT
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ==============================================================================
            MODAL SUB-VIEW: VAULT EDIT GATE
            ============================================================================== */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative animate-scale-up shadow-2xl">
              
              {/* Header details */}
              <div className="flex justify-between items-start border-b border-slate-855 pb-4 mb-5">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-slate-50">Revise Storage Specs</h2>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-semibold">MODIFY ACTIVE SYMMETRICAL METADATA PROFILES</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditOpen(false)} 
                  className="text-slate-505 hover:text-slate-350 bg-slate-910 p-1.5 rounded-xl border border-slate-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateCredential} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Service Label */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Service Target / client name</label>
                    <input
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Registered Identity username */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Login ID / Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Target Domain URL</label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Expiration datepicker */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Expiry reminder Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-400 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Dropdown category */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Category Grouping</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono uppercase"
                    >
                      <option value="General">General</option>
                      <option value="Logins">Logins</option>
                      <option value="Financial">Financial</option>
                      <option value="Social">Social</option>
                      <option value="Secure Notes">Secure Notes</option>
                    </select>
                  </div>

                  {/* Notes element */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Memo logs / Parameters</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 transition-all font-sans"
                    />
                  </div>

                </div>

                {/* Symmetrical generation integrated inline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t border-slate-850/60 mt-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">
                      Change Target cipher (Leave blank to preserve)
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-655 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono select-all"
                      placeholder="Leave completely empty to preserve ciphers..."
                    />
                    <PasswordStrengthMeter password={password} />
                  </div>

                  <VaultPasswordGenerator onSelectPassword={(newPwd) => setPassword(newPwd)} />
                </div>

                {/* Action CTA list */}
                <div className="flex space-x-3 justify-end pt-4 border-t border-slate-850/40 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2.5 border border-slate-850 bg-slate-955 hover:bg-slate-850 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest border border-indigo-400/20 shadow-md transition-all cursor-pointer"
                  >
                    COMMIT REVISIONS
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
