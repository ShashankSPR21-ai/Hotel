import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Utensils, Lock, Mail, ShieldAlert } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default role
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role, // Passes 'customer' or 'employee' to Supabase trigger
        }
      }
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      if (role === 'employee') {
        alert('Registration successful! Your staff account is pending approval from the store owner.');
        navigate('/login');
      } else {
        alert('Account created successfully!');
        navigate('/menu');
      }
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="bg-amber-600 text-white p-3 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center shadow-lg shadow-amber-600/30">
          <Utensils className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Create an Account</h2>
        <p className="mt-2 text-sm text-gray-600">Join Hotel Royal Shop today</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100">
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I want to register as a:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition cursor-pointer ${
                    role === 'customer' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition cursor-pointer ${
                    role === 'employee' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Employee / Staff
                </button>
              </div>
            </div>

            {role === 'employee' && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
                <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span>Employee accounts require manual confirmation from the store owner before you can log in.</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link to="/login" className="font-bold text-amber-600 hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}