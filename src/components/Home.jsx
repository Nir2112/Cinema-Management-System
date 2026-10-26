import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosInstance.js';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ==========================================
// קומפוננטת עזר פנימית לשורת סרטים (Carousel)
// ==========================================
const MovieRow = ({ title, movies, isSmall = false }) => {
  const navigate = useNavigate();
  const rowRef = useRef(null);

  // פונקציית הגלילה ימינה/שמאלה
  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      // גולל כמעט רוחב מסך שלם (פחות קצת כדי שנראה המשכיות)
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mb-12">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 px-2">{title}</h2>
      
      {movies.length === 0 ? (
        <div className="text-gray-500 text-lg px-2">אין סרטים כרגע</div>
      ) : (
        <div className="relative group">
          {/* כפתור שמאלה */}
          <button 
            onClick={() => scroll('left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center focus:outline-none"
          >
            <ChevronLeft size={28} />
          </button>

          {/* מכולת הגלילה */}
          <div 
            ref={rowRef} 
            // מחביא את פס הגלילה אבל משאיר את הפונקציונליות
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-2 py-4 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden"
          >
            {movies.map((movie) => (
              <div 
                key={movie._id}
                // אירוע הלחיצה עבר לכרטיס עצמו
                onClick={() => navigate(`/movie/${movie._id}`, { state: { movie } })}
                // הוספנו cursor-pointer כדי שהעכבר ישתנה ברחרוף מעל הכרטיס
                className={`cursor-pointer snap-start shrink-0 ${isSmall ? 'w-[160px]' : 'w-[260px]'} bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                {movie.posterUrl ? (
                  <div className="relative pt-[150%] w-full">
                    <img 
                      src={movie.posterUrl} 
                      alt={movie.title} 
                      className="absolute top-0 left-0 w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="pt-[150%] w-full bg-slate-800 relative">
                    <span className="absolute inset-0 flex items-center justify-center text-gray-500">No Image</span>
                  </div>
                )}

                <div className={`${isSmall ? 'p-3' : 'p-5'} flex flex-col flex-grow`}>
                  <h2 className={`${isSmall ? 'text-base' : 'text-xl'} font-bold mb-2 text-slate-900 line-clamp-1`} title={movie.title}>{movie.title}</h2>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="block line-clamp-1">
                      {movie.genres && movie.genres.length > 0 ? movie.genres.join(', ') : 'N/A'}
                    </span>
                    <span className="block mt-1">
                      {movie.durationInMinutes} min
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="inline-block bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-slate-700">
                      {movie.ageRating}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* כפתור ימינה */}
          <button 
            onClick={() => scroll('right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center focus:outline-none"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// קומפוננטת הדף הראשית
// ==========================================
export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get('/movies/all');
        setMovies(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load movies. Please try again later.');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return <div className="text-center p-12 text-xl font-medium text-slate-500">Loading movies...</div>;
  }

  if (error) {
    return <div className="text-center p-12 text-xl font-medium text-red-500">{error}</div>;
  }

  // סינון הסרטים לקטגוריות השונות
  const nowPlaying = movies.filter(m => m.status === 'Now Playing');
  const comingSoon = movies.filter(m => m.status === 'Coming Soon');
  const archived = movies.filter(m => m.status === 'Archived');

  return (
    <div className="w-full pb-16 pt-8 px-4 md:px-8 lg:px-12 overflow-hidden">
      <h1 className="text-4xl font-extrabold mb-12 text-slate-900 border-b border-gray-200 pb-4">
        Cinema-Web Movies
      </h1>
      
      {/* הרצת קומפוננטת השורות לפי סדר ההיררכיה המבוקש */}
      <MovieRow title="Now Playing" movies={nowPlaying} />
      <MovieRow title="Coming Soon" movies={comingSoon} />
      <MovieRow title="Archived" movies={archived} isSmall={true} />
    </div>
  );
}