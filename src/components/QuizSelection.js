import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizList } from '../utils/quizService';
import '../styles/QuizSelection.css';

const QuizSelection = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const availableQuizzes = await fetchQuizList();
        setQuizzes(availableQuizzes);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading available quizzes...</p>
      </div>
    );
  }

  return (
    <div className="quiz-selection-container">
      <div className="quiz-selection">
        <div className="header-section">
          <h1>Available Quizzes</h1>
          <p>Select a quiz to get started</p>
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>No quizzes found.</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.fileName} className="quiz-card">
                <div className="quiz-card-header">
                  <h3>{quiz.title}</h3>
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
