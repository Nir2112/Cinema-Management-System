import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, CreditCard, Calendar, Eye, EyeOff, Info } from 'lucide-react';
import api from '../api/axiosInstance.js';

const getEighteenYearsAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Register() {
  const navigate = useNavigate();
  
  const defaultBirthday = getEighteenYearsAgo();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    birthday: defaultBirthday,
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const validateIsraeliId = (id) => {
      if (!/^\d{9}$/.test(id)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        let digit = Number(id[i]);
        let weight = (i % 2) + 1;
        let product = digit * weight;
        sum += product > 9 ? product - 9 : product;
      }
      return sum % 10 === 0;
    };
    
    if (!validateIsraeliId(formData.id)) {
      newErrors.id = 'Invalid Israeli ID number';
    }

    if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.birthday) {
      newErrors.birthday = 'Birthday is required';
    } else {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();               
      const monthDiff = today.getMonth() - birthDate.getMonth();              
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      if (age < 18 || age > 100) {
        newErrors.birthday = 'You must be between 18 and 100 years old';
      }
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^05\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'Must be exactly 10 digits starting with 05 (e.g. 0501234567)';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Does not meet the password requirements';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return; 
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      
      await api.post('/auth/register', registerData);
      
      // הצגת הודעת ההצלחה
      setSuccessMessage('Registration successful! Redirecting to login...');
      
      // השהיה של 2 שניות והעברה לעמוד התחברות
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsLoading(false); // מחזירים את הכפתור למצב פעיל רק במקרה של שגיאה
    } 
  };

  const getInputClass = (fieldName, isPasswordField = false) => {
    const paddingClass = isPasswordField ? "pl-10 pr-10" : "pl-10 pr-4";
    const baseClass = `${paddingClass} w-full py-2 border rounded-lg outline-none transition focus:ring-2 `;
    
    return errors[fieldName] 
      ? baseClass + "border-red-500 focus:ring-red-200" 
      : baseClass + "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Create an Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join us to book tickets and manage your orders</p>
        </div>

        {/* הודעת שגיאה מהשרת */}
        {serverError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700 text-sm font-medium">{serverError}</p>
          </div>
        )}

        {/* הודעת הצלחה ירוקה */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID (T.Z)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className={`h-5 w-5 ${errors.id ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  name="id"
                  required
                  value={formData.id}
                  onChange={handleChange}
                  className={getInputClass('id')}
                  placeholder="ID Number"
                  maxLength="9"
                />
              </div>
              {errors.id && <p className="mt-1 text-xs text-red-600 font-medium">{errors.id}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${errors.name ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={getInputClass('name')}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className={`h-5 w-5 ${errors.birthday ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="date"
                  name="birthday"
                  required
                  max={defaultBirthday} 
                  value={formData.birthday}
                  onChange={handleChange}
                  className={getInputClass('birthday')}
                />
              </div>
              {errors.birthday && <p className="mt-1 text-xs text-red-600 font-medium">{errors.birthday}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className={`h-5 w-5 ${errors.phone ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={getInputClass('phone')}
                  placeholder="0501234567"
                  maxLength="10"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={getInputClass('email')}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Password
                <div className="relative group cursor-help flex items-center">
                  <Info className="h-4 w-4 text-blue-500 hover:text-blue-700 transition-colors" />
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    <p className="font-semibold mb-1">Password Requirements:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>At least 8 characters long</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                      <li>One special character (e.g., !@#$%)</li>
                    </ul>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={getInputClass('password', true)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={getInputClass('confirmPassword', true)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white transition-all duration-200 mt-6 ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            {isLoading ? 'Processing...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}