import { Routes, Route, Navigate } from "react-router";
import { lazy, Suspense, Component } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import Submissions from "./pages/Submissions";
import SubmissionDetail from "./pages/SubmissionDetail";
import Profile from "./pages/Profile";
import AdminProblems from "./pages/AdminProblems";
import AdminProblemForm from "./pages/AdminProblemForm";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from "./authSlice";
import { useEffect } from "react";
import { Layout } from "./components/Layout";

// Lazy load ProblemDetail (includes CodeMirror - heavy bundle)
const ProblemDetail = lazy(() => import("./pages/ProblemDetail"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  );
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
          <div className="max-w-md text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-base-content mb-2">Something went wrong</h2>
            <p className="text-sm text-base-content/60 mb-6">
              {this.state.error?.message || 'Failed to load this page.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => window.location.reload()} className="btn btn-primary btn-sm">
                Reload
              </button>
              <a href="/" className="btn btn-ghost btn-sm">Back to Problems</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  return isAuthenticated ? children : <Navigate to="/signup" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  return isAuthenticated ? <Navigate to="/" /> : children;
}

function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signup" />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Homepage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/problem/:id"
        element={
          <ProtectedRoute>
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <ProblemDetail />
              </Suspense>
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/submissions"
        element={
          <ProtectedRoute>
            <Layout>
              <Submissions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/submissions/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <SubmissionDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <AdminProblems />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/new"
        element={
          <AdminRoute>
            <Layout>
              <AdminProblemForm />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/edit/:id"
        element={
          <AdminRoute>
            <Layout>
              <AdminProblemForm />
            </Layout>
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
      <AppRoutes />
    </>
  );
}

export default App;