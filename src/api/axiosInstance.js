import axios from 'axios';

// הגדרת כתובת הבסיס של שרת ה-Backend שלנו
const api = axios.create({
  baseURL: 'http://YOUR_LOCAL_IP:3000', // החלף בכתובת ה-IP המקומית שלך
});

// פונקציית אמצע שרצה לפני כל בקשה שנשלחת לשרת מהדפדפן
api.interceptors.request.use((config) => {
  // שליפת הטוקן מהזיכרון המקומי של הדפדפן
  const token = localStorage.getItem('token');
  
  // אם יש טוקן, נוסיף אותו להדר של הבקשה
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;