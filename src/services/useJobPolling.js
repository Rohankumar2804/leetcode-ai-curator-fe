import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for polling a job status.
 * @param {string | null} initialJobId - The initial job ID to start polling.
 * @param {function} getJobStatus - The async function to call to get the job status.
 * @param {object} options - Configuration options.
 * @param {string} options.storageKey - The key for session/local storage.
 * @param {function} options.onSuccess - Callback on job completion.
 * @param {function} options.onError - Callback on job failure or error.
 * @param {function} options.formatError - Function to format error messages.
 * @param {string} [options.jobName='Job'] - A name for the job for logging.
 * @param {number} [options.maxAttempts=10] - Maximum polling attempts.
 * @param {number} [options.baseDelay=2000] - Initial delay in ms.
 * @param {number} [options.maxDelay=30000] - Maximum delay in ms.
 * @returns {{jobId: string | null, setJobId: function, isPolling: boolean}}
 */
export function useJobPolling(
  initialJobId,
  getJobStatus,
  {
    storageKey,
    onSuccess,
    onError,
    formatError,
    jobName = 'Job',
    maxAttempts = 10,
    baseDelay = 2000,
    maxDelay = 30000,
  }
) {
  const [jobId, setJobId] = useState(initialJobId);
  const [isPolling, setIsPolling] = useState(!!initialJobId);
  const pollAttempts = useRef(0);

  useEffect(() => {
    if (jobId) {
      console.log(`[${jobName}] Job ID set to: ${jobId}. Storing in sessionStorage and starting to poll.`);
      sessionStorage.setItem(storageKey, jobId);
      setIsPolling(true);
    } else {
      sessionStorage.removeItem(storageKey);
      setIsPolling(false);
    }
  }, [jobId, storageKey]);

  useEffect(() => {
    let pollTimeoutId;

    const poll = async () => {
      if (!jobId) {
        setIsPolling(false);
        return;
      }

      pollAttempts.current++;
      const currentDelay = Math.min(baseDelay * Math.pow(2, pollAttempts.current - 1), maxDelay);

      try {
        const statusResponse = await getJobStatus(jobId);
        const jobData = statusResponse.data;

        if (jobData.status === "completed") {
          console.log(`[${jobName}] Polling complete. Status: completed.`);
          setIsPolling(false);
          setJobId(null);
          onSuccess(jobData);
        } else if (jobData.status === "failed") {
          console.error(`[${jobName}] Polling failed. Status: failed.`);
          throw new Error(jobData.error_message || "Evaluation job failed on the server.");
        } else if (pollAttempts.current < maxAttempts) {
          console.log(`[${jobName}] Polling... Status: ${jobData.status}. Attempt ${pollAttempts.current}/${maxAttempts}. Retrying in ${currentDelay / 1000}s.`);
          pollTimeoutId = setTimeout(poll, currentDelay);
        } else {
          console.error(`[${jobName}] Polling timed out after ${maxAttempts} attempts.`);
          throw new Error("Polling timed out. The task took too long.");
        }
      } catch (err) {
        onError(formatError(err, "Failed to complete the job."));
        setIsPolling(false);
        setJobId(null);
      }
    };

    if (isPolling && jobId) {
      pollAttempts.current = 0;
      poll();
    }

    return () => {
      clearTimeout(pollTimeoutId);
    };
  }, [jobId, isPolling, getJobStatus, onSuccess, onError, formatError, maxAttempts, baseDelay, maxDelay, jobName, storageKey]);

  return { jobId, setJobId, isPolling };
}