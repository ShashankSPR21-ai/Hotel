import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle2, Clock, ChefHat, Utensils, Home, XCircle, AlertCircle } from 'lucide-react';

export default function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Fetch initial order details from Supabase
  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setOrder(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();

    // Listen to ALL updates on the orders table globally, then filter for this specific ID.
    // This bypasses strict backend channel filter mismatches.
    const orderChannel = supabase
      .channel(`public:orders-tracker-page-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('⚡ Realtime update received on tracking page:', payload.new);
          if (payload.new && payload.new.id === id) {
            console.log('✅ Match found! Updating state...');
            setOrder(payload.new);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Realtime subscription status:', status);
        if (err) console.error('Realtime error:', err);
      });

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('id', id);

    if (error) {
      alert('Failed to cancel order.');
      setCancelling(false);
    } else {
      setOrder((prev) => ({ ...prev, status: 'Cancelled' }));
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <p className="text-gray-400 font-medium">Loading live order tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't locate order ID: {id}</p>
        <Link to="/menu" className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold">
          Back to Menu
        </Link>
      </div>
    );
  }

  // If order was rejected by the kitchen/staff
  if (order.status === 'Rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center px-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4 shadow-sm">
          <XCircle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Order Rejected</h2>
        <p className="text-gray-600 mb-4 max-w-md">
          Unfortunately, the restaurant had to reject your order.
        </p>
        {order.rejection_reason && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-6 max-w-md w-full text-sm shadow-sm text-left">
            <span className="font-extrabold block mb-1 flex items-center space-x-1 text-red-900">
              <AlertCircle className="h-4 w-4 inline mr-1" /> Reason Provided:
            </span>
            <p className="italic">{order.rejection_reason}</p>
          </div>
        )}
        <Link to="/menu" className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition">
          Return to Menu
        </Link>
      </div>
    );
  }

  // If order was cancelled by the customer
  if (order.status === 'Cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center px-4">
        <div className="bg-gray-100 text-gray-600 p-4 rounded-full mb-4">
          <XCircle className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Cancelled</h2>
        <p className="text-gray-500 mb-6">This order has been cancelled successfully.</p>
        <Link to="/menu" className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition">
          Return to Menu
        </Link>
      </div>
    );
  }

  const statuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
  const currentStepIndex = statuses.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center border-b pb-6 mb-6">
          <div>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Live Tracker
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-2">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-gray-500">
              Placed at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Link to="/menu" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition">
            <Home className="h-4 w-4" />
            <span>Order More</span>
          </Link>
        </div>

        {/* Status Tracker Bar */}
        <div className="mb-8 bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
          <h3 className="font-bold text-gray-800 mb-4 text-center">
            Current Status: <span className="text-amber-600 uppercase">{order.status}</span>
          </h3>
          <div className="flex justify-between relative">
            {statuses.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    isCompleted ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index === 0 && <Clock className="h-5 w-5" />}
                    {index === 1 && <ChefHat className="h-5 w-5" />}
                    {index === 2 && <Utensils className="h-5 w-5" />}
                    {index === 3 && <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-semibold mt-2 ${isCompleted ? 'text-amber-900' : 'text-gray-400'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer & Location Details */}
        <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-2xl text-sm">
          <div>
            <span className="text-gray-500 block">Customer Name</span>
            <span className="font-bold text-gray-800">{order.customer_name}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Delivery Location</span>
            <span className="font-bold text-amber-600">{order.table_or_room}</span>
          </div>
        </div>

        {/* Ordered Items List */}
        <h3 className="font-bold text-gray-800 mb-3">Items Ordered</h3>
        <div className="divide-y border rounded-2xl px-4 mb-6">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center text-sm">
              <div>
                <span className="font-bold text-gray-800">{item.name}</span>
                <span className="text-gray-500 block text-xs">Qty: {item.quantity}</span>
              </div>
              <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center font-black text-xl border-t pt-4 mb-6">
          <span>Total Paid:</span>
          <span className="text-amber-600">₹{order.total}</span>
        </div>

        {/* Cancel Button (Only available if status is still 'Pending') */}
        {order.status === 'Pending' && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl transition border border-red-200 text-sm flex items-center justify-center space-x-2"
          >
            <XCircle className="h-5 w-5" />
            <span>{cancelling ? 'Cancelling Order...' : 'Cancel Order'}</span>
          </button>
        )}
      </div>
    </div>
  );
}