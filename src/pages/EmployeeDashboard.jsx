import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChefHat, ClipboardList, XCircle, Home } from 'lucide-react';

export default function EmployeeDashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();

    const subscription = supabase
      .channel('public:orders-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        setOrders(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        setOrders(prev => prev.map(order => order.id === payload.new.id ? payload.new : order));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const updateOrderStatus = async (orderId, newStatus, rejectionReason = null) => {
    const updateData = { status: newStatus };
    if (rejectionReason) updateData.rejection_reason = rejectionReason;

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, ...updateData } : o));
    } else {
      alert('Failed to update order status.');
    }
  };

  const handleReject = (orderId) => {
    const reason = window.prompt('Please enter the reason for rejecting this order:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required.');
      return;
    }
    updateOrderStatus(orderId, 'Rejected', reason.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link to="/" className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl transition flex items-center space-x-1 text-sm font-semibold">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="bg-amber-600 text-white p-2.5 rounded-xl">
            <ChefHat className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">Kitchen & Staff Live Dashboard</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/login" className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
            Logout
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center space-x-2">
          <ClipboardList className="h-5 w-5 text-amber-600" />
          <span>Active Incoming Orders ({orders.filter(o => o.status !== 'Rejected' && o.status !== 'Completed' && o.status !== 'Cancelled').length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders
            .filter(order => order.status !== 'Rejected' && order.status !== 'Cancelled')
            .map(order => (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-gray-900">{order.customer_name}</h3>
                      <p className="text-sm font-semibold text-gray-600">📍 {order.table_or_room}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      order.status === 'Ready' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'Preparing' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="border-t border-b py-3 my-3 divide-y max-h-40 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">{item.name}</span>
                        <span className="font-bold text-amber-600">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t mb-2">
                    <button onClick={() => updateOrderStatus(order.id, 'Preparing')} className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white py-2 rounded-xl text-xs font-bold transition">Preparing</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white py-2 rounded-xl text-xs font-bold transition">Ready</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="bg-green-50 text-green-700 hover:bg-green-600 hover:text-white py-2 rounded-xl text-xs font-bold transition">Complete</button>
                  </div>
                  <button onClick={() => handleReject(order.id)} className="w-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1">
                    <XCircle className="h-4 w-4" />
                    <span>Reject Order</span>
                  </button>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}