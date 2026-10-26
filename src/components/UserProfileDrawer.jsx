import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Ticket, LogOut, Trash2, Edit2 } from 'lucide-react';
import api from '../api/axiosInstance.js';
import { AuthContext } from '../App.jsx';

export default function UserProfileDrawer({ isOpen, onClose }) {
  const { user, logout, login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('details'); 
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  
  // טעינת כל הנתונים ההתחלתיים מה-Context אל תוך הטופס
  const [formData, setFormData] = useState({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '' // סיסמה תמיד מתחילה ריקה
  });
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  // עדכון הטופס במקרה שהמשתמש משתנה ברקע
  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && activeTab === 'orders' && orders.length === 0) {
      fetchMyOrders();
    }
  }, [isOpen, activeTab]);

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await api.get(`/orders/user/${user._id}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error.response || error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMessage({ type: '', text: '' });
    
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }

    try {
      // תוקן: שימוש במרכאות הפוכות כדי שהמשתנה ישורשר נכון לכתובת
      const response = await api.put(`/users/update/${user.id}`, submitData);
      
      login(localStorage.getItem('token'), response.data.user || response.data);
      setIsEditing(false);
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => setUpdateMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setUpdateMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/delete/${user.id}`);
      
      alert("Account deleted successfully");
      
      // תוקן: קודם סוגרים את התפריט בעזרת onClose ואז מנתקים
      onClose(); 
      logout(); 
      
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error.response?.data?.message || "Failed to delete account");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={onClose}></div>

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden">
        
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-xl">{user?.name}</h2>
              <p className="text-blue-300 text-sm">{user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 font-semibold flex justify-center items-center gap-2 transition ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <User size={18} /> My Details
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-4 font-semibold flex justify-center items-center gap-2 transition ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Ticket size={18} /> My Orders
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-bold text-slate-800">Account Information</h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-semibold">
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>

              {updateMessage.text && (
                <div className={`p-3 rounded-md text-sm font-semibold ${updateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {updateMessage.text}
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">ID Number (T.Z)</label>
                    <input 
                      type="text" 
                      value={formData.id} 
                      onChange={(e) => setFormData({...formData, id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Password <span className="font-normal text-gray-400">(leave blank to keep current)</span></label>
                    <input 
                      type="password" 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition">Save Changes</button>
                    <button type="button" onClick={() => {
                      setIsEditing(false);
                      setUpdateMessage({ type: '', text: '' });
                    }} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md font-semibold hover:bg-gray-300 transition">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="font-semibold text-slate-800">{user?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-slate-800">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-semibold text-slate-800">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-semibold text-slate-800">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              )}

              <div className="pt-8 mt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-2 rounded-md font-bold hover:bg-red-600 hover:text-white transition"
                >
                  <Trash2 size={18} /> Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Order History</h3>
              
              {loadingOrders ? (
                <p className="text-center text-gray-500 mt-8">Loading your orders...</p>
              ) : orders.length === 0 ? (
                <div className="text-center bg-gray-50 p-6 rounded-lg border border-gray-200 mt-4">
                  <Ticket className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600">You haven't booked any tickets yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const movieTitle = order.screeningId?.movieId?.title || 'Unknown Movie';
                    const hallName = order.screeningId?.hallId?.name || 'Standard Hall';
                    const purchaseDate = new Date(order.purchaseDate).toLocaleDateString('en-GB');
                    const screeningDateObj = order.screeningId?.startTime ? new Date(order.screeningId.startTime) : null;
                    const screeningDate = screeningDateObj ? screeningDateObj.toLocaleDateString('en-GB') : 'N/A';
                    const screeningTime = screeningDateObj ? screeningDateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                    
                    return (
                      <div key={order._id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col gap-3 hover:shadow-md transition">
                        
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-lg text-slate-900">{movieTitle}</h4>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                            order.status === 'Used' ? 'bg-slate-100 text-slate-500' :
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="text-sm text-gray-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="mb-1">
                            <span className="text-slate-500 mr-1">Screening:</span> 
                            <span className="font-medium  text-slate-800">{screeningDate} {screeningTime && `at ${screeningTime}`}</span>
                          </p>
                          <p className="mb-1">
                            <span className="text-slate-500 mr-1">Hall:</span> 
                            <span className="font-medium text-slate-800">{hallName}</span>
                          </p>
                          <p>
                            <span className="text-slate-500 mr-1">Seats:</span> 
                            <span className="font-medium text-slate-800">{order.seats?.join(', ')}</span>
                          </p>
                        </div>

                        <div className="text-xs text-gray-400 flex justify-between items-end mt-1 pt-3 border-t border-gray-100">
                          <p>Purchased on: {purchaseDate}</p>
                          <p className="font-bold text-blue-600 text-sm">Total: {order.totalAmount} NIS</p>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={() => { onClose(); logout(); }}
            className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

      </div>
    </>
  );
}