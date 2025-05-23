import React from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Header.css';

const Header = () => {
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  // Always render the header for visibility testing
  return (
    <header className="app-header" data-testid="app-header">
      {!isAuthPage && (
        <>
          <div className="nav-section">
            <div className="logo">
              <Link to="/">Quized</Link>
            </div>
            {user && (
              <nav className="header-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                  Quizzes
                </NavLink>
                
                {/* Show all links to all users */}
                <NavLink to="/flashcards" className={({ isActive }) => isActive ? 'active-link' : ''}>
                  Flashcards
                </NavLink>
                <NavLink to="/import" className={({ isActive }) => isActive ? 'active-link' : ''}>
                  Import
                </NavLink>
                
                <NavLink to="/history" className={({ isActive }) => isActive ? 'active-link' : ''}>
                  History
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => isActive ? 'active-link' : ''}>
                  Settings
                </NavLink>
              </nav>
            )}
          </div>
          
          <div className="user-section">
            {user ? (
              <>
                <span className="welcome-message">
                  Welcome, {userProfile?.name || 'User'}
                  {userProfile?.role === 'admin-user' && <span className="admin-badge"> (Admin)</span>}
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
