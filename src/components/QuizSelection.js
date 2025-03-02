import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizList } from '../utils/quizService';
import { supabase } from '../utils/supabase';
import '../styles/QuizSelection.css';

const QuizSelection = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserQuizzesOnly, setShowUserQuizzesOnly] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Get the current user when component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    getCurrentUser();
  }, []);
  
  // Load quizzes based on filter selection
  useEffect(() => {
    const loadQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Only pass user ID when "My Quizzes" is selected AND user is logged in
        const userId = showUserQuizzesOnly && currentUser ? currentUser.id : null;
        
        if (showUserQuizzesOnly && !currentUser) {
          console.log('User not logged in, but trying to view their quizzes');
        }
        
        const availableQuizzes = await fetchQuizList(userId);
        setQuizzes(availableQuizzes || []);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
        setError("Failed to load quizzes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [showUserQuizzesOnly, currentUser]);

  // Filter quizzes by search term
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get appropriate message when no quizzes are found
  const noQuizzesMessage = () => {
    if (showUserQuizzesOnly) {
      return currentUser 
        ? "You haven't uploaded any quizzes yet." 
        : "You need to be logged in to view your quizzes.";
    }
    return "No quizzes matching your search. Try a different term or check back later!";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading available quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-selection-container">
        <div className="quiz-selection">
          <div className="header-section">
            <h1>Error</h1>
            <p>{error}</p>
            <button 
              className="start-quiz-btn" 
              style={{ maxWidth: '200px', margin: '20px auto' }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-selection-container">
      <div className="quiz-selection">
        <div className="header-section">
          <h1>Available Quizzes</h1>
          <p>Choose a quiz from our collection and test your knowledge</p>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${!showUserQuizzesOnly ? 'active' : ''}`}
              onClick={() => setShowUserQuizzesOnly(false)}
            >
              All Quizzes
            </button>
            <button 
              className={`toggle-btn ${showUserQuizzesOnly ? 'active' : ''}`}
              onClick={() => setShowUserQuizzesOnly(true)}
            >
              My Quizzes
            </button>
          </div>
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>{noQuizzesMessage()}</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.fileName} className="quiz-card">
                <div className="quiz-card-header">
                  <h3>{quiz.title}</h3>
                  <div className="quiz-uploader">
                    Uploaded by: {quiz.uploaderName}
                  </div>
                </div>
                <Link 
                  to={`/quiz/${encodeURIComponent(quiz.fileName)}`} 
                  className="start-quiz-btn"
                >
                  Start Quiz
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSelection;
