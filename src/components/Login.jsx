import React, { useState, useContext } from 'react';
// ייבוא קובץ התקשורת שיצרנו
import api from '../api/axiosInstance.js';
// ייבוא הקונטקסט כדי שנוכל להודיע לאפליקציה שהתחברנו בהצלחה
import { AuthContext } from '../App.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  // ניהול המצב של השדות בטופס
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // משיכת פונקציית ההתחברות מהקונטקסט הגלובלי
  const { login } = useContext(AuthContext);

  // פונקציה שמטפלת בשליחת הטופס
  const handleSubmit = async (e) => {
    // מונע מהדפדפן לרענן את העמוד בעת שליחת הטופס
    e.preventDefault();
    setError('');

    try {
      // שליחת בקשת התחברות לראוטר בשרת שלנו
      const response = await api.post('/auth/login', { id, password });
      
      // חילוץ הנתונים שהשרת מחזיר
      const { token, user } = response.data;

      // שמירת הטוקן בזיכרון המקומי של הדפדפן
      localStorage.setItem('token', token);

      // הפעלת פונקציית ההתחברות לעדכון הסטייט באפליקציה
      login(token, user);

    } catch (err) {
      // טיפול בשגיאות והצגתן למשתמש
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred during login. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to Your Account</h2>
      
      {/* הצגת הודעת שגיאה אם קיימת */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="id">
            ID Number
          </label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your ID"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          {/* הוספנו עטיפה יחסית (relative) לאינפוט כדי שנוכל למקם את האייקון בתוכה */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // הוספנו pr-10 כדי להשאיר מקום לאייקון מצד ימין בלי שהטקסט יעלה עליו
              className="shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
            {/* הכפתור של העין ממוקם אבסולוטית בתוך ה-div היחסי */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full transition duration-200"
          >
            Sign In
          </button>
        </div>
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500 transition">
              Sign up here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}