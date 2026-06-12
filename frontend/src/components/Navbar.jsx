/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 21: frontend/src/components/Navbar.jsx
 * Professional, high-fidelity responsive navigation bar.
 * Implements:
 * - Collapsible mobile layouts with smooth toggle states
 * - Secure connection/cryptographic health visualizers
 * - User session quick action menus and logout gates
 * - Responsive branding with subtle neon visual accents
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Lock, 
  Unlock, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Activity, 
  ChevronDown, 
  Terminal 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navigationItems = [
    { name: 'Credentials Hub', path: '/dashboard', icon: Shield },
    { name: 'Security Audit', path: '/security', icon: Lock }
  ];

  const handleLogoutAction = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-colors duration-350">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Section 1: Logo & Branding */}
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="bg-indigo-600 group-hover:bg-indigo-500 p-2 rounded-xl text-white transition-all duration-300 shadow-md shadow-indigo-600/20 border border-indigo-400/20">
                <Lock className="h-5 w-5" id="nav-logo-icon" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-slate-100 text-sm md:text-base leading-none">
                  SECUREVAULT
                </span>
                <span className="text-[10px] text-indigo-400 font-mono font-medium tracking-widest mt-0.5">
                  AES-256 SAFE
                </span>
              </div>
            </Link>
          </div>

          {/* Section 2: Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono tracking-wider font-semibold uppercase transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Section 3: Right Controls & Profile */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Cryptographic Trust Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                TRUSTED
              </span>
            </div>

            {/* Profile Menu Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                id="nav-profile-dropdown-btn"
                className="flex items-center space-x-2.5 bg-slate-950 hover:bg-slate-850 p-2 rounded-xl border border-slate-800 text-slate-300 hover:text-slate-100 transition-all font-mono text-xs font-semibold"
              >
                <div className="h-6 w-6 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                  <User className="h-4 w-4" />
                </div>
                <span>{user?.name || 'Operator'}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown List */}
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-20 font-sans">
                    <div className="px-4 py-2 border-b border-slate-800 mb-1">
                      <span className="block text-xs text-slate-500 font-mono tracking-wider uppercase">IDENTITY PHRASE</span>
                      <span className="block font-semibold text-sm text-slate-200 truncate">{user?.name}</span>
                      <span className="block text-xs text-slate-500 truncate mt-0.5">{user?.email}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setDropdownOpen(false); navigate('/security'); }}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-mono text-slate-350 hover:text-slate-100 hover:bg-slate-800 transition-colors text-left"
                    >
                      <Activity className="h-4 w-4 text-indigo-400" />
                      <span>HEALTH & LOGS</span>
                    </button>

                    <div className="border-t border-slate-850 my-1" />

                    <button
                      type="button"
                      onClick={handleLogoutAction}
                      id="nav-logout-btn"
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-mono text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>CLOSE CONTAINER</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Mobile Collapse Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 focus:outline-none transition-colors border border-transparent hover:border-slate-700/50"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 py-3 px-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-mono tracking-wider font-semibold uppercase transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-450 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="border-t border-slate-800 my-2 pt-2" />

          {/* User Information in Mobile Mode */}
          <div className="flex items-center space-x-3 px-4 py-3 bg-slate-950 rounded-xl border border-slate-850 mb-2">
            <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
              <User className="h-4 w-4" />
            </div>
            <div className="truncate flex-1">
              <span className="font-semibold text-xs text-slate-300 block truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 truncate block mt-0.5">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={() => { setMobileOpen(false); handleLogoutAction(); }}
            className="w-full flex items-center justify-center space-x-2 py-3 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all font-mono text-xs font-semibold"
          >
            <LogOut className="h-4 w-4" />
            <span>CLOSE CONTAINER</span>
          </button>
        </div>
      )}
    </nav>
  );
}
