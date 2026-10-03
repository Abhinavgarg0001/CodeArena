import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { fetchAllProblems, deleteProblem, clearAdminStatus } from '../problemSlice';
import { authApi } from '../api/problemApi';

function CreateAdminCard() {
  const [form, setForm] = useState({ firstname: '', emailID: '', password: '' });
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: '' });
    try {
      const res = await authApi.registerAdmin(form);
      setStatus({
        loading: false,
        message: typeof res.data === 'string' ? res.data : 'Admin created successfully',
        error: '',
      });
      setForm({ firstname: '', emailID: '', password: '' });
    } catch (err) {
      const data = err.response?.data;
      setStatus({
        loading: false,
        message: '',
        error: typeof data === 'string' && data ? data : 'Failed to create admin',
      });
    }
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-4 sm:p-5 mb-6">
      <h2 className="font-semibold text-base-content">Create Admin User</h2>
      <p className="text-sm text-base-content/60 mt-0.5 mb-3">
        Uses <code className="font-mono text-xs">POST /auth/admin/register</code> with your admin session.
      </p>
      {status.message && (
        <div className="alert alert-success mb-3"><span>{status.message}</span></div>
      )}
      {status.error && (
        <div className="alert alert-error mb-3"><span>{status.error}</span></div>
      )}
      <form onSubmit={handleCreate} className="grid sm:grid-cols-4 gap-2">
        <input
          className="input input-bordered input-sm"
          placeholder="First name"
          autoComplete="off"
          value={form.firstname}
          onChange={(e) => setForm({ ...form, firstname: e.target.value })}
          required
        />
        <input
          className="input input-bordered input-sm"
          type="email"
          placeholder="Email"
          autoComplete="off"
          value={form.emailID}
          onChange={(e) => setForm({ ...form, emailID: e.target.value })}
          required
        />
        <input
          className="input input-bordered input-sm"
          type="password"
          autoComplete="new-password"
          placeholder="Strong password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" className="btn btn-outline btn-sm" disabled={status.loading}>
          {status.loading ? <span className="loading loading-spinner loading-xs"></span> : 'Create Admin'}
        </button>
      </form>
    </div>
  );
}

export default function AdminProblems() {
  const dispatch = useDispatch();
  const { list, loading, adminLoading, adminError, adminMessage } = useSelector(
    (state) => state.problems
  );

  useEffect(() => {
    dispatch(fetchAllProblems());
  }, [dispatch]);

  useEffect(() => {
    if (adminMessage || adminError) {
      const t = setTimeout(() => dispatch(clearAdminStatus()), 4000);
      return () => clearTimeout(t);
    }
  }, [adminMessage, adminError, dispatch]);

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete "${title}" permanently?`)) {
      dispatch(deleteProblem(id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Manage Problems</h1>
          <p className="text-base-content/60 mt-1">Create, edit and delete problems</p>
        </div>
        <Link to="/admin/new" className="btn btn-primary">
          + New Problem
        </Link>
      </div>

      {adminMessage && (
        <div className="alert alert-success mb-4">
          <span>{adminMessage}</span>
        </div>
      )}
      {adminError && (
        <div className="alert alert-error mb-4">
          <span>{typeof adminError === 'string' ? adminError : 'Operation failed'}</span>
        </div>
      )}

      <CreateAdminCard />

      <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-medium text-base-content mb-2">No problems yet</h3>
            <p className="text-base-content/60 mb-6">Create your first problem to get started</p>
            <Link to="/admin/new" className="btn btn-primary">Create Problem</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Difficulty</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-base-content/70">Tag</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-base-content/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p._id} className="hover:bg-base-200/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-base-content">{p.title}</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-ghost badge-sm">{p.difficult}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-ghost badge-sm">{p.tags}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Link to={`/problem/${p._id}`} className="btn btn-ghost btn-sm">
                          View
                        </Link>
                        <Link to={`/admin/edit/${p._id}`} className="btn btn-outline btn-sm">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id, p.title)}
                          disabled={adminLoading}
                          className="btn btn-outline btn-error btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}