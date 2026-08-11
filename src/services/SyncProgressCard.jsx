import React, { useState, useEffect, useRef } from 'react';
import { triggerDeepSync, getJobStatus } from './api';
import LoadingSpinner from '../components/Auth/LoadingSpinner';

// Helper to safely format API and validation errors
const formatError = (err, fallback = 'An unexpected error occurred.') => {
  // Handle 429 Resource Exhausted specifically
  if (err?.response?.status === 429 || (typeof err?.response?.data?.detail === 'string' && err.response.data.detail.includes('429 Resource exhausted'))) {
    return 'The AI service is currently busy. Please try again in a few moments.';
  }

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

const SyncProgressCard = () => {
  // Initialize jobId from localStorage
  const [jobId, setJobId] = useState(() => localStorage.getItem('syncJobId') || null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const pollTimeoutId = useRef(null);
  const attempts = useRef(0);

  // Effect to fetch initial job status if jobId exists on mount
  useEffect(() => {
    const fetchInitialJobStatus = async () => {
      if (jobId) {
        try {
          const response = await getJobStatus(jobId);
          setJobStatus(response.data);
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            setJobId(null);
            localStorage.removeItem('syncJobId');
          }
        } catch (err) {
          console.error('Failed to fetch initial job status:', err);
          setError('Could not fetch previous sync status.');
          setJobId(null); // Clear invalid jobId
          localStorage.removeItem('syncJobId');
        }
      }
    };
    fetchInitialJobStatus();
  }, []); // Run only once on mount

  useEffect(() => {
    const maxAttempts = 30;
    const baseDelay = 3000; // 3 seconds
    const maxDelay = 30000; // 30 seconds

    const poll = async () => {
      try {
        const response = await getJobStatus(jobId);
        setJobStatus(response.data);

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          setJobId(null); // Stop polling
          localStorage.removeItem('syncJobId');
        } else if (attempts.current < maxAttempts) {
          attempts.current++;
          const delay = Math.min(baseDelay * Math.pow(2, attempts.current), maxDelay);
          pollTimeoutId.current = setTimeout(poll, delay);
        } else {
          setError('Sync process timed out. Please try again.');
          setJobId(null);
          localStorage.removeItem('syncJobId');
        }
      } catch (err) {
        // If getJobStatus fails (e.g. 404), stop polling.
        console.error('Failed to get job status:', err);
        setError('Could not fetch sync status. The job may have expired.');
        setJobId(null); // Stop polling
        localStorage.removeItem('syncJobId');
      }
    };

    if (jobId) {
      // Start polling immediately, then use exponential backoff.
      attempts.current = 0;
      poll();
    }

    return () => {
      if (pollTimeoutId.current) {
        clearTimeout(pollTimeoutId.current);
      }
    };
  }, [jobId]);

  const handleSync = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await triggerDeepSync('leetcode');
      const newJobId = response.data.job_id;
      setJobId(newJobId);
      localStorage.setItem('syncJobId', newJobId); // Persist jobId
      setJobStatus(response.data);
    } catch (err) {
      setError(formatError(err, 'Failed to start sync process.'));
      localStorage.removeItem('syncJobId'); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors duration-300">
      
      {/* Header telemetry area */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Problem Syncing & AI Ingestion</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Rebuild your dynamic knowledge graph from completed code submissions.</p>
        </div>
      </div>

      {!jobStatus || jobStatus.status === 'completed' || jobStatus.status === 'failed' ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed font-normal tracking-wide antialiased">
            Scan your linked external profiles. The curation engine parses discovered solved problems, filters algorithmic duplicates, and stores unique mental models in your vector graph space.
          </p>
          
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-400 dark:disabled:bg-emerald-900/50 p-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <LoadingSpinner color="text-white" />
                <span>Initializing Telemetry Scan...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Trigger Deep Sync</span>
              </span>
            )}
          </button>

          {jobStatus?.status === 'completed' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 flex items-center space-x-3 text-emerald-800 dark:text-emerald-400">
              <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21a3.745 3.745 0 01-3.068-1.593 3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12z" />
              </svg>
              <span className="text-sm font-semibold">Deep sync process completed successfully!</span>
            </div>
          )}

          {jobStatus?.status === 'failed' && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 flex items-center space-x-3 text-rose-750 dark:text-rose-400">
              <svg className="h-5 w-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-sm font-semibold">Ingestion sync failed. Please attempt a re-run.</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 flex items-center space-x-3 text-rose-750 dark:text-rose-400">
              <svg className="h-5 w-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Sync Status</span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 ring-1 ring-inset ring-indigo-650/10 animate-pulse">
              {jobStatus.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Ingestion Scan</span>
              <span className="text-indigo-600 dark:text-indigo-400">{jobStatus.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${jobStatus.progress || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Sync Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-4 text-center">
              <p className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Solved</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{jobStatus.meta?.total_solved || 0}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-4 text-center">
              <p className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">AI Evaluated</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{jobStatus.meta?.processed || 0}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-4 text-center">
              <p className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ingested to DB</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{jobStatus.meta?.added_to_db || 0}</p>
            </div>
          </div>

          {/* Live Terminal Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xxs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider antialiased">
              <span>Terminal Logs</span>
              <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
            <div className="p-4 bg-slate-950 text-emerald-400 border border-slate-850 rounded-xl font-mono text-xs h-28 overflow-y-auto shadow-inner leading-relaxed">
              <p className="whitespace-pre-wrap">{jobStatus.log || 'Awaiting synchronization telemetry...'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncProgressCard;