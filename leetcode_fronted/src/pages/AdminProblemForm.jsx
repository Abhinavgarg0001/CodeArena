import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router';
import {
  fetchProblemById,
  createProblem,
  updateProblem,
  clearAdminStatus,
  clearCurrentProblem,
} from '../problemSlice';

const LANGUAGES = ['cpp', 'java', 'javascript'];

const emptyForm = {
  title: '',
  description: '',
  difficult: 'easy',
  tags: 'array',
  visibleTestCases: [{ input: '', output: '', explanation: '' }],
  hiddenTestCases: [{ input: '', output: '' }],
  startCode: [
    { language: 'cpp', initialCode: '' },
    { language: 'java', initialCode: '' },
    { language: 'javascript', initialCode: '' },
  ],
  referenceCode: [
    { language: 'cpp', completeCode: '' },
    { language: 'java', completeCode: '' },
    { language: 'javascript', completeCode: '' },
  ],
};

export default function AdminProblemForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProblem, adminLoading, adminError, adminMessage } = useSelector(
    (state) => state.problems
  );

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(clearAdminStatus());
    dispatch(clearCurrentProblem());
    if (isEdit) {
      dispatch(fetchProblemById(id));
    }
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentProblem && currentProblem._id === id) {
      setForm({
        title: currentProblem.title || '',
        description: currentProblem.description || '',
        difficult: currentProblem.difficult || 'easy',
        tags: currentProblem.tags || 'array',
        visibleTestCases:
          currentProblem.visibleTestCases?.length > 0
            ? currentProblem.visibleTestCases
            : [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        startCode: LANGUAGES.map((lang) => ({
          language: lang,
          initialCode:
            currentProblem.startCode?.find((s) => s.language === lang)?.initialCode || '',
        })),
        referenceCode: LANGUAGES.map((lang) => ({
          language: lang,
          completeCode:
            currentProblem.referenceCode?.find((r) => r.language === lang)?.completeCode || '',
        })),
      });
    }
  }, [isEdit, currentProblem, id]);

  useEffect(() => {
    if (adminMessage) {
      const t = setTimeout(() => navigate('/admin'), 1200);
      return () => clearTimeout(t);
    }
  }, [adminMessage, navigate]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateCase = (key, index, field, value) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const addCase = (key, template) => setForm((f) => ({ ...f, [key]: [...f[key], template] }));

  const removeCase = (key, index) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));

  const updateCode = (key, language, field, value) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((c) => (c.language === language ? { ...c, [field]: value } : c)),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    if (form.visibleTestCases.some((t) => !t.input.trim() || !t.output.trim() || !t.explanation.trim())) {
      setFormError('Every visible test case needs input, output and explanation.');
      return;
    }
    if (form.hiddenTestCases.some((t) => !t.input.trim() || !t.output.trim())) {
      setFormError('Every hidden test case needs input and output.');
      return;
    }
    const filledReference = form.referenceCode.filter((r) => r.completeCode.trim());
    if (filledReference.length === 0) {
      setFormError('Provide at least one complete reference solution (it is validated against visible test cases).');
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      startCode: form.startCode.filter((s) => s.initialCode.trim()),
      referenceCode: filledReference,
    };

    if (isEdit) {
      dispatch(updateProblem({ id, data: payload }));
    } else {
      dispatch(createProblem(payload));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            {isEdit ? 'Edit Problem' : 'New Problem'}
          </h1>
          <p className="text-base-content/60 mt-1">
            {isEdit
              ? 'Update the problem. Reference solutions are re-validated on save.'
              : 'Reference solutions are validated against visible test cases on save.'}
          </p>
        </div>
        <Link to="/admin" className="btn btn-ghost">
          ← Back
        </Link>
      </div>

      {(formError || adminError) && (
        <div className="alert alert-error mb-4">
          <span>{formError || (typeof adminError === 'string' ? adminError : 'Save failed')}</span>
        </div>
      )}
      {adminMessage && (
        <div className="alert alert-success mb-4">
          <span>{adminMessage} — redirecting…</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-base-content">Basics</h2>
          <div>
            <label className="label"><span className="label-text">Title</span></label>
            <input
              className="input input-bordered w-full"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Two Sum"
            />
          </div>
          <div>
            <label className="label"><span className="label-text">Description</span></label>
            <textarea
              className="textarea textarea-bordered w-full h-32"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Problem statement, examples, constraints…"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label"><span className="label-text">Difficulty</span></label>
              <select
                className="select select-bordered w-full"
                value={form.difficult}
                onChange={(e) => set('difficult', e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label"><span className="label-text">Tag</span></label>
              <select
                className="select select-bordered w-full"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
              >
                <option value="array">Array</option>
                <option value="linkedList">Linked List</option>
                <option value="graph">Graph</option>
                <option value="dp">DP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base-content">Visible Test Cases</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => addCase('visibleTestCases', { input: '', output: '', explanation: '' })}
            >
              + Add
            </button>
          </div>
          {form.visibleTestCases.map((t, i) => (
            <div key={i} className="bg-base-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge badge-outline">Case {i + 1}</span>
                {form.visibleTestCases.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => removeCase('visibleTestCases', i)}>
                    Remove
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <textarea className="textarea textarea-bordered h-20 font-mono text-sm" placeholder="Input (stdin)" value={t.input} onChange={(e) => updateCase('visibleTestCases', i, 'input', e.target.value)} />
                <textarea className="textarea textarea-bordered h-20 font-mono text-sm" placeholder="Expected output" value={t.output} onChange={(e) => updateCase('visibleTestCases', i, 'output', e.target.value)} />
              </div>
              <input className="input input-bordered w-full" placeholder="Explanation" value={t.explanation} onChange={(e) => updateCase('visibleTestCases', i, 'explanation', e.target.value)} />
            </div>
          ))}
        </div>

        <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base-content">Hidden Test Cases</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => addCase('hiddenTestCases', { input: '', output: '' })}
            >
              + Add
            </button>
          </div>
          {form.hiddenTestCases.map((t, i) => (
            <div key={i} className="bg-base-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge badge-outline">Case {i + 1}</span>
                {form.hiddenTestCases.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => removeCase('hiddenTestCases', i)}>
                    Remove
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <textarea className="textarea textarea-bordered h-20 font-mono text-sm" placeholder="Input (stdin)" value={t.input} onChange={(e) => updateCase('hiddenTestCases', i, 'input', e.target.value)} />
                <textarea className="textarea textarea-bordered h-20 font-mono text-sm" placeholder="Expected output" value={t.output} onChange={(e) => updateCase('hiddenTestCases', i, 'output', e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-base-content">Starter Code (shown in editor)</h2>
          {form.startCode.map((s) => (
            <div key={s.language}>
              <label className="label"><span className="label-text font-mono">{s.language}</span></label>
              <textarea
                className="textarea textarea-bordered w-full h-28 font-mono text-sm"
                placeholder={`Starter template for ${s.language} (optional)`}
                value={s.initialCode}
                onChange={(e) => updateCode('startCode', s.language, 'initialCode', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-base-content">Reference Solutions (at least one required)</h2>
          {form.referenceCode.map((r) => (
            <div key={r.language}>
              <label className="label"><span className="label-text font-mono">{r.language}</span></label>
              <textarea
                className="textarea textarea-bordered w-full h-36 font-mono text-sm"
                placeholder={`Complete working solution in ${r.language}`}
                value={r.completeCode}
                onChange={(e) => updateCode('referenceCode', r.language, 'completeCode', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Link to="/admin" className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={adminLoading}>
            {adminLoading ? <span className="loading loading-spinner loading-sm"></span> : isEdit ? 'Save Changes' : 'Create Problem'}
          </button>
        </div>
      </form>
    </div>
  );
}