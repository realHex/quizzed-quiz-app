import React from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Header.css';

const Header = () => {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  // Always render the header for visibility testing
  return (
    <header className="app-header" data-testid="app-header">
      {!isAuthPage && (
        <>
          <div className="nav-section">
            <div className="logo">
              <Link to="/">Quizzed</Link>
            </div>
            {user && (
              <nav className="header-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                  Quizzes
                </NavLink>
                <NavLink to="/flashcards" className={({ isActive }) => isActive ? 'active-link' : ''}>
                  Flashcards
                </NavLink>
                <NavLink to="/import" className={({ isActive }) => isActive ? 'active-link' : ''}>
                  Import
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => isActive ? 'active-link' : ''}>
                  History
                </NavLink>
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
