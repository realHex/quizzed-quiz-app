import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import QuizSelection from './components/QuizSelection';
import Quiz from './components/Quiz';
import History from './components/History';
import Import from './components/Import'; // Add this import
import './App.css';
import './styles/QuizSelection.css';
import './styles/Quiz.css';
import './styles/History.css';
import './styles/Import.css'; // Add this import

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
                    <QuizSelection />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/quiz/:quizName" 
                element={
                  <PrivateRoute>
                    <Quiz />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <PrivateRoute>
                    <History />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/import" 
                element={
                  <PrivateRoute>
                    <Import />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
