import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import './LoginModal.css';

const LoginModal = ({ onClose, onSwitchToSignup, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/login', {
        email: formData.email,
        password: formData.password,
      });

      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Call the success callback to update App state
      if (onLoginSuccess) {
        onLoginSuccess(response.data.user);
      }
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || 'Invalid email or password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    setErrors({});
    try {
      const response = await axios.post('http://localhost:5000/google-login', {
        token: credentialResponse.credential,
      });

      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Call the success callback to update App state
      if (onLoginSuccess) {
        onLoginSuccess(response.data.user);
      }
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || 'Google sign in failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setErrors({ 
      submit: 'Google sign in failed. Please try again.' 
    });
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-logo">
          <img src={require('../../../assets/images/signify_logo.png')} alt="Signify" />
          <span>Signify</span>
        </div>

        <h2>Sign In</h2>
        <p className="modal-subtitle">Access your documents and signatures</p>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={handleGoogleLoginError}
            size="large"
            width="280"
            locale="en"
          />
        </div>

        <p className="modal-switch">
          Don't have an account? <button type="button" onClick={onSwitchToSignup}>Sign Up</button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
