import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProblemById,
  fetchSubmissions,
  submitCode,
  runCode,
  clearRunResult,
  clearSubmitResult,
} from '../problemSlice';
import { CodeEditor } from '../components/CodeEditor';
import { LanguageSelector } from '../components/LanguageSelector';
import { Layout } from '../components/Layout';

const runnableTemplates = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here

    return 0;
}`,
  java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Write your solution here

    }
}`,
  javascript: `// Write your solution here
const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim();
`,
};

function formatDescription(description) {
  if (!description) return '';

  return description
    .split('\n')
    .map((line) => {
      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        return `<h3 class="text-lg font-semibold text-base-content mt-4 mb-2">${line.replace(/^#+\s*/, '')}</h3>`;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return `<li class="ml-4 mb-1">${line.replace(/^[-*]\s*/, '')}</li>`;
      }
      if (line.match(/^\d+\./)) {
        return `<li class="ml-4 mb-1 list-decimal">${line}</li>`;
      }
      if (line.trim() === '') {
        return '<br />';
      }
      return `<p class="text-base-content/80 leading-relaxed">${line}</p>`;
    })
    .join('\n');
}

const errText = (e) => {
  if (!e) return '';
  if (typeof e === 'string') return e;
  return e.error || e.message || JSON.stringify(e);
};

const formatMs = (t) => {
  const ms = Math.round(parseFloat(t) * 1000);
  if (Number.isNaN(ms)) return '';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
};

/* ---------- inline SVG icons ---------- */

const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${className} shrink-0`}>
    <path d={d} />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`${className || 'w-4 h-4'} shrink-0`}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const XIcon = ({ className }) => <Icon d="M18 6 6 18M6 6l12 12" className={className} />;
const AlertIcon = ({ className }) => <Icon d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" className={className} />;
const ClockIcon = ({ className }) => <Icon d="M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" className={`${className || 'w-3.5 h-3.5'}`} />;
const PlayIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${className || 'w-4 h-4'} shrink-0`}>
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);
const SendIcon = ({ className }) => <Icon d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" className={className} />;
const BackIcon = ({ className }) => <Icon d="M19 12H5m7-7-7 7 7 7" className={className} />;
const ResetIcon = ({ className }) => <Icon d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" className={className} />;

const difficultyStyles = {
  easy: 'bg-success/15 text-success',
  medium: 'bg-warning/15 text-warning',
  hard: 'bg-error/15 text-error',
};

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    currentProblem, loading, error,
    submitLoading, runLoading, runResult, submitResult, submissions,
  } = useSelector((state) => state.problems);

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('description');
  // Submit stays locked until the current code passes a full Run
  const [runOk, setRunOk] = useState(false);

  useEffect(() => {
    dispatch(fetchProblemById(id));
    dispatch(clearRunResult());
    dispatch(clearSubmitResult());
    setActiveTab('description');
    setRunOk(false);
  }, [id, dispatch]);

  useEffect(() => {
    if (currentProblem?.startCode) {
      const langCode = currentProblem.startCode.find((sc) => sc.language === language);
      setCode(langCode ? langCode.initialCode : runnableTemplates[language]);
    } else if (currentProblem) {
      setCode(runnableTemplates[language]);
    }
  }, [currentProblem, language]);

  // Any edit or language switch invalidates the previous successful Run
  useEffect(() => {
    setRunOk(false);
  }, [code, language]);

  // A Run counts only when every visible case passes
  useEffect(() => {
    if (Array.isArray(runResult) && runResult.length > 0) {
      setRunOk(runResult.every((t) => t.status_id === 3));
    }
  }, [runResult]);

  // Load this problem's submissions when the tab opens or after a submit
  useEffect(() => {
    if (activeTab === 'submissions' || submitResult?.message) {
      dispatch(fetchSubmissions(id));
    }
  }, [activeTab, submitResult, id, dispatch]);

  const handleRun = () => {
    if (!code.trim() || runLoading) return;
    dispatch(runCode({ problemId: id, code, language }));
  };

  const handleSubmit = () => {
    if (!code.trim() || submitLoading) return;
    dispatch(submitCode({ problemId: id, code, language }));
  };

  const handleReset = () => {
    const langCode = currentProblem?.startCode?.find((sc) => sc.language === language);
    setCode(langCode ? langCode.initialCode : runnableTemplates[language]);
  };

  const runTests = Array.isArray(runResult) ? runResult : [];
  const runPassed = runTests.filter((t) => t.status_id === 3).length;
  const latestSubmission = Array.isArray(submissions) && submissions.length > 0 ? submissions[0] : null;

  if (loading && !currentProblem) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-sm text-base-content/50">Loading problem…</p>
        </div>
      </Layout>
    );
  }

  if (error && !currentProblem) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-error/10 text-error flex items-center justify-center">
            <AlertIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-base-content mb-2">Problem not found</h2>
          <p className="text-sm text-base-content/60 mb-6">{errText(error)}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">
            Back to Problems
          </button>
        </div>
      </Layout>
    );
  }

  if (!currentProblem) return null;

  const problem = currentProblem;
  const difficulty = problem.difficult?.toLowerCase() || 'easy';
  const visibleCases = problem.visibleTestCases || [];

  const verdictBadge = (status) => {
    if (status === 'accepted')
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success">
          <CheckIcon /> Accepted
        </span>
      );
    if (status === 'wrong')
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-error/15 text-error">
          <XIcon /> Wrong Answer
        </span>
      );
    if (status === 'error')
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning">
          <AlertIcon /> Runtime Error
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-base-200 text-base-content/60">
        <ClockIcon /> {status || 'Pending'}
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm btn-circle" title="Back to problems">
            <BackIcon />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-base-content truncate flex-1 min-w-0">
            {problem.title}
          </h1>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${difficultyStyles[difficulty] || difficultyStyles.easy}`}>
            {difficulty}
          </span>
          {problem.tags && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-base-200 text-base-content/60 capitalize hidden sm:inline">
              {problem.tags}
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* ---------- Left: problem statement ---------- */}
          <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden min-w-0">
            <div className="flex border-b border-base-300 px-2">
              {['description', 'submissions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-base-content/50 hover:text-base-content'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
              {activeTab === 'description' && (
                <>
                  <div dangerouslySetInnerHTML={{ __html: formatDescription(problem.description) }} />

                  {visibleCases.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {visibleCases.map((tc, i) => (
                        <div key={i} className="rounded-xl bg-base-200/60 p-3.5">
                          <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
                            Example {i + 1}
                          </p>
                          <div className="grid gap-2">
                            <div>
                              <p className="text-xs text-base-content/50 mb-1">Input</p>
                              <pre className="bg-base-300/70 rounded-lg p-2.5 text-[13px] font-mono overflow-x-auto">{tc.input}</pre>
                            </div>
                            <div>
                              <p className="text-xs text-base-content/50 mb-1">Output</p>
                              <pre className="bg-base-300/70 rounded-lg p-2.5 text-[13px] font-mono overflow-x-auto text-success">{tc.output}</pre>
                            </div>
                          </div>
                          {tc.explanation && (
                            <p className="text-[13px] text-base-content/70 mt-2">
                              <span className="font-medium text-primary">Explanation: </span>
                              {tc.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 rounded-xl border border-base-300 p-3.5">
                    <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">Constraints</p>
                    <ul className="text-[13px] text-base-content/70 space-y-1 list-disc list-inside">
                      <li>Read input from stdin, write answer to stdout</li>
                      <li>Time limit: ~2s per test case</li>
                    </ul>
                  </div>
                </>
              )}

              {activeTab === 'submissions' && (
                <div className="space-y-2">
                  {!Array.isArray(submissions) || submissions.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-base-content/60">No submissions yet — run your code above.</p>
                    </div>
                  ) : (
                    submissions.map((s) => (
                      <details key={s._id} className="rounded-xl border border-base-300 overflow-hidden group">
                        <summary className="flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200/50 list-none">
                          {verdictBadge(s.status)}
                          <span className="badge badge-ghost badge-sm">{s.language}</span>
                          <span className="text-xs text-base-content/50 ml-auto">
                            {s.testCasesPassed}/{s.testCasesTotal} cases
                            {s.runtime ? ` · ${Math.round(s.runtime)} ms` : ''}
                          </span>
                        </summary>
                        <div className="border-t border-base-300 px-3 py-2 flex items-center justify-between">
                          <span className="text-xs text-base-content/50">
                            {new Date(s.createdAt).toLocaleString()}
                          </span>
                          <button
                            onClick={() => navigate(`/submissions/${s._id}`)}
                            className="btn btn-ghost btn-xs gap-1"
                          >
                            Open full view →
                          </button>
                        </div>
                        <pre className="border-t border-base-300 bg-base-200/40 p-3 text-xs font-mono overflow-x-auto max-h-56">
                          {s.code}
                        </pre>
                      </details>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ---------- Right: editor (always visible) ---------- */}
          <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden min-w-0 lg:sticky lg:top-20">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-base-300 flex-wrap">
              <LanguageSelector value={language} onChange={setLanguage} />
              {runLoading ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning">
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  Running…
                </span>
              ) : runOk ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success">
                  <CheckIcon /> Ready to submit
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-error/15 text-error">
                  <AlertIcon /> Run required to submit
                </span>
              )}
              <div className="flex-1" />
              <button onClick={handleReset} className="btn btn-ghost btn-sm gap-1.5" title="Reset to starter code">
                <ResetIcon /> <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            <CodeEditor
              initialCode={code}
              language={language}
              onChange={setCode}
              height="420px"
            />

            {/* Results */}
            <div className="border-t border-base-300 max-h-64 overflow-y-auto">
              {runResult && !Array.isArray(runResult) && runResult.error && (
                <div className="m-3 rounded-xl bg-error/10 border border-error/20 p-3 flex gap-2.5">
                  <span className="text-error mt-0.5"><AlertIcon /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-error">Run failed</p>
                    <p className="text-[13px] text-base-content/70 break-words">{errText(runResult.error)}</p>
                  </div>
                </div>
              )}

              {runTests.length > 0 && (
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2 px-1 pb-1">
                    {runPassed === runTests.length ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                        <CheckIcon /> {runPassed}/{runTests.length} passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-error">
                        <XIcon /> {runPassed}/{runTests.length} passed
                      </span>
                    )}
                  </div>
                  {runTests.map((t, i) => {
                    const passed = t.status_id === 3;
                    const isErr = t.status_id === 4;
                    return (
                      <details key={i} className={`rounded-lg border overflow-hidden ${passed ? 'border-success/20 bg-success/5' : isErr ? 'border-warning/20 bg-warning/5' : 'border-error/20 bg-error/5'}`}>
                        <summary className="flex items-center gap-2.5 px-3 py-2 cursor-pointer list-none text-sm">
                          <span className={passed ? 'text-success' : isErr ? 'text-warning' : 'text-error'}>
                            {passed ? <CheckIcon /> : isErr ? <AlertIcon /> : <XIcon />}
                          </span>
                          <span className="font-medium text-base-content">Case {i + 1}</span>
                          <span className="ml-auto inline-flex items-center gap-1 text-xs text-base-content/50">
                            <ClockIcon /> {t.time ? formatMs(t.time) : '—'}
                          </span>
                        </summary>
                        {(t.stdout || t.stderr) && (
                          <div className="border-t border-base-300 px-3 py-2 space-y-2">
                            {t.stdout && (
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-base-content/40 mb-1">Output</p>
                                <pre className="text-xs font-mono bg-base-200/60 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">{t.stdout}</pre>
                              </div>
                            )}
                            {t.stderr && (
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-base-content/40 mb-1">Error</p>
                                <pre className="text-xs font-mono bg-error/10 text-error rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">{t.stderr}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </details>
                    );
                  })}
                </div>
              )}

              {submitResult?.error && (
                <div className="m-3 rounded-xl bg-error/10 border border-error/20 p-3 flex gap-2.5">
                  <span className="text-error mt-0.5"><AlertIcon /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-error">Submit failed</p>
                    <p className="text-[13px] text-base-content/70 break-words">{errText(submitResult.error)}</p>
                  </div>
                </div>
              )}

              {submitResult?.message && !submitResult.error && (
                <div className="m-3 rounded-xl bg-success/10 border border-success/20 p-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-success"><CheckIcon className="w-5 h-5" /></span>
                    <p className="text-sm font-semibold text-base-content">Submitted successfully</p>
                    {latestSubmission && verdictBadge(latestSubmission.status)}
                  </div>
                  {latestSubmission && latestSubmission.status !== 'accepted' && (
                    <p className="text-[13px] text-base-content/60 mt-1.5">
                      {latestSubmission.testCasesPassed}/{latestSubmission.testCasesTotal} hidden cases passed.
                      {latestSubmission.errorMessage && (
                        <span className="block mt-1 font-mono text-xs bg-base-200/60 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                          {latestSubmission.errorMessage}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {!runResult && !submitResult && (
                <p className="px-4 py-3 text-[13px] text-base-content/40">
                  Press <span className="font-medium text-base-content/60">Run</span> to test against visible cases, <span className="font-medium text-base-content/60">Submit</span> to judge hidden cases.
                </p>
              )}
            </div>

            <div className="flex gap-2 p-3 border-t border-base-300">
              <button
                onClick={handleRun}
                disabled={runLoading || !code.trim()}
                className="btn btn-outline flex-1 gap-1.5"
              >
                {runLoading ? <span className="loading loading-spinner loading-sm"></span> : <><PlayIcon /> Run</>}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading || !code.trim() || !runOk}
                title={!runOk ? 'Run your code successfully first' : 'Submit'}
                className="btn btn-primary flex-1 gap-1.5"
              >
                {submitLoading ? <span className="loading loading-spinner loading-sm"></span> : <><SendIcon /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}