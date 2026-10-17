# CodeArena

A LeetCode-style coding practice platform. Browse problems, write solutions in an in-browser editor (C++, Java, JavaScript), run them against visible test cases, submit them for judging against hidden test cases, and track submissions and progress. Admins can create, edit, and delete problems plus manage admin users — all from the UI.

## Features

**Users**
- Register / login with JWT cookie sessions (strong-password validation)
- Problems list with search, difficulty filter, solved tracking, and progress bar
- Problem workspace: statement, examples, constraints, per-problem submissions tab
- CodeMirror 6 editor with syntax highlighting, language switcher, and reset-to-starter
- Run-before-submit flow — Submit unlocks only after a fully passing Run
- Run results per test case (pass/fail, time, stdout/stderr); submit verdicts (Accepted / Wrong Answer / Runtime Error)
- Submissions history with filters and a dedicated detail page (code, stats, error output)
- Profile with solved stats, difficulty mix, solved-problem links, logout, and password-confirmed account deletion

**Admins**
- `/admin` dashboard: problem table with view/edit/delete
- Problem create/edit form: statement, difficulty, topic tag, visible + hidden test cases, starter code and reference solutions per language (reference solutions are executed against visible tests on save)
- Create additional admin users from the UI

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router, Redux Toolkit, Tailwind CSS 4, DaisyUI, CodeMirror 6, react-hook-form + zod |
| Backend | Node.js, Express 5, Mongoose (MongoDB), Redis, JWT, bcrypt, axios |
| Code execution | Wandbox public API by default (free, no key); Judge0 via RapidAPI as fallback (`CODE_EXECUTOR=judge0`) |

## Project Structure

```
leet_code/
├── README.md
├── leetcode_backened/
│   └── src/
│       ├── index.js                # Express app, CORS, route mounting
│       ├── config/
│       │   ├── db.js               # MongoDB connect (+ legacy index cleanup)
│       │   └── redis.js            # Redis client (or no-op mock if unconfigured)
│       ├── models/
│       │   ├── user.js             # firstname, emailID, password hash, role, problemsolved[]
│       │   ├── problem.js          # title, description, difficulty, tag, test cases, starter + reference code
│       │   └── submission.js       # userId, problemId, code, language, status, runtime, memory, test counts
│       ├── middleware/
│       │   ├── usermiddleware.js    # JWT auth from cookie (+ Redis blocklist check)
│       │   ├── adminmiddleware.js   # Same + requires role admin (re-login after role change)
│       │   └── ratelimiter.js       # 10s per-user cooldown on submit (Redis)
│       ├── controllers/
│       │   ├── UserAuthent.js       # register, login, logout, admin register, delete profile (password-confirmed), auth check
│       │   ├── UserProblem.js       # problem CRUD, listings, solved/submission queries
│       │   └── UserSubmission.js    # run (visible tests) and submit (hidden tests)
│       ├── routes/
│       │   ├── UserAuth.js          # /auth/*
│       │   ├── ProbemCreator.js     # /problem/*
│       │   └── submit.js            # /code/*
│       └── utils/
│           ├── problemUtility.js    # code-runner adapter (Wandbox default, Judge0 fallback)
│           └── validator.js         # register payload validation
└── leetcode_fronted/
    └── src/
        ├── App.jsx                  # routes + auth/admin guards + error boundary (ProblemDetail lazy-loaded)
        ├── authSlice.js             # auth state (login/register/check/logout)
        ├── problemSlice.js          # problems, submissions, run/submit, admin CRUD state
        ├── api/problemApi.js        # all backend calls in one place
        ├── utils/axiosClient.js      # axios instance (baseURL localhost:3000, credentials on)
        ├── components/              # Layout (sidebar), CodeEditor, LanguageSelector, ProblemCard
        └── pages/                   # Homepage, ProblemDetail, Submissions, SubmissionDetail,
                                     # Profile, Login, Signup, AdminProblems, AdminProblemForm
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (Atlas connection string works)
- Redis (Redis Cloud works; required — the server waits for it at boot)

### 1. Backend

```bash
cd leetcode_backened
npm install
```

Create a `.env` file:

```env
PORT=3000
DB_STRING=mongodb+srv://<user>:<pass>@<cluster>/<db>
REDIS_HOST=<redis-host>
REDIS_PORT=<redis-port>
REDIS_PASSWORD=<redis-password>
SECRET_KEY=<long-random-secret>
# Optional: CODE_EXECUTOR defaults to "wandbox" (free, no key).
# Set CODE_EXECUTOR=judge0 and provide RAPIDAPI_KEY to use Judge0 instead.
RAPIDAPI_KEY=<rapidapi-key>
```

Run it:

```bash
npm run dev   # nodemon, or: npm start
```

You should see `DB Connected` followed by `listening at port number 3000`.

> Promoting a user to admin is done directly in the `users` collection (`role: "admin"`).
> That user must **log out and log back in** afterwards — the role is minted into the JWT at login time.

### 2. Frontend

```bash
cd leetcode_fronted
npm install
npm run dev   # http://localhost:5173 (strict port; 5174 also CORS-allowed)
```

The production build is code-split (CodeMirror loads only on the problem page):

```bash
npm run build
```

## API Reference

Base URL `http://localhost:3000`. Authenticated routes read the JWT from the `token` cookie (`withCredentials`).

**Auth — `/auth`**

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | — | `firstname, emailID, password` | `201 { user }` + cookie |
| POST | `/auth/login` | — | `emailID, password` | `201 { user }` + cookie |
| POST | `/auth/logout` | user | — | `200` text (token blocklisted) |
| POST | `/auth/admin/register` | admin | `firstname, emailID, password` | `201` text |
| DELETE | `/auth/deleteProfile` | user | `password` (confirmation) | `200` text, submissions wiped |
| GET | `/auth/check` | soft | — | `200 { user }` or `{ user: null }` (never 401, so no console noise) |

**Problems — `/problem`**

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/problem/create` | admin | Reference solutions are executed against visible tests; fails with the exact mismatch on error |
| PUT | `/problem/update/:id` | admin | Same reference validation |
| DELETE | `/problem/delete/:id` | admin | — |
| GET | `/problem/problemById/:id` | user | Statement, visible tests, starter code |
| GET | `/problem/getAllProblem` | user | `_id, title, description, difficult, tags` (`[]` when empty) |
| GET | `/problem/problemSolvedByUser` | user | Populated solved list |
| GET | `/problem/mySubmissions` | user | All own submissions, newest first, problem populated |
| GET | `/problem/submission/:id` | user | Single own submission (ownership-checked, 404 otherwise) |
| GET | `/problem/problemSolved/:pid` | user | Submissions for one problem |

**Code execution — `/code`**

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/code/run/:id` | user | `language, code` | `201` per-test results (`status_id, stdout, stderr, time`) |
| POST | `/code/submit/:id` | user + 10s cooldown | `language, code` | Saves verdict; marks solved only on `accepted` |

Status ids follow Judge0 convention: `3` accepted, `4` error, anything else wrong answer. Output comparison ignores trailing whitespace.

## Data & Constraints

- Difficulties: `easy | medium | hard` · Topic tags: `array | linkedList | graph | dp`
- Languages: `cpp | java | javascript` (Java is compiled as `Main`; a `public class Main` shim keeps Judge0-authored solutions working on Wandbox)
- Seeded content: 10 problems covering array, dp, linkedList, and graph topics, each with explained visible tests, hidden tests, and reference solutions in all three languages (validated by execution before insert)

## Notes & Limitations

- Free-tier code runners are shared services: expect slower runs under load and keep the per-user quotas in mind.
- JWTs live up to 12h; role changes require re-login. Cookies should be `httpOnly`/`Secure`/`SameSite` before any public deployment (see code comments), and reference solutions should be withheld from the public problem endpoint.
