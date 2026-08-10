import React, { useState, useEffect } from 'react';
import { linkExternalAccount, getCurrentUser } from '../../services/api';
import { ShieldCheckIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../Auth/LoadingSpinner';

// Helper to safely format API and validation errors
const formatError = (err, fallback = 'An unexpected error occurred.') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(item => {
      if (item && typeof item === 'object') {
        const path = Array.isArray(item.loc) ? item.loc.filter(l => l !== 'body').join('.') : '';
        return `${path ? path + ': ' : ''}${item.msg || 'Validation error'}`;
      }
      return String(item);
    }).join(' | ');
  }
  return typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
};

const PlatformLinkingCard = () => {
  const [leetcodeSession, setLeetcodeSession] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkedAccount, setLinkedAccount] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await getCurrentUser();
      const leetcodeAccount = response.data.external_accounts.find(acc => acc.provider === 'leetcode');
      if (leetcodeAccount) {
        setLinkedAccount(leetcodeAccount);
      }
    } catch (err) {
      console.error("Failed to fetch user's external accounts", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await linkExternalAccount('leetcode', leetcodeSession);
      setSuccess('Successfully linked your LeetCode account!');
      setLeetcodeSession('');
      await fetchUser(); // Refresh user data
    } catch (err) {
      setError(formatError(err, 'An unexpected error occurred.'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (linkedAccount) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-300">
        {/* Header Area */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Platform Connections</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your connected competitive programming accounts.</p>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-sm font-semibold antialiased">
                LeetCode Account Linked: <span className="font-bold underline decoration-indigo-500 decoration-2">{linkedAccount.username}</span>
              </p>
            </div>
            <div className="flex items-center pl-3 shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-300">
      {/* Header Area */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.75" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.81 15.312a4.5 4.5 0 01-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.75" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Link Your LeetCode Account</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Connect to fetch your solved problems timeline securely.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="leetcode_session" className="flex items-center text-sm font-semibold text-slate-750 dark:text-slate-300">
            <span>LeetCode Session Cookie</span>
            <span className="group relative inline-block ml-1.5">
              <InformationCircleIcon className="h-4 w-4 text-slate-400 hover:text-slate-500 cursor-pointer" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-950 text-white text-xs rounded-xl shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed font-normal antialiased">
                Find this in your browser's developer tools (Application &gt; Cookies &gt; leetcode.com &gt; LEETCODE_SESSION).
              </span>
            </span>
          </label>
          <input 
            type="password" 
            id="leetcode_session" 
            value={leetcodeSession} 
            onChange={(e) => setLeetcodeSession(e.target.value)} 
            className="block w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 transition-colors duration-200" 
            placeholder="Paste LEETCODE_SESSION value here"
            required 
          />
        </div>

        <div className="flex items-start bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-xs leading-relaxed font-medium antialiased">
          <ShieldCheckIcon className="h-5 w-5 mr-2.5 text-amber-600 dark:text-amber-500 shrink-0" />
          Your session cookie is heavily encrypted using AES-256 (Fernet) on our backend before database storage.
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-750 dark:text-rose-450 p-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-3 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900/50 p-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
        >
          {isLoading ? <LoadingSpinner color="text-white" /> : 'Link Account'}
        </button>
      </form>
    </div>
  );
};

export default PlatformLinkingCard;