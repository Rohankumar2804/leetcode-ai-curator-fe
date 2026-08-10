import React, { useState, useEffect } from "react";

// --- DYNAMIC MOCK DATA ENGINE ---
const PROBLEM_MOCK_DATABASE = {
  "coin-change": {
    decision: "PARTIAL_SOLVE",
    decisionText: "Worth Reviewing - Familiar core pattern, but introduces new twists",
    overlapPercentage: 75,
    uniquenessScore: 45,
    confidenceScore: 95,
    matchingProblem: {
      title: "Combination Sum IV",
      slug: "combination-sum-iv",
      difficulty: "Medium",
      link: "https://leetcode.com/problems/combination-sum-iv/",
    },
    keyDifference: "You already understand unbounded knapsack state transitions, but this specific variation introduces variable coin boundary requirements and minimization instead of combination counting.",
  },
  "two-sum": {
    decision: "SKIP",
    decisionText: "Redundant - Identical mathematical invariants. You already know this!",
    overlapPercentage: 100,
    uniquenessScore: 0,
    confidenceScore: 100,
    matchingProblem: {
      title: "Two Sum II - Input Array Is Sorted",
      slug: "two-sum-ii-input-array-is-sorted",
      difficulty: "Medium",
      link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    },
    keyDifference: "Identical mathematical invariants. You have solved multiple variations of the 2-pointer/hash-map lookup strategy. Solving this offers near-zero additional cognitive yield.",
  },
  "edit-distance": {
    decision: "SOLVE",
    decisionText: "Highly Recommended - New mental model required",
    overlapPercentage: 20,
    uniquenessScore: 90,
    confidenceScore: 85,
    matchingProblem: {
      title: "Longest Common Subsequence",
      slug: "longest-common-subsequence",
      difficulty: "Medium",
      link: "https://leetcode.com/problems/longest-common-subsequence/",
    },
    keyDifference: "While both are String DP, Edit Distance introduces three potential state transitions (insert, delete, replace) compared to LCS's simple binary match/mismatch branch. A new mental model for string alignments is required.",
  },
};

const DEFAULT_MOCK = {
  decision: "SOLVE",
  decisionText: "Highly Recommended - New mental model required",
  overlapPercentage: 35,
  uniquenessScore: 78,
  confidenceScore: 88,
  matchingProblem: {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "Easy",
    link: "https://leetcode.com/problems/climbing-stairs/",
  },
  keyDifference: "This problem introduces novel constraints on state space branching. While there is a slight structural resemblance to standard recurrence relations, the state transitions require a fresh mental model.",
};

const LOADING_STATUSES = [
  "Comparing algorithmic invariants...",
  "Analyzing abstract syntax trees (ASTs)...",
  "Mapping multi-dimensional state space...",
  "Retrieving past code submissions...",
  "Synthesizing executive summary...",
];

export default function AlgorithmicOverlapEvaluator() {
  const [problemSlug, setProblemSlug] = useState("");
  const [platform, setPlatform] = useState("LeetCode");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_STATUSES[0]);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Smart loading animation text cycles
  useEffect(() => {
    let intervalId;
    if (isLoading) {
      let statusIndex = 0;
      intervalId = setInterval(() => {
        statusIndex = (statusIndex + 1) % LOADING_STATUSES.length;
        setLoadingText(LOADING_STATUSES[statusIndex]);
      }, 600);
    }
    return () => clearInterval(intervalId);
  }, [isLoading]);

  const handleEvaluate = (e) => {
    e.preventDefault();
    if (!problemSlug.trim()) return;

    setIsLoading(true);
    setEvaluationResult(null);

    // Simulate smart AI analysis delay
    setTimeout(() => {
      const normalizedSlug = problemSlug.trim().toLowerCase();
      const result = PROBLEM_MOCK_DATABASE[normalizedSlug] || DEFAULT_MOCK;
      setEvaluationResult(result);
      setIsLoading(false);
    }, 3000);
  };

  // Radial progress calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = evaluationResult
    ? circumference - (evaluationResult.overlapPercentage / 100) * circumference
    : circumference;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Algorithmic Overlap <span className="text-indigo-600 dark:text-indigo-400">Evaluator</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Evaluate if a problem introduces new cognitive invariants or simply duplicates structures you have already mastered.
        </p>
      </div>

      {/* 1. INPUT PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
        <form onSubmit={handleEvaluate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Problem Input */}
          <div className="md:col-span-6 space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              LeetCode Problem Slug or ID
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder='e.g., "coin-change", "two-sum", "edit-distance"'
                value={problemSlug}
                onChange={(e) => setProblemSlug(e.target.value)}
                className="block w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Platform Dropdown */}
          <div className="md:col-span-3 space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Platform
            </label>
            <select
              value={platform}
              disabled={isLoading}
              onChange={(e) => setPlatform(e.target.value)}
              className="block w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 transition-colors duration-200"
            >
              <option value="LeetCode">LeetCode</option>
              <option value="HackerRank">HackerRank</option>
              <option value="Codeforces">Codeforces</option>
              <option value="AtCoder">AtCoder</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isLoading || !problemSlug.trim()}
              className="relative w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-900/50 p-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing...</span>
                </span>
              ) : (
                "Evaluate Overlap"
              )}
            </button>
          </div>
        </form>

        {/* Try Out Suggestions */}
        <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500">
          <span>Quick Try:</span>
          {["coin-change", "two-sum", "edit-distance"].map((slug) => (
            <button
              key={slug}
              type="button"
              disabled={isLoading}
              onClick={() => setProblemSlug(slug)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 font-mono transition-colors"
            >
              {slug}
            </button>
          ))}
        </div>
      </div>

      {/* SMART LOADING PULSING SKELETON */}
      {isLoading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center">
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span>{loadingText}</span>
            </span>
          </div>
        </div>
      )}

      {/* 2. EVALUATION RESULTS DISPLAY */}
      {evaluationResult && !isLoading && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Decision Banner */}
          {evaluationResult.decision === "SOLVE" && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-5 flex items-start space-x-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21a3.745 3.745 0 01-3.068-1.593 3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0114 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                  DECISION: SOLVE
                </span>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                  {evaluationResult.decisionText}
                </h3>
              </div>
            </div>
          )}

          {evaluationResult.decision === "PARTIAL_SOLVE" && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-5 flex items-start space-x-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                  DECISION: PARTIAL SOLVE
                </span>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">
                  {evaluationResult.decisionText}
                </h3>
              </div>
            </div>
          )}

          {evaluationResult.decision === "SKIP" && (
            <div className="bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-2xl p-5 flex items-start space-x-4">
              <div className="p-2 bg-slate-500/10 rounded-xl text-slate-600 dark:text-slate-400 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.364A9 9 0 015.636 5.636m12.728 12.364L5.636 5.636" />
                </svg>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  DECISION: SKIP
                </span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-300">
                  {evaluationResult.decisionText}
                </h3>
              </div>
            </div>
          )}

          {/* Metric Details Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Ring Gauge (Knowledge Overlap) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
              <h4 className="text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                Knowledge Overlap
              </h4>
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  {/* Track Circle */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Active Progress Circle */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className={`${
                      evaluationResult.decision === "SOLVE"
                        ? "text-emerald-500"
                        : evaluationResult.decision === "PARTIAL_SOLVE"
                        ? "text-amber-500"
                        : "text-slate-500"
                    } transition-all duration-1000 ease-out`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                {/* Gauge Label Overlay */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {evaluationResult.overlapPercentage}%
                  </span>
                  <span className="text-xxs text-slate-400 uppercase font-bold tracking-widest">
                    Overlap
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determined by pattern correlation and logic flows.
              </p>
            </div>

            {/* Right: Metrics Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Uniqueness Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Uniqueness Score
                  </span>
                  <h5 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {evaluationResult.uniquenessScore}
                    <span className="text-base font-normal text-slate-400">/100</span>
                  </h5>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${evaluationResult.uniquenessScore}%` }}
                  />
                </div>
              </div>

              {/* Confidence Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Confidence Score
                  </span>
                  <h5 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {evaluationResult.confidenceScore}
                    <span className="text-base font-normal text-slate-400">/100</span>
                  </h5>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${evaluationResult.confidenceScore}%` }}
                  />
                </div>
              </div>

              {/* Matching Past Solved Problem Card */}
              <div className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Matching Past Solved Problem
                    </span>
                    <h6 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {evaluationResult.matchingProblem.title}
                    </h6>
                  </div>
                  <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10">
                    {evaluationResult.matchingProblem.difficulty}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <a
                    href={evaluationResult.matchingProblem.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                  >
                    <span>View original solution</span>
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* 3. TEXT AREA: Key Difference or Lesson */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <svg className="h-5 w-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.452iM18 7.512A9.012 9.012 0 0112.5 3a9 9 0 00-9 9c0 1.433.324 2.79.904 4.004L3 21l4.996-1.404A9 9 0 0018 12.5c0-1.785-.443-3.468-1.226-4.949z" />
              </svg>
              <span>Key Difference & AI Summary</span>
            </h4>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
              <p className="text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300 italic font-medium">
                "{evaluationResult.keyDifference}"
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
