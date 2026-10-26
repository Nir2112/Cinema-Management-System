import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, CalendarDays, Ticket, ShieldAlert, Plus, Edit2, X, Building, Search, CheckCircle, Clock, TrendingUp, Trophy} from 'lucide-react';
import api from '../api/axiosInstance.js';
import { AuthContext } from '../App.jsx';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('movies');

  // ================= סטייטים לסרטים =================
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  
  const initialMovieState = {
    title: '', description: '', durationInMinutes: '', ageRating: 'PG-13',
    posterUrl: '', trailerUrl: '', genres: '', status: 'Coming Soon'
  };
  const [movieForm, setMovieForm] = useState(initialMovieState);

  // ================= סטייטים להקרנות ואולמות =================
  const [screeningsGrouped, setScreeningsGrouped] = useState({});
  const [halls, setHalls] = useState([]);
  const [loadingScreenings, setLoadingScreenings] = useState(false);
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);

  const initialScreeningState = { movieId: '', hallId: '', startTime: '', price: '', recurringDays: 1 };
  const [screeningForm, setScreeningForm] = useState(initialScreeningState);

  const initialHallState = { name: '', rows: '', seatsPerRow: '', status: 'Active' };
  const [hallForm, setHallForm] = useState(initialHallState);

  // ================= סטייטים להזמנות (Box Office) =================
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearchError, setOrderSearchError] = useState('');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [movieSearchTerm, setMovieSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // פונקציית עזר לחילוץ התאריך והשעה הנוכחיים עבור הגבלת שדות
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    // מתקנים את אזור הזמן כדי שיתאים לשעון המקומי
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'movies') {
      fetchMovies();
    } else if (activeTab === 'screenings') {
      fetchMovies(); 
      fetchHalls();
      fetchScreenings();
    } else if (activeTab === 'halls') {
      fetchHalls();
    } else if (activeTab === 'orders') {
      fetchStats(); 
    }
  }, [activeTab]);

  // ================= פונקציות סרטים =================
  const fetchMovies = async () => {
    setLoadingMovies(true);
    try {
      const response = await api.get('/movies/all');
      const statusOrder = { 'Coming Soon': 1, 'Now Playing': 2, 'Archived': 3 };
      const sortedMovies = response.data.sort((a, b) => {
        const weightA = statusOrder[a.status] || 99;
        const weightB = statusOrder[b.status] || 99;
        return weightA - weightB;
      });
      setMovies(sortedMovies);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...movieForm,
      durationInMinutes: Number(movieForm.durationInMinutes),
      genres: movieForm.genres.split(',').map(g => g.trim()).filter(g => g) 
    };

    try {
      if (editingMovie) await api.put(`/movies/update/${editingMovie._id}`, payload);
      else await api.post('/movies/add', payload);
      
      fetchMovies(); 
      setIsMovieModalOpen(false);
      setEditingMovie(null);
      setMovieForm(initialMovieState);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save movie");
    }
  };

  // ================= פונקציות אולמות =================
  const fetchHalls = async () => {
    try {
      const response = await api.get('/halls/all');
      setHalls(response.data);
    } catch (error) {
      console.error("Failed to fetch halls:", error);
    }
  };


  const handleHallSubmit = async (e) => {
    e.preventDefault();
    const rows = Number(hallForm.rows);
    const seatsPerRow = Number(hallForm.seatsPerRow);
    
    // אם בעריכה, נשלח רק את הסטטוס (כי השאר נעול)
    try {
      if (editingHall) {
        await api.put(`/halls/update/${editingHall._id}`, { status: hallForm.status });
      } else {
        const payload = {
          name: hallForm.name,
          capacity: rows * seatsPerRow,
          seatLayout: { rows, seatsPerRow },
          status: hallForm.status
        };
        await api.post('/halls/add', payload);
      }
      
      fetchHalls(); 
      setIsHallModalOpen(false);
      setEditingHall(null); // איפוס
      setHallForm(initialHallState);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save hall");
    }
  };

  // ================= פונקציות הקרנות =================
  const fetchScreenings = async () => {
    setLoadingScreenings(true);
    try {
      const response = await api.get('/screenings/all');
      const allScreenings = response.data;
      
      allScreenings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      const grouped = allScreenings.reduce((acc, screening) => {
        const title = screening.movieId?.title || 'Unknown Movie';
        if (!acc[title]) acc[title] = [];
        acc[title].push(screening);
        return acc;
      }, {});

      setScreeningsGrouped(grouped);
    } catch (error) {
      console.error("Failed to fetch screenings:", error);
    } finally {
      setLoadingScreenings(false);
    }
  };

  const handleScreeningSubmit = async (e) => {
    e.preventDefault();
    
    const baseDate = new Date(screeningForm.startTime);
    const price = Number(screeningForm.price);
    const daysToRun = Number(screeningForm.recurringDays);
    
    try {
      const promises = [];
      
      // הלולאה רצה כמספר הימים שהמנהל בחר
      for (let i = 0; i < daysToRun; i++) {
        const screeningDate = new Date(baseDate);
        screeningDate.setDate(baseDate.getDate() + i); 
        
        const payload = {
          movieId: screeningForm.movieId,
          hallId: screeningForm.hallId,
          startTime: screeningDate.toISOString(),
          price: price
        };
        
        promises.push(api.post('/screenings/add', payload));
      }

      await Promise.all(promises);
      
      fetchScreenings(); 
      setIsScreeningModalOpen(false);
      setScreeningForm(initialScreeningState);
      
      alert(`Success! ${daysToRun} screenings were scheduled successfully.`);
      
    } catch (error) {
      alert(error.response?.data?.message || "Failed to schedule screenings");
    }
  };

  
  // ================= פונקציות הזמנות וקופה (Box Office) =================
 // הפונקציה מקבלת פרמטרים אופציונליים כדי לאפס את הסינון
  const fetchStats = async (start = startDate, end = endDate) => {
    setLoadingStats(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/orders/stats${queryString}`);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    fetchStats('', ''); // שליפה מחודשת ללא תאריכים
  };

  const handleSearchOrders = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoadingOrders(true);
    setOrderSearchError('');
    setSearchedUser(null);
    setUserOrders([]);

    try {
      const response = await api.get(`/orders/search/${searchId}`);
      setSearchedUser(response.data.user);
      
      // מסדרים מההזמנה החדשה לישנה
      const sortedOrders = response.data.orders.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
      setUserOrders(sortedOrders);
      
    } catch (error) {
      setOrderSearchError(error.response?.data?.message || 'Error finding orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleMarkAsUsed = async (orderId) => {
    const confirmAdmit = window.confirm("Are you sure you want to mark this ticket as Used? This action cannot be undone.");
    if (!confirmAdmit) return;

    try {
      await api.put(`/orders/use/${orderId}`);
      
      // מעדכנים את הסטטוס מקומית כדי שלא נצטרך למשוך מחדש מהשרת
      setUserOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: 'Used' } : order
        )
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update ticket status");
    }
  };


  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex flex-col md:flex-row min-h-[75vh] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mt-8 mb-16">
      
      {/* ================= תפריט צד ================= */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ShieldAlert className="text-blue-500" size={28} />
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        
        <div className="flex md:flex-col p-4 gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab('movies')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'movies' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Film size={20} /> Movies
          </button>
          
          <button onClick={() => setActiveTab('halls')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'halls' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Building size={20} /> Halls
          </button>
          
          <button onClick={() => setActiveTab('screenings')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'screenings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <CalendarDays size={20} /> Screenings
          </button>
          
          <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Ticket size={20} /> Box Office
          </button>
        </div>
      </div>

      {/* ================= אזור תוכן מרכזי ================= */}
      <div className="flex-1 p-6 md:p-10 bg-slate-50 overflow-y-auto relative">
        
        {/* === לשונית סרטים === */}
        {activeTab === 'movies' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Movies Management</h3>
              <button onClick={() => { setEditingMovie(null); setMovieForm(initialMovieState); setIsMovieModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition">
                <Plus size={20} /> Add New Movie
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loadingMovies ? (
                <div className="p-8 text-center text-gray-500 font-medium">Loading movies...</div>
              ) : movies.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">No movies found in the database.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase text-sm border-b border-gray-200">
                        <th className="p-4 font-semibold">Poster</th>
                        <th className="p-4 font-semibold">Title</th>
                        <th className="p-4 font-semibold">Duration</th>
                        <th className="p-4 font-semibold">Age Rating</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {movies.map(movie => (
                        <tr key={movie._id} className="hover:bg-slate-50 transition">
                          <td className="p-4"><img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 object-cover rounded shadow-sm" /></td>
                          <td className="p-4 font-bold text-slate-800">{movie.title}</td>
                          <td className="p-4 text-slate-600">{movie.durationInMinutes} min</td>
                          <td className="p-4 text-slate-600 font-medium">{movie.ageRating}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${movie.status === 'Now Playing' ? 'bg-green-100 text-green-700' : movie.status === 'Coming Soon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                              {movie.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => { setEditingMovie(movie); setMovieForm({ ...movie, genres: movie.genres.join(', ') }); setIsMovieModalOpen(true); }} className="text-slate-400 hover:text-blue-600 transition">
                              <Edit2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* מודל סרטים */}
        {isMovieModalOpen && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                 <h2 className="text-2xl font-bold text-slate-800">{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
                 <button onClick={() => setIsMovieModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
               </div>
               <form onSubmit={handleMovieSubmit} className="p-6 space-y-5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Movie Title</label>
                     <input type="text" required value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                     <textarea required rows="3" value={movieForm.description} onChange={e => setMovieForm({...movieForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
                     <input type="number" required min="1" value={movieForm.durationInMinutes} onChange={e => setMovieForm({...movieForm, durationInMinutes: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Age Rating</label>
                     <select value={movieForm.ageRating} onChange={e => setMovieForm({...movieForm, ageRating: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                       <option value="G">G</option><option value="PG">PG</option><option value="PG-13">PG-13</option><option value="R">R</option><option value="NC-17">NC-17</option>
                     </select>
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Genres (comma separated)</label>
                     <input type="text" required placeholder="e.g. Action, Comedy, Sci-Fi" value={movieForm.genres} onChange={e => setMovieForm({...movieForm, genres: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Poster Image URL</label>
                     <input type="url" required value={movieForm.posterUrl} onChange={e => setMovieForm({...movieForm, posterUrl: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Trailer Video URL (Optional)</label>
                     <input type="url" value={movieForm.trailerUrl} onChange={e => setMovieForm({...movieForm, trailerUrl: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Current Status</label>
                     <select value={movieForm.status} onChange={e => setMovieForm({...movieForm, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                       <option value="Now Playing">Now Playing</option><option value="Coming Soon">Coming Soon</option><option value="Archived">Archived</option>
                     </select>
                   </div>
                 </div>
                 <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                   <button type="button" onClick={() => setIsMovieModalOpen(false)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">{editingMovie ? 'Save Changes' : 'Add Movie'}</button>
                 </div>
               </form>
             </div>
           </div>
        )}

        {/* === לשונית אולמות === */}
        {activeTab === 'halls' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Halls Management</h3>
              <button onClick={() => setIsHallModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition">
                <Plus size={20} /> Add New Hall
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {halls.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">No halls found in the database.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase text-sm border-b border-gray-200">
                        <th className="p-4 font-semibold">Hall Name</th>
                        <th className="p-4 font-semibold text-center">Total Capacity</th>
                        <th className="p-4 font-semibold text-center">Rows</th>
                        <th className="p-4 font-semibold text-center">Seats Per Row</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {halls.map(hall => (
                        <tr key={hall._id} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-bold text-slate-800">{hall.name}</td>
                          <td className="p-4 text-center font-semibold text-slate-700">{hall.capacity}</td>
                          <td className="p-4 text-center text-slate-600">{hall.seatLayout?.rows || 0}</td>
                          <td className="p-4 text-center text-slate-600">{hall.seatLayout?.seatsPerRow || 0}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${hall.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {hall.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => { 
                                setEditingHall(hall); 
                                setHallForm({ 
                                  name: hall.name, 
                                  rows: hall.seatLayout?.rows || '', 
                                  seatsPerRow: hall.seatLayout?.seatsPerRow || '', 
                                  status: hall.status 
                                }); 
                                setIsHallModalOpen(true); 
                              }} 
                              className="text-slate-400 hover:text-blue-600 transition"
                            >
                              <Edit2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* מודל הוספת אולם */}
        {isHallModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 border-b border-gray-100 p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">{editingHall ? 'Edit Hall Status' : 'Add New Hall'}</h2>
                <button onClick={() => setIsHallModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
              </div>

              <form onSubmit={handleHallSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hall Name</label>
                  <input type="text" disabled={!!editingHall} required placeholder="e.g. VIP Hall 1" value={hallForm.name} onChange={e => setHallForm({...hallForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Rows</label>
                    <input type="number" disabled={!!editingHall} required min="1" placeholder="e.g. 10" value={hallForm.rows} onChange={e => setHallForm({...hallForm, rows: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Seats Per Row</label>
                    <input type="number" disabled={!!editingHall} required min="1" placeholder="e.g. 12" value={hallForm.seatsPerRow} onChange={e => setHallForm({...hallForm, seatsPerRow: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                {hallForm.rows && hallForm.seatsPerRow && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded text-center font-medium">
                    Total Capacity: {Number(hallForm.rows) * Number(hallForm.seatsPerRow)} seats
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select value={hallForm.status} onChange={e => setHallForm({...hallForm, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="Active">Active</option><option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => { setIsHallModalOpen(false); setEditingHall(null); setHallForm(initialHallState); }} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">{editingHall ? 'Save Changes' : 'Create Hall'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* === לשונית הקרנות === */}
        {activeTab === 'screenings' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-800">Screenings Schedule</h3>
              <button onClick={() => setIsScreeningModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition">
                <Plus size={20} /> Schedule Screening
              </button>
            </div>
            
            {loadingScreenings ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 font-medium">
                Loading screenings...
              </div>
            ) : Object.keys(screeningsGrouped).length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 font-medium">
                No screenings found.
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(screeningsGrouped).map(([movieTitle, movieScreenings]) => (
                  <div key={movieTitle} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-100 px-6 py-4 border-b border-gray-200">
                      <h4 className="font-bold text-lg text-slate-800">{movieTitle}</h4>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-slate-500 text-sm border-b border-gray-100 bg-white">
                            <th className="px-6 py-3 font-medium">Date & Time</th>
                            <th className="px-6 py-3 font-medium">Hall</th>
                            <th className="px-6 py-3 font-medium">Price</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                          {movieScreenings.map(screening => {
                            const screeningDate = new Date(screening.startTime);
                            const hallName = screening.hallId?.name || 'Unknown Hall';
                            const isPast = screeningDate < new Date();
                            
                            return (
                              <tr key={screening._id} className={`hover:bg-slate-50 transition ${isPast ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 text-slate-800 font-medium">
                                  {screeningDate.toLocaleDateString('en-GB')} • {screeningDate.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                  {hallName}
                                </td>
                                <td className="px-6 py-4 text-slate-800">
                                  {screening.price} ₪
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    screening.status === 'Scheduled' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                                    screening.status === 'Finished' ? 'bg-gray-50 text-gray-500 border border-gray-200' : 
                                    'bg-red-50 text-red-600 border border-red-100'
                                  }`}>
                                    {isPast && screening.status === 'Scheduled' ? 'Passed' : screening.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* מודל הקרנה חדשה */}
        {isScreeningModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-gray-100 p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Schedule New Screening</h2>
                <button onClick={() => setIsScreeningModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
              </div>

              <form onSubmit={handleScreeningSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Movie</label>
                  <select required value={screeningForm.movieId} onChange={e => setScreeningForm({...screeningForm, movieId: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="" disabled>Choose a movie...</option>
                    {movies.filter(m => m.status !== 'Archived').map(movie => (
                      <option key={movie._id} value={movie._id}>{movie.title} ({movie.durationInMinutes} min)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Hall</label>
                  <select required value={screeningForm.hallId} onChange={e => setScreeningForm({...screeningForm, hallId: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="" disabled>Choose a hall...</option>
                    {halls.filter(h => h.status === 'Active').map(hall => (
                      <option key={hall._id} value={hall._id}>{hall.name} (Capacity: {hall.capacity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                  <input type="datetime-local" required min={getCurrentDateTimeLocal()} value={screeningForm.startTime} onChange={e => setScreeningForm({...screeningForm, startTime: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Consecutive Days</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max="30" 
                    value={screeningForm.recurringDays} 
                    onChange={e => setScreeningForm({...screeningForm, recurringDays: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                  <p className="text-xs text-gray-500 mt-1">For how many consecutive days to schedule this screening.</p>
              </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ticket Price (NIS)</label>
                  <input type="number" required min="0" placeholder="e.g. 45" value={screeningForm.price} onChange={e => setScreeningForm({...screeningForm, price: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setIsScreeningModalOpen(false)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">Schedule</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= לשונית הזמנות ועמדת כרטיסן (Box Office) ================= */}
        {activeTab === 'orders' && (
          <div className="max-w-5xl mx-auto">
            {/* === סטטיסטיקות === */}
            {/* === סרגל סינון תאריכים === */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => fetchStats(startDate, endDate)}
                  className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-sm"
                >
                  Apply Filter
                </button>
                <button
                  onClick={handleClearDates}
                  className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold transition"
                >
                  Clear
                </button>
              </div>
            </div>
            {/* טבלת רווחים לפי סרט - Top 5 + חיפוש */}
            {!loadingStats && stats && stats.moviesStats && stats.moviesStats.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                  <TrendingUp className="text-blue-500" size={20} />
                  <h4 className="font-bold text-slate-800 text-lg">Top 5 Movies by Revenue</h4>
                </div>
                
                {/* טבלת Top 5 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white text-slate-500 uppercase text-xs border-b border-gray-100">
                        <th className="px-6 py-3 font-semibold">Rank</th>
                        <th className="px-6 py-3 font-semibold">Movie Title</th>
                        <th className="px-6 py-3 font-semibold text-center">Tickets Sold</th>
                        <th className="px-6 py-3 font-semibold text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {stats.moviesStats.slice(0, 5).map((movie, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">{movie.title}</td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">{movie.tickets}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">{movie.revenue.toLocaleString()} ₪</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* אזור חיפוש סרט ספציפי */}
                <div className="p-6 border-t border-gray-200 bg-slate-50">
                  <h5 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Search size={16} className="text-slate-400" />
                    Search Specific Movie Performance
                  </h5>
                  <input
                    type="text"
                    placeholder="Enter movie title to check its revenue..."
                    value={movieSearchTerm}
                    onChange={(e) => setMovieSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                  />

                  {/* תוצאות החיפוש בזמן אמת */}
                  {movieSearchTerm.trim() !== '' && (
                    <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      {stats.moviesStats.some(m => m.title.toLowerCase().includes(movieSearchTerm.toLowerCase())) ? (
                        <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-gray-50">
                            {stats.moviesStats
                              // ממפים קודם כדי לשמור את הדירוג המקורי לפני הסינון
                              .map((m, i) => ({ ...m, originalRank: i + 1 }))
                              .filter(m => m.title.toLowerCase().includes(movieSearchTerm.toLowerCase()))
                              .map((movie) => (
                                <tr key={movie.originalRank} className="hover:bg-slate-50 transition">
                                  <td className="px-4 py-3 w-20 text-center">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                      #{movie.originalRank}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-800">{movie.title}</td>
                                  <td className="px-4 py-3 text-center text-slate-600 text-sm font-medium">{movie.tickets} tickets</td>
                                  <td className="px-4 py-3 text-right font-bold text-green-600">{movie.revenue.toLocaleString()} ₪</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-center text-gray-500 font-medium">
                          No movies found matching "{movieSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            

            <h3 className="text-2xl font-bold text-slate-800 mb-2">Box Office & Admissions</h3>
            <p className="text-slate-500 mb-8">Scan or enter the customer's ID number to view and admit their tickets.</p>
            
            {/* שורת חיפוש מרכזית */}
            <form onSubmit={handleSearchOrders} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-3">Customer ID</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="9"
                    placeholder="Enter 9-digit ID number..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loadingOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition flex items-center gap-2"
                >
                  {loadingOrders ? 'Searching...' : 'Find Tickets'}
                </button>
              </div>
              {orderSearchError && (
                <p className="mt-3 text-red-600 font-medium flex items-center gap-2">
                  <X size={16} /> {orderSearchError}
                </p>
              )}
            </form>

            {/* תוצאות החיפוש */}
            {searchedUser && (
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-xl p-6 text-white flex justify-between items-center shadow-md">
                  <div>
                    <h4 className="text-lg text-slate-300">Customer Found:</h4>
                    <p className="text-3xl font-bold">{searchedUser.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-400">{userOrders.length}</p>
                  </div>
                </div>

                {userOrders.length === 0 ? (
                  <div className="bg-white p-10 rounded-xl text-center text-gray-500 border border-gray-200">
                    This customer has no ticket history.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map(order => {
                      const movieTitle = order.screeningId?.movieId?.title || 'Unknown Movie';
                      const hallName = order.screeningId?.hallId?.name || 'Unknown Hall';
                      const screeningDate = order.screeningId?.startTime ? new Date(order.screeningId.startTime) : null;
                      
                      return (
                        <div key={order._id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition hover:shadow-md">
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-bold text-xl text-slate-800">{movieTitle}</h5>
                              
                              {/* תגיות הסטטוס מבוססות על הסכמה */}
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'Used' ? 'bg-slate-100 text-slate-500' :
                                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            
                            <div className="text-sm text-slate-600 flex flex-wrap gap-y-2 gap-x-6">
                              <p className="flex items-center gap-1"><Clock size={16}/> {screeningDate ? screeningDate.toLocaleDateString('en-GB') + ' at ' + screeningDate.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                              <p className="flex items-center gap-1"><Building size={16}/> {hallName}</p>
                              <p className="flex items-center gap-1 font-bold text-slate-800"><Ticket size={16}/> Seats: {order.seats.join(', ')}</p>
                            </div>
                          </div>

                          {/* כפתור הפעולה - זמין רק אם ההזמנה שולמה (Completed) וטרם נוצלה */}
                          <div className="w-full md:w-auto flex flex-col items-center">
                            {order.status === 'Completed' ? (
                              <button 
                                onClick={() => handleMarkAsUsed(order._id)}
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-sm hover:shadow-md"
                              >
                                <CheckCircle size={20} /> Admit Tickets
                              </button>
                            ) : order.status === 'Used' ? (
                              <div className="px-6 py-3 border-2 border-slate-200 text-slate-400 font-bold rounded-lg flex items-center justify-center gap-2 w-full md:w-auto bg-slate-50">
                                Already Admitted
                              </div>
                            ) : (
                              <div className="px-6 py-3 text-slate-400 text-sm font-medium">
                                Cannot admit ({order.status})
                              </div>
                            )}
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          
        )}
        

      </div>
    </div>
  );
}