import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Printer, Home } from 'lucide-react';
import api from '../api/axiosInstance.js';


export default function Payment() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // משיכת הנתונים שהעברנו מעמוד ההזמנה
  const { order, movie, screening, seats, totalAmount } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // סימולציית שדות אשראי 
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  // הגנה מפני גישה ישירה ל-URL ללא נתונים
  if (!order || !movie || !screening) {
    navigate('/');
    return null;
  }

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'expiry') {
      // מוודאים שהמשתמש מקליד קדימה (ולא לוחץ על מחיקה/Backspace)
      if (value.length > cardDetails.expiry.length) {
        // מנקים הכל חוץ ממספרים כדי למנוע אותיות
        const cleanValue = value.replace(/\D/g, '');
        
        // ברגע שיש 2 ספרות (או יותר), מחלקים ומוסיפים לוכסן
        if (cleanValue.length >= 2) {
          value = `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
        } else {
          value = cleanValue;
        }
      }
    }

    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. ולידציה של התוקף (MM/YY)
    const [month, year] = cardDetails.expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setError('Invalid expiry format. Please enter MM/YY.');
      return;
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = parseInt(new Date().getFullYear().toString().slice(-2), 10);
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);

    if (expMonth < 1 || expMonth > 12) {
      setError('Invalid month. Please enter a month between 01 and 12.');
      return;
    }

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      setError('Card has expired. Please use a valid card.');
      return;
    }

    setIsProcessing(true);

    try {
      // 2. דימוי השהיה של 2.5 שניות לעיבוד אשראי מול חברת סליקה
      await new Promise(resolve => setTimeout(resolve, 2500));

      // שליחת בקשת אישור לשרת לשנות את סטטוס ההזמנה ל-Completed
      await api.put(`/orders/confirm/${orderId}`);
      
      setSuccess(true);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again or contact support.');
      setIsProcessing(false);
    }
  };

  const screeningDate = new Date(screening.startTime);
  const dateString = screeningDate.toLocaleDateString('en-GB');
  const timeString = screeningDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

 // תצוגת מסך הצלחה - כרטיס קולנוע דיגיטלי
  if (success) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10 p-4 md:p-8">
        
        {/* אזור הכרטיס עצמו - יושפע מההדפסה */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden relative">
          
          {/* עיצוב חצי עיגול בשוליים לדמות תלוש כרטיס אמיתי */}
          <div className="absolute left-0 top-1/2 -mt-4 -ml-4 w-8 h-8 bg-slate-50 rounded-full border-r border-gray-200 hidden md:block"></div>
          <div className="absolute right-0 top-1/2 -mt-4 -mr-4 w-8 h-8 bg-slate-50 rounded-full border-l border-gray-200 hidden md:block"></div>

          {/* ראש הכרטיס */}
          <div className="bg-slate-900 text-white p-6 text-center">
            <h2 className="text-3xl font-extrabold tracking-widest uppercase">Cinema-Web Ticket</h2>
            <p className="text-slate-400 mt-1 text-sm font-mono">Order ID: {orderId}</p>
          </div>

          {/* גוף הכרטיס */}
          <div className="p-8 flex flex-col md:flex-row gap-8 items-center border-b-2 border-dashed border-gray-200">
            {movie.posterUrl && (
              <img src={movie.posterUrl} alt={movie.title} className="w-32 h-48 object-cover rounded-xl shadow-md" />
            )}
            
            <div className="flex-1 space-y-5 w-full">
              <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{movie.title}</h3>
                <span className="inline-block bg-slate-100 rounded-full px-3 py-1 text-xs font-bold text-slate-600">
                  {movie.durationInMinutes} min • {movie.ageRating}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Date & Time</p>
                  <p className="text-lg font-bold text-slate-800">{dateString} <span className="text-blue-600">{timeString}</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Hall</p>
                  <p className="text-lg font-bold text-slate-800">{screening.hallId?.name || 'Standard Hall'}</p>
                </div>
                <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Reserved Seats</p>
                  <p className="text-2xl font-black text-blue-800">{seats.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* ברקוד פיקטיבי מעוצב (CSS) */}
            <div className="w-full md:w-auto flex flex-col items-center justify-center pt-4 md:pt-0 md:pl-8 md:border-l-2 md:border-dashed md:border-gray-200">
              <div className="flex gap-[3px] h-20 items-center justify-center opacity-80">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className={`bg-slate-900 ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-2' : 'w-[2px]'} ${i % 4 === 0 ? 'h-20' : 'h-16'}`}></div>
                ))}
              </div>
              <p className="font-mono tracking-[0.3em] mt-2 text-sm text-slate-800 font-bold">
                {orderId.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-green-600 font-bold mt-1">PAID - {totalAmount} ₪</p>
            </div>
          </div>
        </div>

        {/* כפתורי פעולה - print:hidden מעלים אותם בזמן הדפסה/שמירה כ-PDF */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition shadow-sm hover:shadow-lg hover:-translate-y-1"
          >
            <Printer size={22} /> Print / Save as PDF
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="bg-white hover:bg-gray-50 text-slate-800 border border-gray-200 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition shadow-sm hover:shadow-md hover:-translate-y-1"
          >
            <Home size={22} /> Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-12 mb-16 max-w-[1400px] mx-auto">

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* צד שמאל - סיכום ההזמנה */}
        <div className="w-full lg:w-1/3">
          <div className="bg-slate-900 text-white p-6 rounded-t-xl shadow-md">
            <h2 className="text-2xl font-bold mb-1">Order Summary</h2>
            <p className="text-gray-400 text-sm">Order ID: {orderId}</p>
          </div>
          <div className="bg-white p-6 rounded-b-xl shadow-lg border border-gray-200">
            <div className="flex gap-4 mb-6 border-b border-gray-100 pb-6">
              {movie.posterUrl && (
                <img src={movie.posterUrl} alt={movie.title} className="w-24 h-36 object-cover rounded-md shadow-sm" />
              )}
              <div>
                <h3 className="font-bold text-xl text-slate-800 mb-1">{movie.title}</h3>
                <p className="text-gray-600 text-sm mb-1">{dateString} at {timeString}</p>
                <p className="text-gray-600 text-sm">{screening.hallId?.name || 'Standard Hall'}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets ({seats.length}):</span>
                <span className="font-semibold text-slate-800">{seats.join(', ')}</span>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-slate-800">Total to Pay:</span>
              <span className="text-3xl font-black text-green-600">{totalAmount} NIS</span>
            </div>
          </div>
        </div>

        {/* צד ימין - טופס התשלום */}
        <div className="w-full lg:w-2/3 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-slate-800 mb-8 border-b border-gray-100 pb-4">Payment Details</h2>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 font-medium">{error}</div>}

          <form onSubmit={handlePaymentSubmit} className="space-y-6 max-w-lg">
            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Name on Card</label>
              <input
                type="text"
                id="name"
                name="name"
                value={cardDetails.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="number">Card Number</label>
              <input
                type="text"
                id="number"
                name="number"
                value={cardDetails.number}
                onChange={handleInputChange}
                required
                maxLength="16"
                pattern="\d{16}"
                title="Please enter a valid 16-digit card number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm tracking-widest"
                placeholder="0000 0000 0000 0000"
              />
            </div>

            <div className="flex gap-6">
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-2" htmlFor="expiry">Expiry Date</label>
                <input
                  type="text"
                  id="expiry"
                  name="expiry"
                  value={cardDetails.expiry}
                  onChange={handleInputChange}
                  required
                  placeholder="MM/YY"
                  maxLength="5"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700 font-semibold mb-2" htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={handleInputChange}
                  required
                  maxLength="3"
                  pattern="\d{3}"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                  placeholder="123"
                />
              </div>
            </div>

            <div className="pt-4 mt-8 border-t border-gray-100">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-xl text-white transition-all duration-300 ${
                  isProcessing 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </span>
                ) : (
                  `Pay ${totalAmount} NIS`
                )}
              </button>
              <p className="text-center text-sm text-gray-400 mt-4">
                This is a secure, encrypted mock payment gateway.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}