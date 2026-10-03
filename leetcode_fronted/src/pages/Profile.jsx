import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router';
import { fetchSolvedProblems } from '../problemSlice';
import { logoutUser } from '../authSlice';
import { authApi } from '../api/problemApi';

/* ---------- SVG icons ---------- */
const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const TrophyIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-6 h-6'}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 0h1.5a2.5 2.5 0 0 1 0 5H18M4 22h16M10 14.7V17a4 4 0 0 0 8 0v-2.3M18 4H6v5a6 6 0 0 0 12 0V4Z" />
  </svg>
);
const TargetIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-10 h-10'}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const AlertIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>
    <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);
const LogoutIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
  </svg>
);

const dotStyles = {
  easy: 'bg-success',
  medium: 'bg-warning',
  hard: 'bg-error',
};

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { solvedProblems, loading } = useSelector((state) => state.problems);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchSolvedProblems());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const openDeleteModal = () => {
    setPassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!password) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await authApi.deleteProfile(password);
    } catch (err) {
      const data = err.response?.data;
      setDeleteError(typeof data === 'string' && data ? data : 'Failed to delete account');
      setDeleting(false);
      return;
    }
    await dispatch(logoutUser());
    navigate('/signup');
  };

  const totalSolved = solvedProblems.length;
  const easySolved = solvedProblems.filter((p) => p.difficult === 'easy').length;
  const mediumSolved = solvedProblems.filter((p) => p.difficult === 'medium').length;
  const hardSolved = solvedProblems.filter((p) => p.difficult === 'hard').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="relative overflow-hidden bg-base-100 border border-base-300 rounded-2xl p-6 mb-4">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-3xl font-black text-primary ring-1 ring-primary/25">
              {user?.firstname?.[0]?.toUpperCase() || 'U'}
            </div>
            {user?.role === 'admin' && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 badge badge-warning badge-xs whitespace-nowrap">
                Admin
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-2xl font-bold text-base-content truncate">{user?.firstname || 'User'}</h1>
            <p className="text-sm text-base-content/60 truncate">{user?.emailID}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm gap-1.5 shrink-0 mx-auto sm:mx-0">
            <LogoutIcon /> Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total solved" value={totalSolved} accent="primary" icon={<TrophyIcon />} />
        <StatCard label="Easy" value={easySolved} accent="success" dot="easy" />
        <StatCard label="Medium" value={mediumSolved} accent="warning" dot="medium" />
        <StatCard label="Hard" value={hardSolved} accent="error" dot="hard" />
      </div>

      {/* Difficulty mix */}
      {totalSolved > 0 && (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between text-xs font-medium text-base-content/60 mb-2">
            <span>Solved mix</span>
            <span className="flex gap-3">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />{easySolved}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />{mediumSolved}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" />{hardSolved}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-base-200 overflow-hidden flex">
            <div className="h-full bg-success transition-all" style={{ width: `${(easySolved / totalSolved) * 100}%` }} />
            <div className="h-full bg-warning transition-all" style={{ width: `${(mediumSolved / totalSolved) * 100}%` }} />
            <div className="h-full bg-error transition-all" style={{ width: `${(hardSolved / totalSolved) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Solved list */}
      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b border-base-300 flex items-center justify-between">
          <h2 className="font-semibold text-base-content">Solved problems</h2>
          <span className="badge badge-ghost badge-sm">{totalSolved}</span>
        </div>

        {loading && totalSolved === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : solvedProblems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <TargetIcon />
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-1">No problems solved yet</h3>
            <p className="text-sm text-base-content/60 mb-5">Submit an accepted solution to start building your record.</p>
            <NavLink to="/" className="btn btn-primary btn-sm">Browse Problems</NavLink>
          </div>
        ) : (
          <div className="divide-y divide-base-300/70">
            {solvedProblems.map((problem) => (
              <NavLink
                key={problem._id}
                to={`/problem/${problem._id}`}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 transition-colors"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotStyles[problem.difficult] || dotStyles.easy}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-base-content group-hover:text-primary transition-colors truncate">
                    {problem.title}
                  </p>
                  <p className="text-xs text-base-content/50 capitalize">{problem.tags}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" /> Solved
                </span>
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-error/25 bg-error/5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-error"><AlertIcon className="w-5 h-5" /></span>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-base-content">Delete account</p>
            <p className="text-xs text-base-content/60">Permanently removes your profile and all submissions.</p>
          </div>
          <button onClick={openDeleteModal} className="btn btn-error btn-sm btn-outline">
            Delete…
          </button>
        </div>
      </div>

      {/* Password confirm modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !deleting && setShowDeleteModal(false)} />
          <form
            onSubmit={handleDeleteAccount}
            className="relative bg-base-100 border border-base-300 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
          >
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mb-3">
              <AlertIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base-content">Delete your account?</h3>
            <p className="text-sm text-base-content/60 mt-1 mb-4">
              This is permanent. Enter your password to confirm it's really you.
            </p>
            {deleteError && (
              <div className="alert alert-error py-2.5 mb-3">
                <span className="text-sm">{deleteError}</span>
              </div>
            )}
            <label className="label"><span className="label-text">Password</span></label>
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              className="input input-bordered w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={deleting}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-error btn-sm" disabled={deleting}>
                {deleting ? <span className="loading loading-spinner loading-xs"></span> : 'Delete permanently'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent, icon, dot }) {
  const styles = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    error: 'text-error bg-error/10',
  };
  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-3xl font-black text-base-content leading-none">{value}</p>
          <p className="text-xs text-base-content/55 mt-1.5">{label}</p>
        </div>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styles[accent]}`}>
          {icon || <span className={`w-3 h-3 rounded-full ${dotStyles[dot]}`} />}
        </span>
      </div>
    </div>
  );
}