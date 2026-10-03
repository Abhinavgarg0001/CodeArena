import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { fetchAllProblems, fetchMySubmissions } from '../problemSlice';

const statusConfig = {
  accepted: { label: 'Accepted', class: 'badge-success', icon: '✅', color: 'text-success' },
  wrong: { label: 'Wrong Answer', class: 'badge-error', icon: '❌', color: 'text-error' },
  error: { label: 'Runtime Error', class: 'badge-warning', icon: '⚠️', color: 'text-warning' },
  pending: { label: 'Pending', class: 'badge-loading', icon: '⏳', color: 'text-base-content' },
};

function formatTime(ms) {
  if (!ms) return '-';
  const time = parseFloat(ms);
  return time < 1000 ? `${time.toFixed(2)}ms` : `${(time / 1000).toFixed(2)}s`;
}

function formatMemory(kb) {
  if (!kb) return '-';
  const mem = parseInt(kb);
  return mem < 1024 ? `${mem}KB` : `${(mem / 1024).toFixed(1)}MB`;
}

export default function Submissions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submissions, list, loading } = useSelector((state) => state.problems);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchAllProblems());
    dispatch(fetchMySubmissions());
  }, [dispatch]);

  const problemIdOf = (sub) =>
    typeof sub.problemId === 'object' && sub.problemId !== null
      ? sub.problemId._id
      : sub.problemId;

  const problemOf = (sub) => {
    if (typeof sub.problemId === 'object' && sub.problemId !== null) {
      return sub.problemId;
    }
    return list.find((p) => p._id === sub.problemId);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedProblemId && problemIdOf(sub) !== selectedProblemId) return false;
    if (filterStatus === 'all') return true;
    return sub.status === filterStatus;
  });

  const getStatusConfig = (status) => statusConfig[status] || { label: status, class: 'badge-ghost', icon: '❓', color: '' };

  return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-base-content">Submissions</h1>
          <p className="text-base-content/60 mt-1">View your submission history</p>
        </div>

        {/* Problem Selector */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 sm:w-64">
              <label className="label">
                <span className="label-text">Select Problem</span>
              </label>
              <select
                value={selectedProblemId || ''}
                onChange={(e) => setSelectedProblemId(e.target.value || null)}
                className="select select-bordered w-full max-w-xs"
              >
                <option value="">All Problems</option>
                {list.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.difficult})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 sm:w-48">
              <label className="label">
                <span className="label-text">Filter by Status</span>
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select select-bordered w-full max-w-xs"
              >
                <option value="all">All Status</option>
                <option value="accepted">Accepted</option>
                <option value="wrong">Wrong Answer</option>
                <option value="error">Runtime Error</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          {loading && submissions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-base-content mb-2">No submissions found</h3>
              <p className="text-base-content/60">
                {selectedProblemId ? 'No submissions for this problem yet' : 'Make a submission to see it here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-base-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Problem</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Language</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Runtime</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Memory</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Test Cases</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => {
                    const problem = problemOf(sub);
                    const status = getStatusConfig(sub.status);
                    const pid = problemIdOf(sub);

                    return (
                      <tr
                        key={sub._id}
                        onClick={() => navigate(`/submissions/${sub._id}`)}
                        className="hover:bg-base-200/50 transition-colors cursor-pointer"
                        title="Open submission detail"
                      >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-base-content truncate max-w-xs">
                                {problem?.title || 'Unknown Problem'}
                              </p>
                              <p className="text-xs text-base-content/50">#{typeof pid === 'string' ? pid.slice(-6) : ''}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${status.class} gap-1`}>
                              <span>{status.icon}</span>
                              <span>{status.label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-ghost badge-sm">
                              {sub.language?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-base-content/70 font-mono">
                            {formatTime(sub.runtime)}
                          </td>
                          <td className="px-4 py-3 text-sm text-base-content/70 font-mono">
                            {formatMemory(sub.memory)}
                          </td>
                          <td className="px-4 py-3 text-sm text-base-content/70">
                            {sub.testCasesPassed}/{sub.testCasesTotal}
                          </td>
                          <td className="px-4 py-3 text-sm text-base-content/50 whitespace-nowrap">
                            {new Date(sub.createdAt).toLocaleDateString()}
                            <span className="inline-block ml-2 text-base-content/30">→</span>
                          </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}