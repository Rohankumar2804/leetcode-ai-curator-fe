import React, { useState, useEffect, useCallback } from "react";
import { triggerRecommendations, fetchRecommendations, getRecommendationJobStatus } from './api'; // Import API functions

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

// --- DYNAMIC MOCK DATA ENGINE ---
const INITIAL_RECOMMENDATIONS = [
  {
    id: 1,
    title: "Minimum Window Substring",
    difficulty: "Hard",
    pattern: "Sliding Window",
    type: "ADVANCED_NEXT_STEP",
    advancementBridge: "You already know sliding window for fixed size (like Maximum Sum Subarray), but this problem introduces dynamic size contraction based on character frequency matches.",
    searchQuery: "sliding-window difficulty:hard",
    url: "https://leetcode.com/problems/minimum-window-substring/",
  },
  {
    id: 2,
    title: "House Robber II",
    difficulty: "Medium",
    pattern: "Linear DP",
    type: "GOOD_NEXT_STEP",
    advancementBridge: "You already know standard linear DP state transitions from House Robber I, but this problem introduces circular boundary constraints where the first and last element cannot both be chosen.",
    searchQuery: "dynamic-programming difficulty:medium tag:circular",
    url: "https://leetcode.com/problems/house-robber-ii/",
  },
  {
    id: 3,
    title: "None", // Gracefully triggers the Fallback/Empty State to "Topic Study Recommendation"
    pattern: "Interval DP",
    type: "GOOD_NEXT_STEP",
    advancementBridge: "You have completed standard string DP, but your knowledge graph has a sparse region around nested subproblem intervals.",
    searchQuery: "interval-dp",
    topicSuggestion: "The engine recommends exploring 'Interval DP' next. Focus on understanding how states are constructed from smaller sub-intervals to larger ranges (e.g., chain matrix multiplication).",
  },
  {
    id: 4,
    title: "Daily Temperatures",
    difficulty: "Medium",
    pattern: "Monotonic Stack",
    type: "GOOD_NEXT_STEP",
    advancementBridge: "You already know nested lookup loops, but this problem introduces the monotonic stack pattern to achieve linear O(N) time complexity for next-greater element queries.",
    searchQuery: "stack monotonic-stack difficulty:medium",
    url: "https://leetcode.com/problems/daily-temperatures/",
  }
];

const DEFAULT_STATS = {
  totalSolvedAnalyzed: 0,
  distribution: { easy: 0, medium: 0, hard: 0 },
  averageSolvedDifficulty: "Medium"
};

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [recommendationJobId, setRecommendationJobId] = useState(() => localStorage.getItem('recommendationJobId') || null);
  const [jobJustCompleted, setJobJustCompleted] = useState(false); // Track if a job just finished
  const [attempts, setAttempts] = useState(() => parseInt(localStorage.getItem('recommendationAttempts') || '0', 10));

  // Helper to map and format recommendation fields from backend variations
  const formatRecommendations = (recs) => {
    return (recs || []).map((rec, index) => ({
      id: rec.id || index,
      title: rec.title,
      difficulty: rec.difficulty,
      pattern: rec.core_pattern || rec.pattern || "N/A",
      type: rec.recommendation_type || rec.type || "GOOD_NEXT_STEP",
      advancementBridge: rec.reason_to_solve || rec.advancementBridge || "",
      searchQuery: rec.search_query_hint || rec.searchQuery || "",
      url: rec.problem_url || rec.url || "#",
      topicSuggestion: rec.topicSuggestion || rec.reason_to_solve || ""
    }));
  };

  // Helper to map stats fields from backend variations
  const formatStats = (resultData) => {
    const statsSource = resultData?.payload?.stats || resultData || {};
    const total = statsSource.total_solved_analyzed !== undefined ? statsSource.total_solved_analyzed : (statsSource.totalSolvedAnalyzed || 0);

    let distribution = statsSource.distribution || { easy: 0, medium: 0, hard: 0 };

    // If distribution is not provided by the API, calculate it from the recommendations
    if (!statsSource.distribution && resultData?.recommendations) {
      distribution = resultData.recommendations.reduce((acc, rec) => {
        const diff = rec.difficulty?.toLowerCase();
        if (diff && acc.hasOwnProperty(diff)) {
          acc[diff]++;
        }
        return acc;
      }, { easy: 0, medium: 0, hard: 0 });
    }

    return {
      totalSolvedAnalyzed: total,
      distribution: distribution,
      averageSolvedDifficulty: statsSource.average_solved_difficulty || statsSource.averageSolvedDifficulty || "N/A"
    };
  };

  // Helper to map and format evaluation fields from backend variations
  const formatEvaluationResult = (res) => {
    if (!res) return null;
    return {
      decision: res.decision || "SOLVE",
      decisionText: res.decision_text || res.decisionText || (
        res.decision === "SOLVE" ? "Highly Recommended - New mental model required" :
        res.decision === "PARTIAL_SOLVE" ? "Worth Reviewing - Familiar core pattern, but introduces new twists" :
        "Redundant - Identical mathematical invariants. You already know this!"
      ),
      overlapPercentage: res.knowledge_overlap_percentage !== undefined ? res.knowledge_overlap_percentage : (res.overlapPercentage || 0),
      uniquenessScore: res.uniqueness_score !== undefined ? res.uniqueness_score : (res.uniquenessScore || 0),
      confidenceScore: res.confidence_score !== undefined ? res.confidence_score : (res.confidenceScore || 0),
      matchingProblem: {
        title: res.matching_past_problem_title || res.matching_problem?.title || res.matchingProblem?.title || "N/A",
        slug: res.matching_problem?.slug || res.matchingProblem?.slug || "",
        difficulty: res.target_difficulty || res.matching_problem?.difficulty || res.matchingProblem?.difficulty || "Medium",
        link: res.similar_problem_url || res.problem_url || res.matching_problem?.link || res.matching_problem?.problem_url || res.matchingProblem?.link || "#"
      },
      keyDifference: res.key_difference_or_lesson || res.key_difference || res.keyDifference || "No details provided."
    };
  };
  // Function to fetch existing recommendations (if no job is active)
  const fetchExistingRecommendations = useCallback(async () => {
    // Optimization: If there are no stats and no job, don't make the initial call
    // that we expect to 404. The user needs to trigger a refresh first.
    if (stats.totalSolvedAnalyzed === 0 && !recommendationJobId) {
      console.log("Skipping initial recommendation fetch as no data has been analyzed yet.");
      return;
    }

    try {
      const response = await fetchRecommendations();
      const resultData = response.data.result || response.data;
      setRecommendations(formatRecommendations(resultData.recommendations));
      setStats(formatStats(resultData));
    } catch (err) {
      console.error("Failed to fetch existing recommendations:", err);
      setError(formatError(err, "Failed to load existing recommendations."));
    }
  }, [stats.totalSolvedAnalyzed, recommendationJobId]);

  // Effect to manage polling for recommendation jobs
  useEffect(() => {
    let timeoutId;
    const maxAttempts = 10;
    const baseDelay = 2000;
    const maxDelay = 30000;

    const pollJobStatus = async (jobIdToPoll) => {
      const currentAttempt = parseInt(localStorage.getItem('recommendationAttempts') || '0', 10) + 1;
      setAttempts(prev => prev + 1);
      localStorage.setItem('recommendationAttempts', String(currentAttempt));

      const currentDelay = Math.min(baseDelay * Math.pow(2, currentAttempt - 1), maxDelay);
      setStatusMessage(`Generating personalized recommendations... (Attempt ${currentAttempt}/${maxAttempts}. Re-checking in ${currentDelay / 1000}s)`);

      if (currentAttempt > maxAttempts) {
        setError("Polling timed out. Recommendation generation took too long.");
        setIsRefreshing(false);
        setStatusMessage("");
        setRecommendationJobId(null);
        localStorage.removeItem('recommendationJobId');
        localStorage.removeItem('recommendationAttempts');
        return;
      }

      try {
        const statusResponse = await getRecommendationJobStatus(jobIdToPoll);
        const jobData = statusResponse.data;

        if (jobData.status === "completed") {

          // On completion, fetch the final results to ensure data is fresh
          // Assuming jobData itself contains the recommendations and stats upon completion
          const resultData = jobData.result || jobData;
          setRecommendations(formatRecommendations(resultData.recommendations));
          setStats(formatStats(resultData));
          
          setIsRefreshing(false);
          setStatusMessage("");
          setRecommendationJobId(null);
          localStorage.removeItem('recommendationJobId');
          localStorage.removeItem('recommendationAttempts');
          setJobJustCompleted(true); // Flag that we just finished a job
        } else if (jobData.status === "failed") {
          throw new Error(jobData.error_message || "AI Recommendation generation job failed on the server.");
        } else {
          console.log(`Job status: ${jobData.status}. Retrying in ${currentDelay / 1000} seconds.`);
          // Schedule the next poll with the calculated backoff delay
          timeoutId = setTimeout(() => pollJobStatus(jobIdToPoll), currentDelay);
        }
      } catch (fetchError) {
        console.warn("Polling status update check failed:", fetchError);
        setError(formatError(fetchError, "Failed to get recommendation status."));
        setIsRefreshing(false);
        setStatusMessage("");
        setRecommendationJobId(null);
        localStorage.removeItem('recommendationJobId');
        localStorage.removeItem('recommendationAttempts');
        setJobJustCompleted(true); // Also flag on failure to prevent restart loop
      }
    };

    if (recommendationJobId) {
      setIsRefreshing(true);
      setStatusMessage("Resuming AI recommendation generation...");
      
      // Start the polling process
      pollJobStatus(recommendationJobId);
    } else {
      // If no job ID is found on mount, and a job wasn't just completed,
      // automatically trigger a new recommendation generation.
      if (!jobJustCompleted) {
        handleRefresh();
      }
    }

    return () => {
      // Cleanup timeout on unmount
      clearTimeout(timeoutId);
    };
  }, [recommendationJobId]); // Rerun when jobId changes
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError("");
    setStatusMessage("Triggering AI recommendation generation...");
    setAttempts(0); // Reset attempts for a new job
    localStorage.removeItem('recommendationAttempts');
    try {
      setJobJustCompleted(false); // Reset the flag when starting a new job
      const triggerResponse = await triggerRecommendations();
      const newJobId = triggerResponse.data.job_id;
      setRecommendationJobId(newJobId); // This will trigger the useEffect to start polling
      localStorage.setItem('recommendationJobId', newJobId); // Persist jobId
      localStorage.setItem('recommendationAttempts', '0');
    } catch (err) {
      console.error("Failed to trigger recommendations:", err);
      setError(formatError(err, "Failed to trigger recommendation generation."));
      setIsRefreshing(false);
      setStatusMessage("");
      localStorage.removeItem('recommendationJobId'); // Clear on error
    }
  };

  // Get Badge Color Classes for Difficulty
  const getDifficultyBadgeClasses = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 ring-1 ring-inset";
      case "medium":
        return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 ring-1 ring-inset";
      case "hard":
        return "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 ring-1 ring-inset";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-900/30 dark:text-slate-400 ring-1 ring-inset";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            AI Personalized <span className="text-indigo-650 dark:text-indigo-450">Recommendations</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Curated, non-redundant coding challenges dynamically synthesized from your knowledge graph boundary.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-x-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <svg className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>{isRefreshing ? "Synthesizing..." : "Refresh Recommendations"}</span>
        </button>
      </div>

      {/* STATUS & ERROR ALERTS */}
      {isRefreshing && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-2xl p-4 flex items-center space-x-3 text-indigo-700 dark:text-indigo-400 animate-pulse">
          <svg className="animate-spin h-5 w-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-4 flex items-center space-x-3 text-rose-750 dark:text-rose-400">
          <svg className="h-5 w-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* 1. SUMMARY STATS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stat 1: Total Solved */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Solved Problems Analyzed
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalSolvedAnalyzed}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Stat 2: Difficulty Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Difficulty Distribution
          </p>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">Easy: {stats.distribution.easy}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-amber-600 dark:text-amber-400">Medium: {stats.distribution.medium}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-rose-600 dark:text-rose-400">Hard: {stats.distribution.hard}</span>
          </div>
        </div>

        {/* Stat 3: Average Solved Difficulty Badge */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Avg. Target Difficulty
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getDifficultyBadgeClasses(stats.averageSolvedDifficulty)}`}>
                {stats.averageSolvedDifficulty}
              </span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

      </div>

      {/* 2. RECOMMENDATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendations.map((rec) => {
          const isFallback = rec.title === "None";

          // 3. FALLBACK / EMPTY STATE CARD TRANSFORMATION
          if (isFallback) {
            return (
              <div
                key={rec.id}
                className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg shrink-0">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                        Topic Study Recommended
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-amber-900 dark:text-amber-300">
                      Study Range: {rec.pattern}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Target Pattern Area
                    </p>
                  </div>

                  <div className="p-4 bg-amber-100/40 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl">
                    <p className="text-xs md:text-sm text-amber-900 dark:text-amber-300 italic font-medium">
                      "{rec.topicSuggestion}"
                    </p>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  <span className="inline-flex items-center gap-x-1.5 rounded-md bg-amber-100/50 dark:bg-amber-950/40 px-2 py-1 text-xxs font-semibold tracking-wider font-mono text-amber-800 dark:text-amber-400 uppercase ring-1 ring-inset ring-amber-600/10">
                    📚 query: {rec.searchQuery}
                  </span>
                </div>
              </div>
            );
          }

          // STANDARD RECOMMENDATION CARD LAYOUT
          return (
            <div
              key={rec.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-500/10 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  {/* Pattern and Recommendation Type Indicator */}
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                    {rec.pattern}
                  </span>
                  
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xxs font-bold uppercase tracking-wider ${
                    rec.type === "ADVANCED_NEXT_STEP" 
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 ring-1 ring-inset ring-purple-750/10" 
                      : "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 ring-1 ring-inset ring-indigo-750/10"
                  }`}>
                    {rec.type === "ADVANCED_NEXT_STEP" ? "Advanced Step" : "Good Next Step"}
                  </span>
                </div>

                {/* Title & Difficulty Badge */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                      {rec.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-md text-xxs font-bold uppercase tracking-wider ${getDifficultyBadgeClasses(rec.difficulty)}`}>
                      {rec.difficulty}
                    </span>
                  </div>
                </div>

                {/* Advancement Bridge box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-l-4 border-indigo-500 dark:border-indigo-400 rounded-r-xl">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-350 italic font-medium leading-relaxed">
                    "{rec.advancementBridge}"
                  </p>
                </div>
              </div>

              {/* Card Footer actions */}
              <div className="pt-6 space-y-4 border-t border-slate-100 dark:border-slate-850 mt-6">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-x-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xxs font-semibold tracking-wider font-mono text-slate-600 dark:text-slate-450 uppercase ring-1 ring-inset ring-slate-500/10">
                    🔍 query: {rec.searchQuery}
                  </span>
                </div>

                <a
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 p-2.5 text-sm font-semibold text-white shadow-sm transition"
                >
                  <span>Practice Now</span>
                  <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}