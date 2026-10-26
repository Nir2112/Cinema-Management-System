import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axiosInstance.js';
import { AuthContext } from '../App.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const movie = location.state?.movie;
  const screening = location.state?.screening;

  const { user } = useContext(AuthContext);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // -- התוספת: סטייט לשמירת הנתונים החיים מהשרת --
  const [liveScreening, setLiveScreening] = useState(screening);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -- התוספת: פונקציה למשיכת המושבים בלייב --
  const fetchLiveSeats = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get(`/screenings/${screening._id}`);
      setLiveScreening(response.data);
      
      // מסנן אוטומטית מושבים שהמשתמש בחר אם הם בדיוק נתפסו
      setSelectedSeats(prev => prev.filter(seatId => !response.data.bookedSeats.includes(seatId)));
    } catch (err) {
      console.error('Failed to load live seats', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // -- התוספת: הרצת המשיכה החיה מיד כשהעמוד נטען --
  useEffect(() => {
    if (screening) {
      fetchLiveSeats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-16 bg-white p-12 rounded-xl shadow-md text-center border border-gray-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-8 text-lg">You must be logged in to book tickets and select seats.</p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            Cancel
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!movie || !screening) {
    navigate('/');
    return null;
  }

  const hall = screening.hallId; 
  const TICKET_PRICE = screening.price || 0; 
  
  // -- התוספת: שימוש בנתונים החיים במקום הנתונים הקפואים --
  const takenSeats = liveScreening?.bookedSeats || []; 

  const numRows = hall?.seatLayout?.rows || 8;
  const numCols = hall?.seatLayout?.seatsPerRow || 10;
  
  const rows = Array.from({ length: numRows }, (_, i) => String.fromCharCode(65 + i));
  const cols = Array.from({ length: numCols }, (_, i) => i + 1);

  const handleSeatClick = (seatId) => {
    if (takenSeats.includes(seatId)) return;

    setSelectedSeats((prevSelected) => {
      if (prevSelected.includes(seatId)) {
        return prevSelected.filter(id => id !== seatId);
      } else {
        return [...prevSelected, seatId];
      }
    });
  };

  const handleCheckout = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat to continue.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const response = await api.post('/orders/create', {
        screeningId: screening._id,
        seats: selectedSeats,
        totalAmount: selectedSeats.length * TICKET_PRICE 
      });

      const createdOrder = response.data.order || response.data;
      
      navigate(`/payment/${createdOrder._id}`, { 
        state: { 
          order: createdOrder,
          movie: movie,
          screening: liveScreening, // שימוש בנתונים המעודכנים להעברה
          seats: selectedSeats,
          totalAmount: selectedSeats.length * TICKET_PRICE
        } 
      });
      
    } catch (err) {
      // -- התוספת: טיפול חכם בשגיאת התנגשות מושבים --
      if (err.response?.status === 409) {
        setError('Some of your selected seats were just booked by someone else. The map has been updated.');
        fetchLiveSeats(); // ריענון המפה למשתמש
      } else {
        setError(err.response?.data?.message || 'Failed to create order. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const screeningDate = new Date(screening.startTime);
  const dateString = screeningDate.toLocaleDateString('en-GB');
  const timeString = screeningDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const hallName = hall?.name || 'Main Hall';

  return (
    <div className="w-full px-4 md:px-12 mb-16">
      <div className="flex justify-between items-center mb-6">
        {/* כפתור ריענון מושבים */}
        <button 
          onClick={fetchLiveSeats}
          disabled={isRefreshing}
          className={`text-sm font-medium px-4 py-2 rounded-md transition flex items-center gap-2 ${
            isRefreshing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Seats'}
        </button>
      </div>

      {/* כותרת רחבה */}
      <div className="bg-slate-900 text-white p-8 rounded-t-2xl text-center shadow-lg">
        <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
        <p className="text-gray-300 text-xl mb-1">{dateString} at {timeString}</p>
        <p className="text-blue-400 font-semibold text-lg">{hallName}</p>
      </div>

      {/* פיצול המסך: מפה מצד אחד, סיכום מצד שני */}
      <div className="flex flex-col lg:flex-row bg-white rounded-b-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* צד שמאל - מפת המושבים */}
        <div className="w-full lg:w-2/3 p-8 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
          
          {/* מסך הקולנוע */}
          <div className="w-full flex justify-center mb-16">
            <div className="w-4/5 h-12 bg-gradient-to-b from-gray-300 to-transparent rounded-t-[50%] border-t-8 border-gray-400 relative shadow-inner">
              <span className="absolute w-full text-center mt-3 text-gray-500 font-bold tracking-[0.3em] text-sm uppercase">Screen</span>
            </div>
          </div>

          {/* רשת המושבים */}
          <div className="flex flex-col items-center gap-4 overflow-x-auto pb-8">
            {rows.map((row) => (
              <div key={row} className="flex gap-3 items-center">
                <span className="w-8 text-center font-bold text-gray-500 text-lg mr-2">{row}</span>
                
                <div className="flex gap-3">
                  {cols.map((col) => {
                    const seatId = `${row}-${col}`;
                    const isTaken = takenSeats.includes(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    
                    let seatClass = "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-t-2xl rounded-b-md font-bold text-sm md:text-base transition-all duration-200 flex items-center justify-center ";
                    
                    if (isTaken) {
                      seatClass += "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60 shadow-inner";
                    } else if (isSelected) {
                      seatClass += "bg-blue-600 text-white shadow-lg transform -translate-y-2 ring-4 ring-blue-200";
                    } else {
                      seatClass += "bg-white hover:bg-green-50 text-gray-700 border-2 border-green-400 hover:border-green-500 cursor-pointer shadow-sm hover:shadow-md";
                    }

                    return (
                      <button
                        key={seatId}
                        disabled={isTaken}
                        onClick={() => handleSeatClick(seatId)}
                        className={seatClass}
                        title={`Seat ${seatId}`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
                
                <span className="w-8 text-center font-bold text-gray-500 text-lg ml-2">{row}</span>
              </div>
            ))}
          </div>

          {/* מקרא */}
          <div className="flex justify-center gap-10 mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white border-2 border-green-400 rounded-t-xl rounded-b-sm"></div>
              <span className="text-gray-700 font-medium text-lg">Available</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-t-xl rounded-b-sm"></div>
              <span className="text-gray-700 font-medium text-lg">Selected</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-t-xl rounded-b-sm opacity-60"></div>
              <span className="text-gray-700 font-medium text-lg">Taken</span>
            </div>
          </div>
        </div>

        {/* צד ימין - סיכום ההזמנה */}
        <div className="w-full lg:w-1/3 p-8 bg-white flex flex-col">
          <div className="sticky top-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-gray-100 pb-4">Booking Summary</h3>
            
            <div className="space-y-4 mb-8 text-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tickets Selected:</span>
                <span className="font-bold text-xl bg-gray-100 px-4 py-1 rounded-lg">{selectedSeats.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Price per Ticket:</span>
                <span className="font-medium text-gray-800">{TICKET_PRICE} NIS</span>
              </div>
              
              <div className="flex flex-col mt-4 pt-4 border-t border-gray-100">
                <span className="text-gray-600 mb-2">Selected Seats:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map(seat => (
                      <span key={seat} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-semibold text-sm">
                        {seat}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No seats selected yet</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-800 text-xl">Total Amount:</span>
                <span className="font-black text-green-600 text-3xl">{selectedSeats.length * TICKET_PRICE} NIS</span>
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center font-medium border border-red-100">{error}</div>}

            <button
              onClick={handleCheckout}
              disabled={selectedSeats.length === 0 || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-xl text-white transition-all duration-300 ${
                selectedSeats.length === 0 || isProcessing 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-500 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Continue to Checkout'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}