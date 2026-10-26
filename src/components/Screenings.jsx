import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance.js';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Screenings() {
  const location = useLocation();
  const navigate = useNavigate();

  const movie = location.state?.movie;

  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // הפונקציה המדויקת לחילוץ מזהה הסרטון
  const getYoutubeId = (url) => {
    if (!url) return null;
    
    if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
    if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    
    return null;
  };

  // שליפת ההקרנות מהשרת
  useEffect(() => {
    const fetchScreenings = async () => {
      try {
        const response = await api.get(`/screenings/movie/${movie._id}`);
        
        // 1. הגדרת הזמן הנוכחי
        const now = new Date();
        
        // 2. סינון: משאירים רק הקרנות שהתאריך שלהן גדול (בעתיד) מהזמן הנוכחי
        const futureScreenings = response.data.filter(screening => new Date(screening.startTime) > now);
        
        // 3. סידור: מההקרנה הקרובה ביותר לרחוקה ביותר
        futureScreenings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        setScreenings(futureScreenings);
        setLoading(false);
      } catch (err) {
        setError('Failed to load screenings.');
        setLoading(false);
      }
    };

    if (movie) {
      fetchScreenings();
    }
  }, [movie]);

  if (!movie) {
    navigate('/');
    return null;
  }

  const videoId = getYoutubeId(movie.trailerUrl);

  return (
    <div className="max-w-[1400px] w-full mx-auto p-4">
      {/* אזור פרטי הסרט */}
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden mb-12 flex flex-col md:flex-row">
        
        {/* פוסטר הסרט */}
        <div className="w-full md:w-1/3 md:min-h-[500px]">
          {movie.posterUrl ? (
            <img 
              src={movie.posterUrl} 
              alt={movie.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="text-gray-500">No Image Available</span>
            </div>
          )}
        </div>

        {/* פרטים וטריילר */}
        <div className="w-full md:w-2/3 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{movie.title}</h1>
            
            <div className="text-gray-300 mb-8 flex flex-wrap items-center gap-4 text-sm md:text-base">
              <span>{movie.durationInMinutes} minutes</span>
              <span className="hidden md:inline">|</span>
              <span className="bg-gray-700 px-3 py-1 rounded font-bold">{movie.ageRating}</span>
              <span className="hidden md:inline">|</span>
              <span>{movie.genres ? movie.genres.join(', ') : ''}</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-3 text-blue-400">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                {movie.description}
              </p>
            </div>
          </div>

          {/* נגן הטריילר */}
          {videoId && (
            <div className="mt-4 border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Trailer</h2>
              <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`${movie.title} Trailer`}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* אזור ההקרנות */}
      <div>
        <h2 className="text-3xl font-bold mb-8 text-slate-800 border-b pb-4">Available Screenings</h2>

        {loading && <div className="text-center text-xl mt-8">Loading screenings...</div>}
        {error && <div className="text-center text-red-500 text-xl mt-8">{error}</div>}

        {!loading && !error && screenings.length === 0 && (
          <div className="text-center text-gray-500 text-xl mt-8 bg-white p-12 rounded-lg shadow-md border border-gray-100">
            There are currently no scheduled screenings for this movie.
          </div>
        )}

        {!loading && !error && screenings.length > 0 && (
          <div className="grid gap-4">
            {screenings.map((screening) => {
              const screeningDate = new Date(screening.startTime);
              const dateString = screeningDate.toLocaleDateString('en-GB');
              const timeString = screeningDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              
              // שליפת שם האולם מתוך האובייקט המקושר, עם גיבוי למקרה שהנתון חסר
              const hallName = screening.hallId?.name || 'Standard Hall';

              return (
                <div key={screening._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition">
                  <div className="text-center md:text-left flex flex-col items-center md:items-start">
                    <h3 className="text-2xl font-bold text-slate-800 mb-1">{dateString}</h3>
                    <p className="text-gray-600 text-lg mb-2">Time: <span className="font-bold text-slate-900">{timeString}</span></p>
                    
                    {/* תגית עיצוב חדשה המציגה את שם האולם */}
                    <span className="inline-block bg-slate-800 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-sm uppercase tracking-wide">
                      {hallName}
                    </span>
                  </div>
                  
                  <div className="text-center bg-blue-50 py-2 px-4 rounded-lg">
                    <span className="block text-sm text-blue-600 font-semibold mb-1">Available Seats</span>
                    <span className="block text-2xl font-bold text-blue-800">{screening.availableSeats}</span>
                  </div>

                  <button 
                    onClick={() => navigate(`/booking/${screening._id}`, { state: { movie, screening } })}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 shadow-sm"
                  >
                    Book Tickets
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}