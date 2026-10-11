import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep(2);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    setLoading(false);
    if (error) {
      setError('Invalid or expired verification code. Please try again.');
    } else {
      setStep(3);
    }
  };

  // Step 3: Create Password & Complete
  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      alert('Account registered successfully!');
      navigate('/menu');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold tracking-tight text-white text-center mb-2">
          {step === 1 && 'Create Account'}
          {step === 2 && 'Verify Your Email'}
          {step === 3 && 'Set Your Password'}
        </h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          {step === 1 && 'Enter your email to receive a secure verification code.'}
          {step === 2 && `We sent a 6-digit code to ${email}`}
          {step === 3 && 'Secure your account with a password to finish.'}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* STEP 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-55"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Enter 6-Digit Code</label>
              <input
                type="text"
                required
                maxLength="6"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center tracking-widest text-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-55"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* STEP 3: Password Form */}
        {step === 3 && (
          <form onSubmit={handleCreatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Create Password</label>
              <input
                type="password"
                required
                minLength="6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-55"
            >
              {loading ? 'Saving...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}