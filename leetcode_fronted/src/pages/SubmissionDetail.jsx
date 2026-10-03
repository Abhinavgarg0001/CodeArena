import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router';
import { fetchSubmissionById, clearCurrentSubmission } from '../problemSlice';
import { CodeEditor } from '../components/CodeEditor';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M19 12H5m7-7-7 7 7 7" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-8 h-8'}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-8 h-8'}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const AlertIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-8 h-8'}>
    <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);

const verdictConfig = {
  accepted: {
    title: 'Accepted',
    subtitle: 'All hidden test cases passed. Well done!',
    wrap: 'border-success/30 bg-success/5',
    iconWrap: 'bg-success/15 text-success',
    Icon: CheckIcon,
  },
  wrong: {
    title: 'Wrong Answer',
    subtitle: 'Your output differed on at least one hidden test case.',
    wrap: 'border-error/30 bg-error/5',
    iconWrap: 'bg-error/15 text-error',
    Icon: XIcon,
  },
  error: {
    title: 'Runtime Error',
    subtitle: 'Your program crashed or failed to compile on a hidden test case.',
    wrap: 'border-warning/30 bg-warning/5',
    iconWrap: 'bg-warning/15 text-warning',
    Icon: AlertIcon,
  },
  pending: {
    title: 'Pending',
    subtitle: 'This submission is still being judged.',
    wrap: 'border-base-300 bg-base-100',
    iconWrap: 'bg-base-200 text-base-content/50',
    Icon: AlertIcon,
  },
};

function formatRuntime(ms) {
  if (!ms) return '—';
  const t = parseFloat(ms);
  return t < 1000 ? `${t.toFixed(0)} ms` : `${(t / 1000).toFixed(2)} s`;
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentSubmission: sub, loading, error } = useSelector((state) => state.problems);

  useEffect(() => {
    dispatch(fetchSubmissionById(id));
    return () => dispatch(clearCurrentSubmission());
  }, [id, dispatch]);

  if (loading && !sub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-sm text-base-content/50">Loading submission…</p>
      </div>
    );
  }

  if (error && !sub) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-base-content mb-2">Submission not found</h2>
        <p className="text-sm text-base-content/60 mb-6">
          {typeof error === 'string' ? error : 'It may have been deleted.'}
        </p>
        <button onClick={() => navigate('/submissions')} className="btn btn-primary btn-sm">
          Back to Submissions
        </button>
      </div>
    );
  }

  if (!sub) return null;

  const verdict = verdictConfig[sub.status] || verdictConfig.pending;
  const problem = typeof sub.problemId === 'object' && sub.problemId !== null ? sub.problemId : null;
  const passPct =
    sub.testCasesTotal > 0 ? Math.round((sub.testCasesPassed / sub.testCasesTotal) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/submissions')}
        className="btn btn-ghost btn-sm gap-1.5 mb-4"
      >
        <BackIcon /> All submissions
      </button>

      {/* Verdict banner */}
      <div className={`rounded-2xl border p-5 sm:p-6 mb-4 ${verdict.wrap}`}>
        <div className="flex items-center gap-4">
          <span className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${verdict.iconWrap}`}>
            <verdict.Icon />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-base-content">{verdict.title}</h1>
            <p className="text-sm text-base-content/60 mt-0.5">{verdict.subtitle}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-base-content/60 mb-1.5">
            <span>
              {problem ? (
                <Link to={`/problem/${problem._id}`} className="link link-primary">
                  {problem.title}
                </Link>
              ) : (
                'Problem'
              )}
            </span>
            <span>{sub.testCasesPassed}/{sub.testCasesTotal} cases · {passPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-base-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${sub.status === 'accepted' ? 'bg-success' : sub.status === 'wrong' ? 'bg-error' : 'bg-warning'}`}
              style={{ width: `${passPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Language', value: sub.language?.toUpperCase() || '—' },
          { label: 'Runtime', value: formatRuntime(sub.runtime), mono: true },
          { label: 'Submitted', value: new Date(sub.createdAt).toLocaleString() },
          { label: 'Memory', value: sub.memory ? `${sub.memory} KB` : '—', mono: true },
        ].map((m) => (
          <div key={m.label} className="bg-base-100 border border-base-300 rounded-2xl p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-base-content/40 mb-1">{m.label}</p>
            <p className={`text-sm font-semibold text-base-content truncate ${m.mono ? 'font-mono' : ''}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Error */}
      {sub.errorMessage && (
        <div className="rounded-2xl border border-error/25 bg-error/5 p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-error mb-2">Error output</p>
          <pre className="text-xs font-mono text-base-content/80 whitespace-pre-wrap overflow-x-auto max-h-48">
            {sub.errorMessage}
          </pre>
        </div>
      )}

      {/* Code */}
      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-base-content">Your code</h2>
          <span className="badge badge-ghost badge-sm">{sub.language}</span>
        </div>
        <CodeEditor
          initialCode={sub.code || ''}
          language={sub.language || 'javascript'}
          readOnly
          height="480px"
        />
      </div>
    </div>
  );
}