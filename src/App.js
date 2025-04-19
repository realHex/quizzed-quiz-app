import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FlashcardProvider } from './context/FlashcardContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import QuizSelection from './components/QuizSelection';
import Quiz from './components/Quiz';
import History from './components/History';
import Import from './components/Import';
import NotAvailable from './components/common/NotAvailable';
import FlashcardsList from './components/flashcards/FlashcardsList';
import FlashcardCreator from './components/flashcards/FlashcardCreator';
import FlashcardViewer from './components/flashcards/FlashcardViewer';
import Settings from './components/settings/Settings';
import { Analytics } from "@vercel/analytics/react"; // Import Analytics
import './App.css';
import './styles/Header.css';
import './styles/QuizSelection.css';
import './styles/Quiz.css';
import './styles/History.css';
import './styles/Import.css';
import initPdfWorker from './utils/pdfConfig';

// Initialize PDF worker
initPdfWorker();

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Component that conditionally renders admin content or "Not Available" message
const AdminContent = ({ component: Component, featureName }) => {
  const { isAdmin } = useAuth();
  
  // If the user is an admin, render the actual component, otherwise show the "Not Available" message
  return isAdmin() ? <Component /> : <NotAvailable featureName={featureName} />;
};

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
                      <AdminContent component={Import} featureName="Quiz Import" />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/flashcards" 
                  element={
                    <PrivateRoute>
                      <AdminContent component={FlashcardsList} featureName="Flashcards" />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/flashcards/create" 
                  element={
                    <PrivateRoute>
                      <AdminContent component={FlashcardCreator} featureName="Flashcard Creation" />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/flashcards/:id" 
                  element={
                    <PrivateRoute>
                      <AdminContent component={FlashcardViewer} featureName="Flashcard Viewer" />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
            <Analytics /> {/* Add Analytics component */}
          </div>
        </Router>
      </FlashcardProvider>
    </AuthProvider>
  );
}

export default App;
