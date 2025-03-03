import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FlashcardProvider } from './context/FlashcardContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import QuizSelection from './components/QuizSelection';
import Quiz from './components/Quiz';
import History from './components/History';
import Import from './components/Import';
import FlashcardsList from './components/flashcards/FlashcardsList';
import FlashcardCreator from './components/flashcards/FlashcardCreator';
import FlashcardViewer from './components/flashcards/FlashcardViewer';
import './App.css';
import './styles/Header.css';
import './styles/QuizSelection.css';
import './styles/Quiz.css';
import './styles/History.css';
import './styles/Import.css';

function App() {
  // Add an inline style to troubleshoot header visibility
  const headerFixStyle = {
    position: 'relative',
    width: '100%',
    display: 'block',
    zIndex: 9999
  };

  return (
    <AuthProvider>
      <FlashcardProvider>
        <Router>
          <div className="app">
            <div style={headerFixStyle}>
              <Header />
            </div>
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
                <Route 
                  path="/flashcards" 
                  element={
                    <PrivateRoute>
                      <FlashcardsList />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/flashcards/create" 
                  element={
                    <PrivateRoute>
                      <FlashcardCreator />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/flashcards/:id" 
                  element={
                    <PrivateRoute>
                      <FlashcardViewer />
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </FlashcardProvider>
    </AuthProvider>
  );
}

export default App;
