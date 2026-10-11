import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Utensils, Plus, Trash2, Users, CheckCircle, Home, Upload } from 'lucide-react';

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: 'Breakfast',
    price: '',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('*')
      .order('id', { ascending: false });

    if (menuData) setMenuItems(menuData);

    const { data: empData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'employee')
      .eq('approved', false);

    if (empData) setPendingEmployees(empData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert('Please fill in required fields.');
      return;
    }

    setUploading(true);
    let imageUrl = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400';

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `dish-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        alert('Error uploading image: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('menu_items')
      .insert([{
        name: form.name,
        category: form.category,
        price: Number(form.price),
        description: form.description,
        image: imageUrl,
        in_stock: true
      }]);

    if (error) {
      alert('Error adding dish: ' + error.message);
    } else {
      alert('Dish successfully added to the live menu!');
      setForm({ name: '', category: 'Breakfast', price: '', description: '' });
      setImageFile(null);
      setImagePreview('');
      fetchData();
    }
    setUploading(false);
  };

  const toggleStock = async (id, currentStockStatus) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ in_stock: !currentStockStatus })
      .eq('id', id);

    if (!error) fetchData();
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dish?')) return;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (!error) fetchData();
  };

  const handleApproveEmployee = async (userId) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ approved: true })
      .eq('id', userId);

    if (!error) {
      alert('Employee approved successfully!');
      fetchData();
    } else {
      alert('Error approving employee: ' + error.message);
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
          <div className="bg-amber-600 text-white p-2.5 rounded-xl">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Owner Admin Dashboard</h1>
            <p className="text-xs text-gray-500">Manage live database menu items, stock status, and staff approvals</p>
          </div>
        </div>
        <div className="space-x-3 flex items-center">
          <Link to="/menu" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
            View Live Menu
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <Users className="h-5 w-5 text-amber-600" />
            <span>Pending Employee Access Requests ({pendingEmployees.length})</span>
          </h2>

          {pendingEmployees.length === 0 ? (
            <p className="text-sm text-gray-400">No pending staff registrations right now.</p>
          ) : (
            <div className="divide-y">
              {pendingEmployees.map((emp) => (
                <div key={emp.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.email}</p>
                    <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-semibold">Waiting for Owner Approval</span>
                  </div>
                  <button
                    onClick={() => handleApproveEmployee(emp.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve Staff</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Plus className="h-5 w-5 text-amber-600" />
              <span>Add New Food Item</span>
            </h2>

            <form onSubmit={handleAddDish} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Paneer Tikka"
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 text-gray-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 bg-white text-gray-900 font-semibold"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="150"
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 text-gray-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of ingredients..."
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 text-gray-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Image (From Device)</label>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Choose File</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imageFile && <span className="text-xs text-gray-500 truncate max-w-[150px]">{imageFile.name}</span>}
                </div>
                {imagePreview && (
                  <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Uploading & Adding...' : 'Add Dish to Live Menu'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Manage Menu Catalog ({menuItems.length} Items)</h2>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading catalog from database...</div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No menu items found. Add your first dish using the form!</div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {menuItems.map(item => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover bg-gray-100" />
                      <div>
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">{item.category}</span>
                        <p className="text-amber-600 font-extrabold text-sm mt-1">₹{item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => toggleStock(item.id, item.in_stock)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          item.in_stock ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {item.in_stock ? 'In Stock' : 'Out of Stock'}
                      </button>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}