import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizList } from '../utils/quizService';
import '../styles/QuizSelection.css';

const QuizSelection = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const availableQuizzes = await fetchQuizList();
        setQuizzes(availableQuizzes);
        
        // Extract unique categories
        const categoriesSet = new Set(availableQuizzes.map(quiz => quiz.category));
        setCategories(Array.from(categoriesSet));
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') {
      return matchesSearch;
    } else if (activeFilter === 'incomplete') {
      return matchesSearch && !quiz.lastAttempt;
    } else if (activeFilter === 'completed') {
      return matchesSearch && quiz.lastAttempt;
    } else {
      return matchesSearch && quiz.category === activeFilter;
    }
  });

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
        </div>

        <div className="search-filter-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-options">
            <button
              className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-button ${activeFilter === 'incomplete' ? 'active' : ''}`}
              onClick={() => setActiveFilter('incomplete')}
            >
              Not Attempted
            </button>
            <button
              className={`filter-button ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`filter-button ${activeFilter === category ? 'active' : ''}`}
                onClick={() => setActiveFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>No quizzes found.</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.id || quiz.fileName} className="quiz-card">
                <span className="category-tag">{quiz.category}</span>
                <div className="quiz-card-header">
                  <h3>{quiz.title}</h3>
                </div>
                <div className="quiz-card-body">
                  <p className="quiz-description">{quiz.description}</p>
                  
                  <div className="quiz-meta">
                    <span>{quiz.questionCount} questions</span>
                    <span>{quiz.timeEstimate}</span>
                  </div>
                  
                  <div className="quiz-meta">
                    <span className={`quiz-difficulty difficulty-${quiz.difficulty}`}>
                      {quiz.difficulty}
                    </span>
                    {quiz.lastAttempt && (
                      <span>Last attempt: {new Date(quiz.lastAttempt).toLocaleDateString()}</span>
                    )}
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
