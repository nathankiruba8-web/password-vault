/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 26: frontend/src/pages/Dashboard.jsx
 * Professional, high-fidelity security dashboard with integrated symmetrical credentials vault.
 * Handles stats reporting, on-demand decryption, credentials registry CRUD, and automated key generation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import {
  Database,
  Shield,
  AlertCircle,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  X,
  Info,
  Lock,
  ExternalLink,
  Check,
  AlertTriangle
} from 'lucide-react';

// ==============================================================================
// SUB-COMPONENT: INLINE PASSWWORD GENERATOR ENGINE
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
    alert('Random complex key copied successfully.');
  };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 ${inline ? 'w-full' : 'shadow-xl'}`} id="dashboard-pwd-generator-panel">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-indigo-400 font-mono text-[11px] tracking-wider uppercase">AUTO-GENERATE VAULT KEY</h4>
        <button 
          type="button" 
          onClick={triggerGeneration} 
          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-mono font-medium"
        >
          <RefreshCw className="h-3 w-3" />
          <span>REGENERATE</span>
        </button>
      </div>

      <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center justify-between mb-3">
        <span className="font-mono text-xs tracking-widest break-all text-emerald-400 font-bold select-all">{generatedResult}</span>
        <button 
          type="button" 
          onClick={copyResult} 
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      {alertText && <p className="text-rose-400 text-[10px] mb-2 font-mono">{alertText}</p>}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
            <span>KEY STRENGTH INDEX:</span>
            <span className="text-indigo-400 font-bold">{length} CHARS</span>
          </div>
          <input
            type="range"
            min="8"
            max="40"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={() => setUppercase(!uppercase)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0 h-3 w-3"
            />
            <span>A-Z CAPITAL</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={() => setLowercase(!lowercase)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0 h-3 w-3"
            />
            <span>a-z LOWER</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={numbers}
              onChange={() => setNumbers(!numbers)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0 h-3 w-3"
            />
            <span>0-9 NUMBERS</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={symbols}
              onChange={() => setSymbols(!symbols)}
              className="accent-indigo-500 rounded text-slate-900 border-slate-800 focus:ring-0 h-3 w-3"
            />
            <span>SYMBOLS (!%@)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// PRIMARY EXPORT COMPONENT: DASHBOARD
// ==============================================================================
export default function Dashboard() {
  const { logout } = useAuth();
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

  // On-demand Password Decryption view cache & state
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
      // 1. Load active security statistics reports
      const statsResponse = await apiClient.get('/api/security/stats');
      setStats(statsResponse.data.data);

      // 2. Fetch specific password credentials matching searchQuery & active category parameters
      const passUrl = `/api/passwords?q=${encodeURIComponent(searchQuery)}${activeCategory !== 'All' ? `&category=${encodeURIComponent(activeCategory)}` : ''}`;
      const passwordsResponse = await apiClient.get(passUrl);
      setPasswords(passwordsResponse.data.data);
    } catch (err) {
      console.error('Failed retrieving security credentials directory:', err.message);
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
      await apiClient.post('/api/passwords', {
        siteName,
        username,
        password: passwordValue,
        siteUrl,
        notes,
        category,
        expiryDate: expiryDate || null
      });
      
      setIsAddOpen(false);
      resetFormState();
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Vault write failed.';
      alert(`Credentials commit failure: ${msg}`);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setSiteName(record.siteName);
    setUsername(record.username);
    setPasswordValue(''); // Leave blank by default to protect existing cipher
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

      await apiClient.put(`/api/passwords/${editingRecord._id}`, payload);
      
      setIsEditOpen(false);
      setEditingRecord(null);
      resetFormState();
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Edit credentials failed.';
      alert(`Vault updates fail: ${msg}`);
    }
  };

  const handleDeletePassword = async (recordId) => {
    if (!window.confirm('Delete this credentials record permanently from the safety database? This is irreversible.')) return;
    try {
      await apiClient.delete(`/api/passwords/${recordId}`);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Purge action failed.';
      alert(`Credentials deletion mismatch: ${msg}`);
    }
  };

  const decryptOnDemand = async (recordId) => {
    // Toggle state to close decrypted view if already selected
    if (viewedRecordId === recordId) {
      setViewedPassword('');
      setViewedRecordId('');
      return;
    }

    setDecryptingId(recordId);
    try {
      const res = await apiClient.post(`/api/passwords/${recordId}/decrypt`);
      setViewedPassword(res.data.password);
      setViewedRecordId(recordId);

      // Automatically conceal password after 15 seconds to prevent side-channel leaks
      setTimeout(() => {
        setViewedPassword((prev) => (viewedRecordId === recordId ? '' : prev));
        setViewedRecordId((prev) => (prev === recordId ? '' : prev));
      }, 15000);

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Decryption pipeline failure.';
      alert(`Dynamic standard decryption rejected: ${msg}`);
    } finally {
      setDecryptingId('');
    }
  };

  const copyToMemory = (text) => {
    navigator.clipboard.writeText(text);
    alert('Key copied to operating clipboard cache.');
  };

  return (
    <Layout>
      <div id="credentials-dashboard-viewport" className="space-y-8 animate-fade-in relative z-10">
        
        {/* Header Ribbon Overview Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 flex items-center space-x-2.5">
              <span>Credentials Storage Hub</span>
            </h1>
            <p className="text-slate-450 text-xs font-mono tracking-wider mt-1 uppercase">
              AES-256 Symmetric-GCM Protected Password Records Pipeline
            </p>
          </div>
          <button
            type="button"
            onClick={() => { resetFormState(); setIsAddOpen(true); }}
            id="add-new-credential-btn"
            className="flex items-center justify-center space-x-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-slate-100 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/10 transition-all border border-indigo-400/20"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>VAULT NEW CREDENTIALS</span>
          </button>
        </div>

        {/* Dynamic Security Metrics Row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
            
            {/* Stat Item A: Passwords Count */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-450 border border-indigo-500/20">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider block font-bold uppercase">SAFE ENTRIES</span>
                <span className="text-xl font-extrabold text-slate-100 font-mono">{stats.totalPasswords}</span>
              </div>
            </div>

            {/* Stat Item B: Health Score metrics */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${
                stats.healthScore >= 80 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider block font-bold uppercase">HEALTH METRICS INDEX</span>
                <span className={`text-xl font-extrabold font-mono ${
                  stats.healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }`}>{stats.healthScore}%</span>
              </div>
            </div>

            {/* Stat Item C: Active breach alerts */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${
                stats.breachedCount > 0 
                  ? 'bg-rose-500/10 text-rose-450 border-rose-500/20 animate-pulse' 
                  : 'bg-slate-950 text-slate-500 border-slate-855'
              }`}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider block font-bold uppercase">BREACH EXPOSURES</span>
                <span className={`text-xl font-extrabold font-mono ${stats.breachedCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>{stats.breachedCount}</span>
              </div>
            </div>

            {/* Stat Item D: Expiring password alerts */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider block font-bold uppercase">EXPIRING SECONDS (30D)</span>
                <span className="text-xl font-extrabold text-slate-100 font-mono">{stats.expiredOrExpiringCount}</span>
              </div>
            </div>

          </div>
        )}

        {/* Dynamic Category Filtering and Keyword Queries */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-850 rounded-2xl" id="dashboard-directory-controls">
          
          {/* Dynamic Categories tabs scroll */}
          <div className="flex flex-wrap gap-1.5" id="dashboard-categories-container">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => { setActiveCategory(cat); setViewedPassword(''); setViewedRecordId(''); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-650 text-slate-50 border-indigo-500 shadow-md shadow-indigo-600/10'
                    : 'bg-slate-950 hover:bg-slate-850 text-slate-450 hover:text-slate-200 border-slate-850/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Keyword entry element */}
          <div className="relative w-full lg:w-80">
            <input
              type="text"
              placeholder="Search services, usernames, URL keys..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setViewedPassword(''); setViewedRecordId(''); }}
              className="w-full bg-slate-950 border border-slate-850 placeholder-slate-600 text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
            />
            <Search className="h-4 w-4 text-slate-650 absolute top-3 left-3" />
          </div>

        </div>

        {/* Credentials Lists Grid Wrapper */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-slate-500 uppercase tracking-widest flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Decrypting Symmetrical Stream Directory...</span>
          </div>
        ) : passwords.length === 0 ? (
          <div className="bg-slate-900 border border-slate-850 p-12 text-center rounded-3xl" id="empty-vault-placeholder">
            <Info className="h-10 w-10 text-slate-700 mx-auto mb-3.5" />
            <h3 className="text-slate-300 font-bold text-sm tracking-wide">Dynamic Safe Directory is Unoccupied</h3>
            <p className="text-[11px] text-slate-500 font-mono uppercase mt-1 tracking-widest">NO RECORDS MATCH THE ACTIVE FILTER PARAMETERS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="password-cards-grid">
            {passwords.map(item => {
              const isCurrentDecrypted = viewedRecordId === item._id;
              return (
                <div 
                  key={item._id} 
                  className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-slate-700/50 transition-all shadow-xl hover:shadow-2xl relative flex flex-col justify-between min-h-[220px]"
                  id={`credential-card-${item._id}`}
                >
                  
                  {/* Card upper ribbon metadata details */}
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="truncate pr-2">
                        <h3 className="font-extrabold text-sm text-slate-100 truncate tracking-tight">{item.siteName}</h3>
                        <span className="text-[9px] font-mono text-indigo-400 block uppercase mt-0.5 tracking-widest font-bold font-medium">{item.category}</span>
                      </div>
                      
                      {/* Password strength badge representation */}
                      <span className={`text-[9px] font-mono font-bold py-1 px-2.5 rounded-full uppercase tracking-wider border ${
                        item.passwordStrength === 'Excellent' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        item.passwordStrength === 'Strong' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        item.passwordStrength === 'Medium' ? 'bg-amber-500/10 text-amber-550 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.passwordStrength || 'WEAK'}
                      </span>
                    </div>

                    {/* Account entries specs list */}
                    <div className="space-y-2 mt-4 font-mono text-[11px] border-t border-slate-850/50 pt-3">
                      
                      {/* Identity Row */}
                      <div className="flex justify-between text-slate-500">
                        <span className="font-bold">USER LOGIN ID:</span>
                        <span className="text-slate-200 truncate pr-1 text-right max-w-[170px] font-semibold select-all">
                          {item.username}
                        </span>
                      </div>

                      {/* Decryption password row */}
                      <div className="flex justify-between text-slate-500">
                        <span className="font-bold">VAULT CIPHER:</span>
                        <div className="flex items-center space-x-2 font-mono text-[11px]">
                          {isCurrentDecrypted ? (
                            <span className="text-emerald-400 font-bold select-all break-all pr-1 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10">
                              {viewedPassword}
                            </span>
                          ) : (
                            <span className="text-slate-650 block tracking-widest mr-1.5 select-none">••••••••</span>
                          )}
                          <button
                            type="button"
                            onClick={() => decryptOnDemand(item._id)}
                            disabled={decryptingId === item._id}
                            className="text-[9px] text-slate-400 hover:text-slate-100 font-bold transition-all uppercase underline underline-offset-2 decoration-dotted"
                          >
                            {decryptingId === item._id ? 'CIPHERING...' : isCurrentDecrypted ? 'HIDE' : 'DECODE'}
                          </button>
                        </div>
                      </div>

                      {/* Domain target URL row */}
                      {item.siteUrl && (
                        <div className="flex justify-between text-slate-500 text-[10px] truncate leading-tight">
                          <span className="font-bold">DOM TARGET:</span>
                          <a 
                            href={item.siteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-400 hover:text-indigo-350 hover:underline inline-flex items-center space-x-1"
                          >
                            <span className="truncate max-w-[150px]">{item.siteUrl}</span>
                            <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* Security Notes row if exists */}
                      {item.notes && (
                        <div className="text-[10px] text-slate-500 border-t border-slate-850/30 pt-1.5 flex flex-col">
                          <span className="font-bold">SECURE LOG PARAM:</span>
                          <span className="text-slate-400 leading-normal line-clamp-1 mt-0.5 max-w-full font-sans">{item.notes}</span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Card bottom controller row */}
                  <div className="mt-4 border-t border-slate-850/65 pt-3.5 flex justify-between items-center">
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl transition-colors"
                        title="Modify credential records"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePassword(item._id)}
                        className="p-1.5 text-rose-450 hover:text-rose-350 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 rounded-xl transition-colors"
                        title="Purge record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {isCurrentDecrypted && (
                      <button
                        type="button"
                        onClick={() => copyToMemory(viewedPassword)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 active:bg-emerald-500/25 rounded-xl font-mono text-[9px] text-emerald-400 hover:text-emerald-350 font-bold tracking-wider transition-colors uppercase"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        <span>COPY TO CLIPBOARD</span>
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
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative animate-scale-up shadow-2xl">
              
              {/* Top bar header details */}
              <div className="flex justify-between items-start border-b border-slate-855 pb-4 mb-5">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-slate-50">New Vault safe credential</h2>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ENCODE PARAMETERS INTO AES-256 SAFE CYLINDER</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)} 
                  className="text-slate-500 hover:text-slate-350 bg-slate-950 p-1.5 rounded-xl border border-slate-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewPassword} className="space-y-4">
                
                {/* Information inputs grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Service Identity Label */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Service / Identity name</label>
                    <input
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                      placeholder="e.g. Google Cloud, Personal Mail"
                    />
                  </div>

                  {/* Registered Identity username */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Registry User ID / Email</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-655 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                      placeholder="e.g. name@domain.com, registry_id"
                    />
                  </div>

                  {/* Dynamic base domain link routing */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Base Target Domain URL</label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                      placeholder="https://console.cloud.google.com"
                    />
                  </div>

                  {/* Expiration date tracking picker */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Expiry Reminder Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2 text-xs text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Categorizer structure options dropdown */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Category grouping</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    >
                      <option value="General">General</option>
                      <option value="Logins">Logins</option>
                      <option value="Financial">Financial</option>
                      <option value="Social">Social</option>
                      <option value="Secure Notes">Secure Notes</option>
                    </select>
                  </div>

                  {/* Additional diagnostic logging details */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">Security parameters / Description</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      placeholder="Optional details, server pin info..."
                    />
                  </div>

                </div>

                {/* Symmetrical generation module inline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t border-slate-855/60 mt-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Target Secret Password Password</label>
                    <input
                      type="text"
                      required
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono select-all font-bold"
                      placeholder="Manual secret value or auto generate..."
                    />
                  </div>
                  <InteractivePasswordGenerator onGenerateComplete={(pwd) => setPasswordValue(pwd)} inline={true} />
                </div>

                {/* Form CTA Buttons */}
                <div className="flex space-x-3 justify-end pt-4 border-t border-slate-855/40 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2.5 border border-slate-850 bg-slate-950 hover:bg-slate-850 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-50 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest border border-indigo-400/20 shadow-md transition-colors"
                  >
                    COMMIT TO CRYPTO VAULT
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ==============================================================================
            EDIT CREDENTIAL PARAMETERS MODAL SCREEN
            ============================================================================== */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-855 p-6 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative animate-scale-up shadow-2xl">
              
              {/* Header metadata layout */}
              <div className="flex justify-between items-start border-b border-slate-855 pb-4 mb-5">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-slate-50">Edit Vault Registration</h2>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">MODIFY STORAGE PROFILE CONFIGURATION</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditOpen(false)} 
                  className="text-slate-500 hover:text-slate-350 bg-slate-950 p-1.5 rounded-xl border border-slate-850"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditPassword} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Service labels */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Service / Identity NAME</label>
                    <input
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Registered Identity username */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">User account entry / ID</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Service base URLs link */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Service target Web link</label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Expiration warning threshold picker */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Expiry warning date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2 text-xs text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>

                  {/* Category choices */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Category metadata</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                    >
                      <option value="General">General</option>
                      <option value="Logins">Logins</option>
                      <option value="Financial">Financial</option>
                      <option value="Social">Social</option>
                      <option value="Secure Notes">Secure Notes</option>
                    </select>
                  </div>

                  {/* Security notes */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">Internal security parameters</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>

                </div>

                {/* Symmetrical generator trigger block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t border-slate-855/60 mt-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-455 uppercase">
                      Change target secret value (Leave bank to preserve)
                    </label>
                    <input
                      type="text"
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      className="block w-full mt-1.5 bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono select-all"
                      placeholder="Leave completely empty to preserve previous ciphers..."
                    />
                  </div>
                  <InteractivePasswordGenerator onGenerateComplete={(pwd) => setPasswordValue(pwd)} inline={true} />
                </div>

                {/* Action CTA list */}
                <div className="flex space-x-3 justify-end pt-4 border-t border-slate-855/40 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2.5 border border-slate-850 bg-slate-950 hover:bg-slate-850 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-50 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest border border-indigo-400/20 shadow-md transition-colors"
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
