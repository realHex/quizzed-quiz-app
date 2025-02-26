import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <header className="app-header">
      {!isAuthPage && (
        <>
          <div className="nav-section">
            <div className="logo">
              <Link to="/">Quiz App</Link>
            </div>
            {user && (
              <nav className="nav-links">
                <Link to="/" className="nav-link">Quizzes</Link>
                <Link to="/history" className="nav-link">History</Link>
              </nav>
            )}
          </div>
          
          <div className="user-section">
            {user ? (
              <>
                <span className="welcome-message">
                  Welcome, {userProfile?.name || 'User'}
                </span>
                <button onClick={signOut} className="logout-button">
                  Logout
                </button>
              </>
            ) : (
              <div className="auth-links">
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign Up</Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
