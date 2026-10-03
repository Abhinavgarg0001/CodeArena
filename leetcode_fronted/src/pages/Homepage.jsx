import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { fetchAllProblems, fetchSolvedProblems } from '../problemSlice';
import { ProblemCard } from '../components/ProblemCard';

const difficulties = ['all', 'easy', 'medium', 'hard'];

export default function Homepage() {
  const dispatch = useDispatch();
  const { list, loading, error, solvedProblems } = useSelector((state) => state.problems);
  const { user } = useSelector((state) => state.auth);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');

  useEffect(() => {
    dispatch(fetchAllProblems());
    dispatch(fetchSolvedProblems());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return list.filter((p) => {
      const matchesQuery =
        !query.trim() ||
        p.title?.toLowerCase().includes(query.trim().toLowerCase()) ||
        p.tags?.toLowerCase().includes(query.trim().toLowerCase());
      const matchesDifficulty =
        difficulty === 'all' || p.difficult?.toLowerCase() === difficulty;
      return matchesQuery && matchesDifficulty;
    });
  }, [list, query, difficulty]);

  const solvedCount = solvedProblems.length;
  const progress = list.length > 0 ? Math.round((solvedCount / list.length) * 100) : 0;

  if (loading && list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-sm text-base-content/50">Loading problems…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="alert alert-error">
          <span>Failed to load problems: {typeof error === 'string' ? error : 'Server unreachable'}</span>
        </div>
        <button onClick={() => dispatch(fetchAllProblems())} className="btn btn-outline btn-sm mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Problems</h1>
          <p className="text-base-content/60 mt-1 text-sm sm:text-base">
            {list.length > 0
              ? `${solvedCount} of ${list.length} solved — keep going!`
              : 'Practice your coding skills with our collection of problems'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/admin" className="btn btn-outline btn-sm sm:btn-md shrink-0">
            🛠️ Manage
          </Link>
        )}
      </div>

      {list.length > 0 && (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between text-xs font-medium text-base-content/60 mb-2">
            <span>Your progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-base-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {list.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or tag…"
              className="w-full pl-10 pr-4 py-2.5 bg-base-100 border border-base-300 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">🔍</span>
          </div>
          <div className="flex gap-1.5 p-1 bg-base-100 border border-base-300 rounded-xl w-fit">
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  difficulty === d
                    ? 'bg-primary text-primary-content'
                    : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="text-center py-16 bg-base-100 border border-base-300 rounded-2xl">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-medium text-base-content mb-2">No problems available</h3>
          <p className="text-base-content/60 text-sm">
            {user?.role === 'admin' ? 'Create your first problem to get started.' : 'Check back later for new problems.'}
          </p>
          {user?.role === 'admin' && (
            <Link to="/admin/new" className="btn btn-primary btn-sm mt-4">Create Problem</Link>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-base-100 border border-base-300 rounded-2xl">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-base-content mb-2">No matches</h3>
          <p className="text-base-content/60 text-sm">Try a different search or difficulty filter.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((problem) => (
            <ProblemCard key={problem._id} problem={problem} solvedProblems={solvedProblems} />
          ))}
        </div>
      )}
    </div>
  );
}