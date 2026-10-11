import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Utensils, ArrowRight, ShieldCheck, Clock, MapPin, Shield, LogOut, Package, MessageSquare, Star, Send } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
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
          
        if (data) {
          setRole(data.role);
          if (data.role === 'owner') {
            fetchFeedbacks();
          }
        }
      }
    };
    checkUserAndRole();
  }, []);

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setFeedbacks(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    navigate('/');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user ? user.id : null,
      email: user ? user.email : 'Anonymous Customer',
      rating: rating,
      message: message.trim()
    });

    setSubmitting(false);

    if (error) {
      alert('Failed to submit feedback: ' + error.message);
    } else {
      alert('Thank you! Your feedback has been sent successfully to the store management.');
      setMessage('');
      setRating(5);
    }
  };

  const isStaff = role === 'owner' || role === 'employee';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Responsive Navbar */}
      <nav className="bg-white shadow-sm px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-600 text-white p-2 rounded-xl shadow-md shadow-amber-600/20">
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Hotel Royal Shop</span>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3">
          {/* Menu Button - Black background with white text */}
          <Link 
            to="/menu" 
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm"
          >
            Menu
          </Link>
          
          {/* My Orders / Store Orders Button - Black background with white text */}
          <Link 
            to="/my-orders" 
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <Package className="h-4 w-4" />
            <span>{isStaff ? 'Store Orders' : 'My Orders'}</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {role === 'owner' && (
                <Link
                  to="/admin/dashboard"
                  className="bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-1.5 hover:bg-amber-700 transition shadow-md shadow-amber-600/20"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 text-xs sm:text-sm font-bold shadow-sm"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-amber-600 text-white px-5 py-2 rounded-xl font-bold text-xs sm:text-sm hover:bg-amber-700 transition shadow-md shadow-amber-600/20"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div className="text-center md:text-left">
          <span className="inline-block bg-amber-100 text-amber-900 text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full shadow-xs">
            Welcome to Hotel Shop
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mt-4 leading-tight">
            Delicious Food, <span className="text-amber-600">Delivered Fresh</span> to Your Table or Room.
          </h1>
          <p className="text-gray-700 text-base sm:text-lg mt-4 font-medium leading-relaxed">
            Explore our curated menu ranging from hearty breakfasts to mouth-watering dinners. Order instantly and track your food in real-time.
          </p>
          <div className="mt-8 flex justify-center md:justify-start">
            <Link
              to="/menu"
              className="bg-amber-600 text-white px-6 py-3.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-amber-700 transition shadow-lg shadow-amber-600/30 text-sm sm:text-base cursor-pointer"
            >
              <span>Explore Menu</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Feature Cards Box */}
        <div className="bg-amber-100/70 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm flex flex-col justify-center space-y-4">
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
            <Clock className="h-7 w-7 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Lightning Fast Prep</h4>
              <p className="text-xs sm:text-sm text-gray-600">Sent straight to kitchen live</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
            <MapPin className="h-7 w-7 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Table & Room Delivery</h4>
              <p className="text-xs sm:text-sm text-gray-600">Directly where you are seated</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
            <ShieldCheck className="h-7 w-7 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">Hygienic & Fresh</h4>
              <p className="text-xs sm:text-sm text-gray-600">Prepared by master chefs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Section: Owner sees Customer Feedback Inbox, Customers see Feedback Form */}
      {role === 'owner' ? (
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 mb-16">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-amber-100 text-amber-700 p-2.5 rounded-2xl">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Owner Inbox: Customer Feedback</h3>
                <p className="text-sm text-gray-500">Review ratings and comments submitted by your customers.</p>
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No customer feedback received yet.</p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-700">{item.email}</span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < item.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-900 text-sm font-medium">{item.message}</p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 mb-16">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-amber-100 text-amber-700 p-2.5 rounded-2xl">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Share Your Feedback</h3>
                <p className="text-sm text-gray-500">Your comments go directly to the store owner.</p>
              </div>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Rate Your Experience</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Your Message or Suggestion</label>
                <textarea
                  required
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Let us know how we can improve our food or service..."
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 text-black font-semibold text-sm"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition shadow-md shadow-amber-600/20 flex items-center space-x-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Sending...' : 'Send Feedback'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}