/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 22: frontend/src/components/Layout.jsx
 * Reusable layout wrapper containing the global persistent Navbar,
 * consistent main sizing containers, responsive scroll guards,
 * and high-fidelity crypto-accents in the page footer.
 */

import React from 'react';
import Navbar from './Navbar';
import { ShieldCheck, Info, Cpu } from 'lucide-react';

export default function Layout({ children }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200" id="app-layout-shell">
      {/* Persistent top-sticky navigation toolbar */}
      <Navbar />

      {/* Primary viewport container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10" id="main-content-layout">
        {children}
      </main>

      {/* Decorative High-Contrast Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-6 text-xs text-slate-500 font-mono select-none" id="global-layout-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500/80" />
            <span>AES-256 Symmetrical Cryptographic Shield Enabled</span>
          </div>

          <div className="flex items-center space-x-1">
            <Cpu className="h-3.5 w-3.5 text-slate-600 animate-pulse" />
            <span>SHA-256 INTEGRITY VALIDATION SECURED</span>
          </div>

          <div>
            <span>&copy; {currentYear} SECUREVAULT. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
