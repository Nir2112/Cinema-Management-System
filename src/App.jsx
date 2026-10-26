import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Film, User, LogOut, Settings } from 'lucide-react';
import api from './api/axiosInstance.js'; // ייבוא של ה-Axios שלנו

// ייבוא הקומפוננטות (Login, Home וכו' נשאר אותו דבר)
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Screenings from './components/Screenings.jsx';
import Booking from './components/Booking.jsx';
import Payment from './components/Payment.jsx';
import UserProfileDrawer from './components/UserProfileDrawer.jsx';
import Register from './components/Register.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

export const AuthContext = createContext(null);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // סטייט חדש שמונע מהאפליקציה "להבהב" כשהיא בודקת את המשתמש
  const [isInitializing, setIsInitializing] = useState(true);
  
  const navigate = useNavigate();

  // בדיקת טוקן בעליית האפליקציה (אחרי רענון)
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (error) {
        console.error("Token verification failed, logging out...");
        // אם הטוקן פג תוקף או שגוי, ננקה אותו
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    verifyUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // רץ פעם אחת בעליית העמוד

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    navigate('/');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    navigate('/');
  };

  // מסך טעינה קטן שלא מאפשר למשתמש להרגיש "מנותק" לשנייה אחת לפני שהנתונים חוזרים
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col w-full">
        
        <nav className="bg-slate-900 text-white p-4 shadow-lg w-full">
          <div className="w-full px-4 md:px-12 flex justify-between items-center">
            
            {/* שימוש ב-Link של הראוטר במקום onClick */}
            <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-blue-300 transition">
              <Film className="text-blue-400" />
              <span>Cinema-Web</span>
            </Link>

            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-1 hover:text-blue-400 transition">
                  <Settings size={18} />
                  Management
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-md transition text-white"
                  >
                    <User size={18} />
                    <span className="hidden md:inline font-medium">{user.name}</span>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition">
                  <User size={18} />
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="w-full px-4 md:px-12 mt-8 flex-grow">
          {/* הגדרת כל נתיבי האפליקציה */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/movie/:id" element={<Screenings />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<div className="p-8 text-center text-xl text-red-500">Page not found</div>} />
          </Routes>
        </main>

        {/* ה-Drawer מרונדר מחוץ למבנה הראשי כדי שיצוף מעל הכל */}
        <UserProfileDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
        />

      </div>
    </AuthContext.Provider>
  );
}