/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 28: frontend/src/pages/Security.jsx
 * Professional, high-fidelity security auditing and monitoring workspace.
 * Features:
 * - Dynamic security health gauges and distribution progress bars
 * - Categorized Alerts (Expired, Expiring Soon, Breached, Weak ciphers)
 * - Cryptographic Security Audit Log trace pipeline (severity levels, filters)
 * - Active Session Authentication history logs
 * - High-integrity decrypted data exporter cylinder
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Layout from '../components/Layout';
import {
  Shield,
  AlertCircle,
  AlertTriangle,
  Clock,
  Download,
  Terminal,
  Globe,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Calendar,
  Check,
  X,
  FileText,
  ArrowRight
} from 'lucide-react';

export default function Security() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'logs' | 'sessions' | 'export'

  // Dynamic States
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ expired: [], expiringSoon: [], breached: [], weak: [] });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search State
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logSeverityFilter, setLogSeverityFilter] = useState('All'); // 'All' | 'Info' | 'Warning' | 'Critical'

  // Exporter progress indicator
  const [exporting, setExporting] = useState(false);
  const [exportWarningAccepted, setExportWarningAccepted] = useState(false);

  const fetchSecurityData = async () => {
    try {
      setRefreshing(true);
      
      // 1. Fetch Dynamic Security Audit Statistics
      const statsRes = await apiClient.get('/api/security/stats');
      setStats(statsRes.data.data);

      // 2. Fetch Active Critical Alerts
      const alertsRes = await apiClient.get('/api/security/alerts');
      setAlerts(alertsRes.data.data);

      // 3. Fetch Full Cryptographic Logging History Trace
      const logsRes = await apiClient.get('/api/security/logs');
      setSecurityLogs(logsRes.data.data);

      // 4. Fetch Authentication System Session Logs
      const sessionsRes = await apiClient.get('/api/security/login-history');
      setLoginHistory(sessionsRes.data.data);

    } catch (err) {
      console.error('Failed compiling security center dataset:', err.message);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleRunExport = async () => {
    if (!exportWarningAccepted) {
      alert('Must consent to and confirm key parameters for secure backups before exporting.');
      return;
    }

    try {
      setExporting(true);
      const res = await apiClient.post('/api/security/export');
      
      const payload = res.data.data;
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(payload, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `SECUREVAULT_ENCRYPTED_BACKUP_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      alert('Credentials backup archive download completed successfully. Keep this file structurally secure.');
      setExportWarningAccepted(false);
      fetchSecurityData(); // Refresh the logging stream to verify the 'VAULT_EXPORTED' trace
    } catch (err) {
      alert(`Export Pipeline Failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Pre-configured filter algorithm for cryptographic logs
  const filteredLogs = securityLogs.filter((log) => {
    const matchesSeverity = logSeverityFilter === 'All' || log.severity === logSeverityFilter;
    const matchesSearch = 
      log.description.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.eventType.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.ipAddress.includes(logSearchQuery);
    return matchesSeverity && matchesSearch;
  });

  return (
    <Layout>
      <div id="security-control-center-viewport" className="space-y-8 animate-fade-in relative z-10 text-slate-200">
        
        {/* Top Banner introducing layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-indigo-650 text-slate-100 rounded-2xl shadow-lg border border-indigo-500/20 max-w-fit mt-0.5">
              <Shield className="h-5.5 w-5.5 text-slate-100" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-indigo-50">Security & Symmetrical Logs Audits</h1>
              <p className="text-[10px] font-mono text-slate-500 tracking-wider mt-1 uppercase font-semibold">
                Monitor system threats, authentication session lifecycles, and credential health scores
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchSecurityData}
              disabled={refreshing}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 text-slate-400 hover:text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl border border-slate-800 flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{refreshing ? 'ALIGNED...' : 'REFRESH STREAM'}</span>
            </button>
          </div>
        </div>

        {/* Global Loading state placeholder */}
        {loading ? (
          <div className="py-24 text-center font-mono text-xs text-slate-500 flex items-center justify-center space-x-2.5 uppercase tracking-widest">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
            <span>Resolving Secure Cryptographic Log Databases...</span>
          </div>
        ) : (
          <>
            {/* Dynamic Security Health and Dashboard scorecards cards */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="security-health-overview-bento">
                
                {/* Visual scorecard gauge container */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                    <Shield className="h-44 w-44" />
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">SECURE METRIC</span>
                    <h2 className="text-xs font-bold font-mono text-slate-400 uppercase mt-1">VAULT HEALTH INDEX STATUS</h2>
                  </div>

                  <div className="my-6 flex items-baseline space-x-2">
                    <span className={`text-5xl md:text-6xl font-extrabold font-mono tracking-tight ${
                      stats.healthScore >= 90 ? 'text-emerald-400' :
                      stats.healthScore >= 75 ? 'text-indigo-400' :
                      stats.healthScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {stats.healthScore}%
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono uppercase font-bold">
                      {stats.healthScore >= 90 ? 'ARMORED' :
                       stats.healthScore >= 70 ? 'STABLE' : 'ACTION SUGGESTED'}
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] font-mono text-slate-400 border-t border-slate-850/60 pt-4 leading-normal">
                    <p className="flex items-center space-x-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${stats.mfaEnabled ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
                      <span>MULTIPLE-FACTOR AUTHENTICATION: {stats.mfaEnabled ? 'ARMORED (ACTIVE)' : 'UNCONFIGURED (WARNING)'}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${stats.breachedCount === 0 ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                      <span>IDENTIFIED BREACH FLAGGINGS: {stats.breachedCount} EXPOSURES</span>
                    </p>
                  </div>
                </div>

                {/* Strength level breakdowns container */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">LOG RANGE CYLINDER</span>
                    <h2 className="text-xs font-bold font-mono text-slate-400 uppercase mt-1">PASSWORD STRENGTH GRADE DYNAMIC BARS</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 my-4 font-mono text-[11px]">
                    
                    {/* Level A: Excellent */}
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>EXCELLENT (ARMORED)</span>
                        <span className="text-indigo-400 font-bold">{stats.strengths.excellent} OF {stats.totalPasswords}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all" 
                          style={{ width: `${stats.totalPasswords ? (stats.strengths.excellent / stats.totalPasswords) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Level B: Strong */}
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>STRONG (SECURE)</span>
                        <span className="text-emerald-400 font-bold">{stats.strengths.strong} OF {stats.totalPasswords}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all" 
                          style={{ width: `${stats.totalPasswords ? (stats.strengths.strong / stats.totalPasswords) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Level C: Medium */}
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>MEDIUM (MODERATE)</span>
                        <span className="text-amber-400 font-bold">{stats.strengths.medium} OF {stats.totalPasswords}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all" 
                          style={{ width: `${stats.totalPasswords ? (stats.strengths.medium / stats.totalPasswords) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Level D: Weak */}
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>WEAK (CRITICAL DANGER)</span>
                        <span className="text-rose-400 font-bold">{stats.strengths.weak} OF {stats.totalPasswords}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all" 
                          style={{ width: `${stats.totalPasswords ? (stats.strengths.weak / stats.totalPasswords) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] text-slate-500 font-mono uppercase bg-slate-950/40 p-2 border border-slate-850/50 rounded-xl leading-relaxed mt-2 flex items-center space-x-2">
                    <AlertCircle className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                    <span>ENCRYPTED REVISIONS TRACES ARE RECORDED AND VISIBLE BELOW</span>
                  </div>
                </div>

              </div>
            )}

            {/* Core Workspace tab headers */}
            <div className="flex border-b border-slate-850 overflow-x-auto scrollbar-none" id="security-tabs-buttons">
              
              {/* Tab 1: Alerts */}
              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`py-3 px-5 text-[11px] font-mono uppercase font-bold tracking-wider relative transition-colors cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'alerts' ? 'text-indigo-400' : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <span>RISK ALERTS CENTER</span>
                {alerts.expired.length + alerts.breached.length + alerts.weak.length > 0 && (
                  <span className="bg-rose-500/15 border border-rose-500/30 text-rose-450 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {alerts.expired.length + alerts.breached.length + alerts.weak.length}
                  </span>
                )}
                {activeTab === 'alerts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>

              {/* Tab 2: Logs */}
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`py-3 px-5 text-[11px] font-mono uppercase font-bold tracking-wider relative transition-colors cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'logs' ? 'text-indigo-400' : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <span>AUDIT TRAIL LOGS</span>
                <span className="bg-slate-950 text-[9px] px-1.5 py-0.5 rounded-full border border-slate-850 text-slate-500 font-bold">
                  {filteredLogs.length}
                </span>
                {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>

              {/* Tab 3: Sessions */}
              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`py-3 px-5 text-[11px] font-mono uppercase font-bold tracking-wider relative transition-colors cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'sessions' ? 'text-indigo-400' : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <span>SESSION HISTORIES</span>
                {activeTab === 'sessions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>

              {/* Tab 4: Exporter */}
              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`py-3 px-5 text-[11px] font-mono uppercase font-bold tracking-wider relative transition-colors cursor-pointer flex items-center space-x-2 ${
                  activeTab === 'export' ? 'text-indigo-400' : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <span>EXPORT BACKUP</span>
                {activeTab === 'export' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>

            </div>

            {/* Content panel switchboard */}
            <div className="min-h-[300px]" id="security-selected-content-panel">
              
              {/* PANEL 1: RISK ALERTS CENTER */}
              {activeTab === 'alerts' && (
                <div className="space-y-6" id="panel-security-alerts">
                  
                  {/* Warning summary headers */}
                  {alerts.expired.length === 0 && alerts.breached.length === 0 && alerts.weak.length === 0 && (
                    <div className="bg-slate-900 border border-slate-850 p-12 text-center rounded-3xl">
                      <Check className="h-9 w-9 text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 rounded-full p-1.5 mx-auto mb-3" />
                      <h3 className="text-slate-200 font-bold text-sm">Clear Security Diagnostic Result</h3>
                      <p className="text-[11px] text-slate-505 font-mono uppercase mt-1 tracking-widest leading-relaxed max-w-sm mx-auto">
                        No critical vulnerabilities, breached exposures, or expired symmetrical credentials detected inside the vault.
                      </p>
                    </div>
                  )}

                  {/* Section A: Breached alerts list */}
                  {alerts.breached.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-550/10 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2 text-rose-400 font-bold font-mono text-xs">
                        <AlertCircle className="h-4.5 w-4.5 text-rose-400 animate-pulse" />
                        <span className="uppercase tracking-wider">Identified Exposure / Compromised Credentials</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerts.breached.map((item) => (
                          <div key={item.id} className="bg-slate-950 p-4 border border-rose-500/10 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-extrabold text-slate-100">{item.siteName}</p>
                              <p className="text-[10px] font-mono text-slate-500 lowercase mt-0.5">{item.username}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate('/vault')}
                              className="text-[10px] font-mono font-bold uppercase py-1 px-3 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20 active:bg-rose-500/25 rounded-md flex items-center space-x-1.5 transition-colors"
                            >
                              <span>ROTATE KEY</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: Expired Alerts */}
                  {alerts.expired.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-550/10 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2 text-amber-500 font-bold font-mono text-xs">
                        <Calendar className="h-4.5 w-4.5 text-amber-500" />
                        <span className="uppercase tracking-wider">Critical Warning: Expired Credentials</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerts.expired.map((item) => (
                          <div key={item.id} className="bg-slate-950 p-4 border border-amber-500/15 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-extrabold text-slate-100">{item.siteName}</p>
                              <p className="text-[10px] font-mono text-rose-450 lowercase mt-0.5 block">
                                expired {item.daysOverdue} days ago
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate('/vault')}
                              className="text-[10px] font-mono font-bold uppercase py-1 px-3 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 active:bg-amber-500/25 rounded-md flex items-center space-x-1.5 transition-colors"
                            >
                              <span>UPDATE</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section C: Weak pass flag alerts */}
                  {alerts.weak.length > 0 && (
                    <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2 text-slate-400 font-bold font-mono text-xs">
                        <AlertTriangle className="h-4.5 w-4.5 text-indigo-400" />
                        <span className="uppercase tracking-wider">Warning: Sub-optimal Cipher Entropy</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerts.weak.map((item) => (
                          <div key={item.id} className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-extrabold text-slate-100">{item.siteName}</p>
                              <p className="text-[10px] font-mono text-slate-500 lowercase mt-0.5">{item.username}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate('/vault')}
                              className="text-[10px] font-mono font-bold uppercase py-1 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 active:bg-indigo-600/25 rounded-md flex items-center space-x-1.5 transition-colors"
                            >
                              <span>INCREASE ENTROPY</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* PANEL 2: AUDIT TRAIL LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4" id="panel-security-logs">
                  
                  {/* Severity level & search query tools */}
                  <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 border border-slate-855 rounded-2xl">
                    
                    {/* Filter selector */}
                    <div className="flex gap-1 overflow-x-auto scrollbar-none w-full md:w-auto" id="logs-severity-toggles">
                      {['All', 'Info', 'Warning', 'Critical'].map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setLogSeverityFilter(sev)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                            logSeverityFilter === sev
                              ? 'bg-indigo-650 text-slate-50 border-indigo-500 shadow-md shadow-indigo-600/10'
                              : 'bg-slate-950 hover:bg-slate-850 text-slate-450 hover:text-slate-205 border-slate-850/60'
                          }`}
                        >
                          {sev} Trace
                        </button>
                      ))}
                    </div>

                    {/* Log search querying */}
                    <div className="relative w-full md:w-80">
                      <input
                        type="text"
                        placeholder="Filter event actions, descriptors, IP..."
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 placeholder-slate-650 text-slate-100 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-mono"
                      />
                      <Search className="h-4 w-4 text-slate-650 absolute top-3 left-3" />
                    </div>

                  </div>

                  {/* Logs lists tabular/stream representation */}
                  {filteredLogs.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-850 p-12 text-center rounded-3xl">
                      <Terminal className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                      <h3 className="text-slate-300 font-bold text-sm">No Events Identified</h3>
                      <p className="text-[10px] text-slate-505 font-mono uppercase mt-1 tracking-widest">
                        Cryptographic ledger returns no results under design parameters
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left font-mono text-[11px] border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-950 text-slate-500 border-b border-slate-850 uppercase font-bold text-[9px] tracking-wider">
                            <th className="py-3.5 px-4 w-44">TIMESTAMP</th>
                            <th className="py-3.5 px-4 w-36">EVENT CATEGORY</th>
                            <th className="py-3.5 px-4">DESCRIPTION LOG</th>
                            <th className="py-3.5 px-4 w-28 text-center">SEVERITY</th>
                            <th className="py-3.5 px-4 w-32">IP ORIGIN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-855/50">
                          {filteredLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="py-3 px-4 text-slate-450 text-[10px]">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 font-bold text-indigo-400 tracking-wide">
                                {log.eventType}
                              </td>
                              <td className="py-3 px-4 text-slate-300 truncate max-w-[320px]" title={log.description}>
                                {log.description}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase inline-block ${
                                  log.severity === 'Critical' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' :
                                  log.severity === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  'bg-slate-950 text-slate-450 border-slate-850'
                                }`}>
                                  {log.severity}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-450 font-bold">
                                {log.ipAddress}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* PANEL 3: SESSION HISTORIES */}
              {activeTab === 'sessions' && (
                <div className="space-y-4" id="panel-security-sessions">
                  
                  {loginHistory.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-850 p-12 text-center rounded-3xl">
                      <Clock className="h-8 w-8 text-slate-750 mx-auto mb-3" />
                      <h3 className="text-slate-300 font-bold text-sm">No recorded histories found</h3>
                      <p className="text-[11px] text-slate-505 font-mono uppercase mt-1 tracking-widest">
                        Check connection metrics or authentication logs later
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left font-mono text-[11px] border-collapse min-w-[750px]">
                        <thead>
                          <tr className="bg-slate-950 text-slate-500 border-b border-slate-850 uppercase font-bold text-[9px] tracking-wider">
                            <th className="py-3.5 px-4 w-44">ACCESS TIMESTAMP</th>
                            <th className="py-3.5 px-4 w-32">AGENT STATUS</th>
                            <th className="py-3.5 px-4 w-36">IP ORIGIN ADDRESS</th>
                            <th className="py-3.5 px-4">BROWSER METRIC / USER AGENT STRING</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-855/50">
                          {loginHistory.map((session) => (
                            <tr key={session._id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="py-3 px-4 text-slate-450 text-[10px]">
                                {new Date(session.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase inline-block ${
                                  session.status === 'Success' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                                }`}>
                                  {session.status || 'Success'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-bold">
                                {session.ipAddress}
                              </td>
                              <td className="py-3 px-4 text-slate-450 truncate max-w-[340px]" title={session.userAgent}>
                                {session.userAgent || 'SECURE CLIENT HANDSHAKE'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* PANEL 4: EXPORT BACKUP CYLINDER */}
              {activeTab === 'export' && (
                <div className="bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-3xl space-y-6" id="panel-security-export">
                  
                  <div className="flex items-start space-x-4 max-w-2xl">
                    <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex-shrink-0">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                        High-Security Symmetrical Exporter Cylinder
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        You are initiating a raw decryption sequence that compiles your entire vault. 
                        The resulting file will contain **plain-text passwords** without additional mathematical envelopes.
                      </p>
                    </div>
                  </div>

                  {/* Warning terms list */}
                  <div className="bg-slate-950 p-5 border border-slate-855 rounded-2xl max-w-2xl space-y-3.5 font-mono text-[11px] text-slate-450 leading-relaxed">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-500" />
                      <span>SECURE PROTOCOL PARAMETERS INFORCE:</span>
                    </p>
                    <ul className="list-disc list-inside space-y-2 pl-1.5">
                      <li>The export writes a <code className="text-slate-200">VAULT_EXPORTED</code> audit entry identifying your IP footprint.</li>
                      <li>Never transmit or store this resulting backup on public clouds or unencrypted storage discs.</li>
                      <li>The file is configured with the <code className="text-slate-200">.json</code> format extension for compatibility.</li>
                    </ul>
                  </div>

                  {/* Operational trigger inputs checkbox */}
                  <div className="max-w-xl">
                    <label className="flex items-start space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportWarningAccepted}
                        onChange={(e) => setExportWarningAccepted(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer h-4 w-4 mt-0.5"
                      />
                      <span className="font-mono text-[11px] text-slate-300 leading-normal uppercase">
                        I acknowledge the risks of storing plain-text keys and consent to logging IP traces
                      </span>
                    </label>
                  </div>

                  {/* Call to action element trigger */}
                  <div className="pt-4 border-t border-slate-850/60 max-w-2xl flex space-x-3">
                    <button
                      type="button"
                      onClick={handleRunExport}
                      disabled={exporting || !exportWarningAccepted}
                      className="px-6 py-3.5 bg-rose-655 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-655 text-slate-100 font-mono text-xs font-bold uppercase tracking-wider rounded-2xl border border-rose-500/20 active:bg-rose-700 flex items-center space-x-2 transition-all cursor-pointer shadow-lg active:scale-95"
                    >
                      <Download className="h-4.5 w-4.5" />
                      <span>{exporting ? 'EXPORTING...' : 'INITIALIZE ARCHIVE DOWNLOAD'}</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          </>
        )}

      </div>
    </Layout>
  );
}
