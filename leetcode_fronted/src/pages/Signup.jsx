import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { registerUser } from '../authSlice'
import { useEffect } from 'react';

const signupSchema = z.object({
  firstname: z.string().min(3, "Minimum character should be 3"),
  emailID: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak")
});

function Signup() {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-3xl">CodeArena</h2>
          {error && (
            <div className="alert alert-error mt-4">
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>

            <div className="form-control">
              <label className="label mb-1">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                autoComplete="given-name"
                placeholder="John"
                className={`input input-bordered ${errors.firstname && 'input-error'}`}
                {...register('firstname')}
              />
              {errors.firstname && (
                <span className="text-error">{errors.firstname.message}</span>
              )}
            </div>

            <div className="form-control  mt-4">
              <label className="label mb-1">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                className={`input input-bordered ${errors.emailID && 'input-error'}`}
                {...register('emailID')}
              />
              {errors.emailID && (
                <span className="text-error">{errors.emailID.message}</span>
              )}
            </div>

            <div className="form-control mt-4">
              <label className="label mb-1">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={`input input-bordered ${errors.password && 'input-error'}`}
                {...register('password')}
              />
              {errors.password && (
                <span className="text-error">{errors.password.message}</span>
              )}
            </div>

            <div className="form-control mt-6 flex justify-center">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign Up'}
              </button>
            </div>

            <div className="form-control mt-6 text-center">
              <span className="text-base-content/60">Already have an account? </span>
              <Link to="/login" className="link link-primary">Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;