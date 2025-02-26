import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Home from './components/Home'; // Your existing Home component
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                } 
              />
              {/* Add other protected routes as needed */}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
