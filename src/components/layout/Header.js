import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, userProfile, signOut } = useAuth();

  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">Quiz App</Link>
      </div>
      
      <nav>
        {user && (
          <Link to="/" className="nav-link">Quizzes</Link>
        )}
      </nav>
      
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
    </header>
  );
};

export default Header;
