import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">Quiz App</Link>
      </div>
      <nav className="nav">
        <Link to="/" className="nav-link">Home</Link>
      </nav>
    </header>
  );
};

export default Header;
