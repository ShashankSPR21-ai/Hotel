import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Package, AlertCircle, History, Home, Eye, XCircle } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const navigate = useNavigate();

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData?.user) {
        navigate('/login');
        return;
      }

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

      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (!userIsStaff) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();

    // Real-time listener for order status changes
    const ordersChannel = supabase
      .channel('order-history-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrdersData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const handleActionOrder = async (orderId) => {
    if (isStaff) {
      const reason = prompt('Enter reason for rejecting this order:');
      if (reason === null) return; // User cancelled prompt

      setCancellingId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Rejected', rejection_reason: reason })
        .eq('id', orderId);

      if (error) {
        alert('Failed to reject order: ' + error.message);
      } else {
        fetchOrdersData();
      }
      setCancellingId(null);
    } else {
      if (!window.confirm('Are you sure you want to cancel this order?')) return;

      setCancellingId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Cancelled' })
        .eq('id', orderId);

      if (error) {
        alert('Failed to cancel order: ' + error.message);
      } else {
        fetchOrdersData();
      }
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link to="/" className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl transition flex items-center space-x-1 text-sm font-semibold">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link to={isStaff ? "/employee/orders" : "/menu"} className="text-gray-500 hover:text-gray-800 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {isStaff ? 'Store Order History' : 'My Order History'}
            </h1>
            <p className="text-xs text-gray-500">
              {isStaff ? 'Viewing all past store orders and transactions' : 'Your past purchases and status'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isStaff && (
            <Link
              to="/employee/orders"
              className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center space-x-2"
            >
              <History className="h-4 w-4" />
              <span>Live Dashboard</span>
            </Link>
          )}
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">Loading order history...</div>
        ) : errorMessage ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-bold text-base mb-1">Failed to load history</h3>
            <p className="text-sm">{errorMessage}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">No Orders Found</h3>
            <p className="text-gray-400 text-sm mb-6">There are no recorded orders to display in this history view.</p>
            <Link to={isStaff ? "/employee/orders" : "/menu"} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold">
              {isStaff ? 'Back to Dashboard' : 'Explore Menu'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border flex flex-col justify-between gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                        ID: {order.id.slice(0, 8)}...
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        order.status === 'Cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                      {isStaff && order.customer_name && (
                        <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                          👤 Customer: {order.customer_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Placed at: {new Date(order.created_at).toLocaleString()}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">📍 Location: {order.table_or_room}</p>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-amber-600 font-extrabold text-lg block">₹{order.total}</span>
                    {order.payment_method && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Paid via: {order.payment_method}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 mt-2">
                  <div className="text-xs font-bold text-gray-500 mb-2">Items Ordered:</div>
                  <div className="flex flex-wrap gap-2">
                    {order.items && Array.isArray(order.items) && order.items.map((item, idx) => (
                      <span key={idx} className="bg-gray-50 border text-gray-700 text-xs px-3 py-1 rounded-lg">
                        {item.name} <span className="font-bold text-amber-600">x{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {order.status === 'Rejected' && order.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Rejection Reason:</span> {order.rejection_reason}
                    </div>
                  </div>
                )}

                {/* Actions: Track Status & Reject/Cancel Option */}
                <div className="border-t pt-3 flex flex-wrap justify-between items-center gap-2">
                  <Link
                    to={`/order/${order.id}`}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Track Live Status</span>
                  </Link>

                  {order.status === 'Pending' && (
                    <button
                      onClick={() => handleActionOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-xl transition border border-red-200 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>
                        {cancellingId === order.id 
                          ? 'Processing...' 
                          : isStaff 
                            ? 'Reject Order' 
                            : 'Cancel Order'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}