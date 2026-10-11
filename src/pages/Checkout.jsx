import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase, RAZORPAY_KEY_ID } from '../supabaseClient';
import { ArrowLeft, CreditCard, Banknote, CheckCircle } from 'lucide-react';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart = [], total = 0 } = location.state || {};

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tableOrRoom, setTableOrRoom] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/menu');
      return;
    }

    const fetchUserEmail = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email) {
        setEmail(authData.user.email);
      }
    };
    fetchUserEmail();
  }, [cart, navigate]);

  const saveOrderToDatabase = async (paymentId = 'CASH_PAYMENT') => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const newOrder = {
      customer_name: customerName,
      customer_email: email,
      phone: phone,
      table_or_room: tableOrRoom,
      items: cart,
      total: total,
      payment_method: paymentMethod,
      payment_id: paymentId,
      status: 'Pending',
      user_id: userId,
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) throw error;

    setOrderPlaced(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !email.trim() || !phone.trim() || !tableOrRoom.trim()) {
      alert('Please fill in all required delivery details.');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'Cash') {
        await saveOrderToDatabase('CASH');
        setLoading(false);
      } else {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: total * 100,
          currency: 'INR',
          name: 'Hotel Royal Shop',
          description: `Food Order for ${tableOrRoom}`,
          handler: async function (response) {
            try {
              await saveOrderToDatabase(response.razorpay_payment_id);
            } catch (err) {
              alert('Payment successful, but failed to save order: ' + err.message);
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: customerName,
            email: email,
            contact: phone,
          },
          theme: {
            color: '#d97706',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      alert('Failed to process order: ' + err.message);
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your order has been sent straight to the kitchen. Mode: <strong className="text-gray-900">{paymentMethod}</strong>.
          </p>
          <div className="space-y-3">
            <Link
              to="/my-orders"
              className="block w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition"
            >
              View Order Status
            </Link>
            <Link
              to="/menu"
              className="block w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm px-8 py-4 flex items-center space-x-3">
        <Link to="/menu" className="text-gray-600 hover:text-gray-900 p-2 rounded-xl bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-extrabold text-gray-900">Checkout & Payment</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handlePlaceOrder} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
            <h2 className="font-extrabold text-gray-900 text-base">Delivery Details</h2>

            <div>
              <label className="block text-xs font-black text-gray-900 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-900 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g., john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-900 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g., 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-900 mb-1">Table Number or Room Number *</label>
              <input
                type="text"
                required
                placeholder="e.g., Table 4 or Room 202"
                value={tableOrRoom}
                onChange={(e) => setTableOrRoom(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
            <h2 className="font-extrabold text-gray-900 text-base">Select Payment Method</h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition cursor-pointer ${
                  paymentMethod === 'Cash'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-900'
                }`}
              >
                <Banknote className={`h-6 w-6 ${paymentMethod === 'Cash' ? 'text-amber-600' : 'text-gray-500'}`} />
                <span className="font-extrabold text-sm">Cash on Delivery</span>
                <span className="text-[11px] font-medium text-gray-600">Pay cash at table / room</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Online')}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition cursor-pointer ${
                  paymentMethod === 'Online'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-900'
                }`}
              >
                <CreditCard className={`h-6 w-6 ${paymentMethod === 'Online' ? 'text-amber-600' : 'text-gray-500'}`} />
                <span className="font-extrabold text-sm">Razorpay Online</span>
                <span className="text-[11px] font-medium text-gray-600">UPI, Cards, Netbanking</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
            <h2 className="font-extrabold text-gray-900 text-base">Order Summary</h2>
            <div className="divide-y max-h-48 overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between text-sm">
                  <span className="text-gray-900 font-bold">
                    {item.name} <span className="text-amber-600 font-black">x{item.quantity}</span>
                  </span>
                  <span className="font-black text-gray-900">{'₹' + (item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-black text-gray-900 text-base">Total Amount</span>
              <span className="font-black text-amber-600 text-xl">{'₹' + total}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-amber-600/20 text-base cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing Payment...' : paymentMethod === 'Online' ? `Pay & Place Order (₹${total})` : `Place Order (₹${total})`}
          </button>
        </form>
      </div>
    </div>
  );
}