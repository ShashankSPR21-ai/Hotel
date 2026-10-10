import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, ShieldCheck, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('customer'); // Role selection for signup
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // --- SIGN UP LOGIC ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role, // Passes 'customer' or 'employee' to your database trigger
          }
        }
      });

      setLoading(false);

      if (error) {
        alert('Sign up failed: ' + error.message);
      } else {
        if (role === 'employee') {
          alert('Registration successful! Your staff account is pending approval from the store owner.');
        } else {
          alert('Account created successfully!');
        }
        setIsSignUp(false); // Switch back to login view
      }
    } else {
      // --- LOGIN LOGIC ---
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setLoading(false);
        alert('Login failed: ' + error.message);
        return;
      }

      const user = data.user;

      // Check role and approval status in user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, approved')
        .eq('id', user.id)
        .single();

      setLoading(false);

      if (roleError || !roleData) {
        alert('Role profile not found. Please contact the owner.');
        return;
      }

      // Check if employee is approved by the owner
      if (roleData.role === 'employee' && !roleData.approved) {
        await supabase.auth.signOut();
        alert('Your staff account is still pending approval from the store owner. Please wait for confirmation.');
        return;
      }

      // Route based on role
      if (roleData.role === 'owner') {
        navigate('/admin/dashboard');
      } else if (roleData.role === 'employee') {
        navigate('/employee/orders');
      } else {
        navigate('/menu');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
            {isSignUp ? 'Create Account' : 'Secure Login'}
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="bg-amber-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-600/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {isSignUp ? 'Register New Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isSignUp ? 'Choose your account type below' : 'Enter your credentials to continue'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Role selection buttons (only shown when signing up) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I want to register as a:</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    role === 'customer' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    role === 'employee' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Employee / Staff
                </button>
              </div>

              {role === 'employee' && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-start space-x-2 text-xs text-amber-800 mb-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>Staff accounts require owner approval before you can log in.</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition shadow-lg shadow-amber-600/20 cursor-pointer"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Login')}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-sm text-gray-500 hover:text-amber-600 mt-6 cursor-pointer font-medium"
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}