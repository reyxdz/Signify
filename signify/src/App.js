import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import CTA from './components/CTA/CTA';
import Footer from './components/Footer/Footer';
import LoginModal from './components/Modals/LoginModal/LoginModal';
import SignupModal from './components/Modals/SignupModal/SignupModal';
import SignatureSetupModal from './components/Modals/SignatureSetupModal/SignatureSetupModal';
import Dashboard from './components/Dashboard/Dashboard';
import DocumentSigningPage from './pages/DocumentSigningPage/DocumentSigningPage';
import PreviewPage from './pages/PreviewPage/PreviewPage';
import ViewSignedDocumentPage from './pages/ViewSignedDocumentPage/ViewSignedDocumentPage';
import './App.css';

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

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
    
    // Check if user has a signature stored in their profile
    // signature will be null if no signature exists
    if (!userData.signature) {
      setShowSignatureModal(true);
    }
    
    handleCloseModals();
  };

  const handleSignatureComplete = (signatureData) => {
    setShowSignatureModal(false);
    // Signature is already saved to backend in the modal
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // If user is logged in and signature setup is complete, show dashboard
  if (isLoggedIn && user && !showSignatureModal) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Router>
          <Routes>
            <Route path="/sign/:publishLink" element={<DocumentSigningPage user={user} />} />
            <Route path="/sign" element={<DocumentSigningPage user={user} />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/view-document/:documentId" element={<ViewSignedDocumentPage user={user} />} />
            <Route path="/*" element={<Dashboard user={user} onLogout={handleLogout} />} />
          </Routes>
        </Router>
      </GoogleOAuthProvider>
    );
  }

  // If user is logged in but needs to set up signature, show modal
  if (isLoggedIn && user && showSignatureModal) {
    return <SignatureSetupModal user={user} onComplete={handleSignatureComplete} />;
  }

  // Otherwise, show landing page
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/*" element={
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
                  onLoginSuccess={handleLoginSuccess}
                />
              )}

              {showSignatureModal && (
                <SignatureSetupModal user={user} onComplete={handleSignatureComplete} />
              )}
            </div>
          } />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
