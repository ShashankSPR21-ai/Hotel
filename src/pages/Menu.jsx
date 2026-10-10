import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ShoppingBag, Search, Home, Package } from 'lucide-react';

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: menuData, error: menuError } = await supabase.from('menu_items').select('*');
      if (!menuError && menuData) {
        setMenuItems(menuData);
      }

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const userId = authData.user.id;
        const userEmail = authData.user.email;

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        const userIsStaff = 
          (roleData && (roleData.role === 'owner' || roleData.role === 'employee')) || 
          userEmail === 'owner@hotel.com';

        setIsStaff(userIsStaff);
      }

      setLoading(false);
    };

    fetchInitialData();
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    navigate('/checkout', { state: { cart, total: cartTotal } });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-30 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link to="/" className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl transition flex items-center space-x-1 text-sm font-semibold">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <h1 className="text-xl font-black text-gray-900">Hotel Menu</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/my-orders"
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition"
          >
            <Package className="h-4 w-4" />
            <span>{isStaff ? 'Store Orders' : 'My Orders'}</span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/login');
            }}
            className="text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl cursor-pointer transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-amber-600 text-white shadow-sm' : 'bg-white border text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading menu items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border shadow-sm">
            <p className="text-gray-500 font-medium">No dishes found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const cartItem = cart.find((i) => i.id === item.id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <div key={item.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col justify-between">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-extrabold text-lg text-gray-900">{item.name}</h3>
                        <span className="text-amber-600 font-black text-lg">₹{item.price}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-xs font-bold text-gray-400 uppercase">{item.category}</span>
                      {quantity === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex items-center space-x-3 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-amber-800 font-bold px-2 py-0.5 rounded hover:bg-amber-200"
                          >
                            -
                          </button>
                          <span className="font-bold text-amber-900 text-sm">{quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="text-amber-800 font-bold px-2 py-0.5 rounded hover:bg-amber-200"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-6 py-4 flex justify-between items-center max-w-4xl mx-auto rounded-t-3xl z-40">
          <div>
            <span className="text-xs text-gray-500 block">Total Items: {cart.reduce((s, i) => s + i.quantity, 0)}</span>
            <span className="text-xl font-black text-gray-900">₹{cartTotal}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3 rounded-2xl shadow-md transition flex items-center space-x-2"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Proceed to Checkout</span>
          </button>
        </div>
      )}
    </div>
  );
}