import { NavLink } from 'react-router';

const difficultyStyles = {
  easy: 'bg-success/15 text-success',
  medium: 'bg-warning/15 text-warning',
  hard: 'bg-error/15 text-error',
};

const difficultyDots = {
  easy: 'bg-success',
  medium: 'bg-warning',
  hard: 'bg-error',
};

export function ProblemCard({ problem, solvedProblems = [] }) {
  const isSolved = solvedProblems.some((p) => p._id === problem._id);
  const difficulty = problem.difficult?.toLowerCase() || 'easy';

  return (
    <NavLink
      to={`/problem/${problem._id}`}
      className="group flex gap-4 bg-base-100 border border-base-300 rounded-2xl p-4 sm:p-5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 mt-0.5 ${
          isSolved ? 'bg-success/15 text-success' : 'bg-base-200 text-base-content/30'
        }`}
        title={isSolved ? 'Solved' : 'Not solved yet'}
      >
        {isSolved ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <span className="font-mono text-sm">{'</>'}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-base sm:text-[17px] text-base-content group-hover:text-primary transition-colors">
            {problem.title}
          </h3>
          {isSolved && (
            <span className="text-[11px] font-semibold text-success uppercase tracking-wide">
              Solved
            </span>
          )}
        </div>

        {problem.description && (
          <p className="text-[13px] sm:text-sm text-base-content/55 leading-relaxed mt-1 line-clamp-2">
            {problem.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${difficultyStyles[difficulty] || difficultyStyles.easy}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${difficultyDots[difficulty] || difficultyDots.easy}`} />
            {difficulty}
          </span>
          {problem.tags && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-base-200 text-base-content/60 capitalize">
              {problem.tags}
            </span>
          )}
        </div>
      </div>

      <span className="self-center text-base-content/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 text-xl">
        →
      </span>
    </NavLink>
  );
}