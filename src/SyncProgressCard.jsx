import React, { useState, useEffect } from 'react';
import { triggerDeepSync, getJobStatus } from '../../services/api';
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

const SyncProgressCard = () => {
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    if (jobId && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const response = await getJobStatus(jobId);
          setJobStatus(response.data);
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            setJobId(null); // Stop polling
          }
        } catch (err) {
          console.error('Failed to get job status:', err);
          setError('Could not fetch sync status.');
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const handleSync = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await triggerDeepSync('leetcode');
      setJobId(response.data.job_id);
      setJobStatus(response.data);
    } catch (err) {
      setError(formatError(err, 'Failed to start sync process.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Problem Syncing & Job Progress</h3>
      {!jobStatus || jobStatus.status === 'completed' || jobStatus.status === 'failed' ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Click the button to perform a deep sync of your solved problems from linked platforms.
          </p>
          <button onClick={handleSync} disabled={isLoading} className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center">
            {isLoading ? <LoadingSpinner color="text-white" /> : 'Trigger Deep Sync'}
          </button>
          {jobStatus?.status === 'completed' && <p className="text-green-500 mt-4">Sync completed successfully!</p>}
          {jobStatus?.status === 'failed' && <p className="text-red-500 mt-4">Sync failed. Please try again.</p>}
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-gray-700">Syncing in progress...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${jobStatus.progress || 0}%` }}></div>
          </div>
          <div className="text-xs text-gray-500 space-y-1 mt-4">
            <p>Status: <span className="font-mono bg-gray-200 px-1 rounded">{jobStatus.status}</span></p>
            <p>Total Solved Found: {jobStatus.meta?.total_solved || 0}</p>
            <p>Deeply Evaluated By AI: {jobStatus.meta?.processed || 0}</p>
            <p>Added to Vector Database: {jobStatus.meta?.added_to_db || 0}</p>
          </div>
          <div className="mt-4 p-2 bg-gray-900 text-white rounded-md font-mono text-xs h-24 overflow-y-auto">
            <p>{jobStatus.log || 'Waiting for logs...'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncProgressCard;