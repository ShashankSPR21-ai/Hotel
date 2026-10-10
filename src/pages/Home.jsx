import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Utensils, ArrowRight, ShieldCheck, Clock, MapPin, Shield, LogOut, Package } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (data) setRole(data.role);
      }
    };
    checkUserAndRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    navigate('/');
  };

  const isStaff = role === 'owner' || role === 'employee';

  return (
    <div className="min-h-screen bg-amber-50/30">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-600 text-white p-2 rounded-xl">
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-gray-800">Hotel Royal Shop</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/menu" className="text-gray-600 hover:text-amber-600 font-medium">Menu</Link>
          
          <Link to="/my-orders" className="text-gray-600 hover:text-amber-600 font-medium flex items-center space-x-1">
            <Package className="h-4 w-4" />
            <span>{isStaff ? 'Store Orders' : 'My Orders'}</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-3">
              {role === 'owner' && (
                <Link
                  to="/admin/dashboard"
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-1.5 hover:bg-amber-700 transition shadow-md"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition cursor-pointer flex items-center space-x-1 text-sm font-semibold"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition"
            >
              Staff / Owner Login
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full">
            Welcome to Hotel Shop
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-4 leading-tight">
            Delicious Food, <span className="text-amber-600">Delivered Fresh</span> to Your Table or Room.
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Explore our curated menu ranging from hearty breakfasts to mouth-watering dinners. Order instantly and track your food in real-time.
          </p>
          <div className="mt-8 flex space-x-4">
            <Link
              to="/menu"
              className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover:bg-amber-700 transition shadow-lg shadow-amber-600/20"
            >
              <span>Explore Menu</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="bg-amber-200/50 rounded-3xl p-8 border border-amber-300 shadow-inner flex flex-col justify-center space-y-6">
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <h4 className="font-bold text-gray-800">Lightning Fast Prep</h4>
              <p className="text-sm text-gray-500">Sent straight to kitchen live</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm">
            <MapPin className="h-8 w-8 text-amber-600" />
            <div>
              <h4 className="font-bold text-gray-800">Table & Room Delivery</h4>
              <p className="text-sm text-gray-500">Directly where you are seated</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm">
            <ShieldCheck className="h-8 w-8 text-amber-600" />
            <div>
              <h4 className="font-bold text-gray-800">Hygienic & Fresh</h4>
              <p className="text-sm text-gray-500">Prepared by master chefs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}