import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import CTA from './components/CTA/CTA';
import Footer from './components/Footer/Footer';
import LoginModal from './components/Modals/LoginModal/LoginModal';
import SignupModal from './components/Modals/SignupModal/SignupModal';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleSignInClick = () => {
    setShowLoginModal(true);
    setShowSignupModal(false);
  };

  const handleSignUpClick = () => {
    setShowSignupModal(true);
    setShowLoginModal(false);
  };

  const handleCloseModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    handleCloseModals();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  // If user is logged in, show dashboard
  if (isLoggedIn && user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // Otherwise, show landing page
  return (
    <div className="App">
      <Header onSignInClick={handleSignInClick} />
      <Hero onSignUpClick={handleSignUpClick} />
      <Features />
      <CTA onSignUpClick={handleSignUpClick} />
      <Footer />

      {showLoginModal && (
        <LoginModal 
          onClose={handleCloseModals} 
          onSwitchToSignup={handleSwitchToSignup}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showSignupModal && (
        <SignupModal 
          onClose={handleCloseModals} 
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
}

export default App;
