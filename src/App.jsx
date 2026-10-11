import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import OrderStatus from './pages/OrderStatus';
import Login from './pages/Login';
import Register from './pages/Register'; // <-- Import Register page
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import OrderHistory from './pages/OrderHistory';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans antialiased">
      <Router>
        <div className="mx-auto flex min-h-screen flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-status/:id" element={<OrderStatus />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} /> {/* <-- Add Register route */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/employee/orders" element={<EmployeeDashboard />} />
            <Route path="/my-orders" element={<OrderHistory />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;