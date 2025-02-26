import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizList } from '../utils/quizService';
import '../styles/QuizSelection.css';

// Mock data for known quizzes only
const quizMetadata = {
  'JavaScript Basics.csv': {
    description: 'Test your knowledge of JavaScript fundamentals including variables, functions, and control flow.',
    questions: 10,
    difficulty: 'easy',
    timeEstimate: '10 min',
    category: 'Programming',
    lastAttempt: null
  },
  'Advanced CSS.csv': {
    description: 'Challenge yourself with advanced CSS concepts like flexbox, grid, and animations.',
    questions: 15,
    difficulty: 'medium',
    timeEstimate: '15 min',
    category: 'Web Design',
    lastAttempt: '2023-10-15'
  }
};

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
        const categoriesSet = new Set();
        availableQuizzes.forEach(quiz => {
          const quizName = quiz.replace('.csv', '');
          const metadata = quizMetadata[quiz];
          if (metadata && metadata.category) {
            categoriesSet.add(metadata.category);
          }
        });
        setCategories(Array.from(categoriesSet));
        
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  // Filter quizzes based on search term and active filter
  const filteredQuizzes = quizzes.filter(quiz => {
    const quizName = quiz.replace('.csv', '').toLowerCase();
    const matchesSearch = quizName.includes(searchTerm.toLowerCase());
    const metadata = quizMetadata[quiz];
    
    if (activeFilter === 'all') {
      return matchesSearch;
    } else if (activeFilter === 'incomplete') {
      return matchesSearch && (!metadata || !metadata.lastAttempt);
    } else if (activeFilter === 'completed') {
      return matchesSearch && metadata && metadata.lastAttempt;
    } else {
      // Filter by category
      return matchesSearch && metadata && metadata.category === activeFilter;
    }
  });

  const getQuizMetadata = (quiz) => {
    return quizMetadata[quiz] || null;
  };

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
            <p>No quizzes available.</p>
          </div>
        ) : (
          <div className="quiz-grid">
            {filteredQuizzes.map((quiz, index) => {
              const quizName = quiz.replace('.csv', '');
              const metadata = getQuizMetadata(quiz);
              
              return (
                <div key={index} className="quiz-card">
                  {metadata ? (
                    <>
                      {metadata.category && (
                        <span className="category-tag">{metadata.category}</span>
                      )}
                      <div className="quiz-card-header">
                        <h3>{quizName}</h3>
                      </div>
                      <div className="quiz-card-body">
                        <p className="quiz-description">{metadata.description}</p>
                        
                        <div className="quiz-meta">
                          <span>{metadata.questions} questions</span>
                          <span>{metadata.timeEstimate}</span>
                        </div>
                        
                        <div className="quiz-meta">
                          <span className={`quiz-difficulty difficulty-${metadata.difficulty}`}>
                            {metadata.difficulty}
                          </span>
                          {metadata.lastAttempt && (
                            <span>Last attempt: {new Date(metadata.lastAttempt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="quiz-card-header">
                        <h3>{quizName}</h3>
                      </div>
                      <div className="quiz-card-body">
                        <div style={{ flex: 1 }}></div>
                      </div>
                    </>
                  )}
                  
                  <Link to={`/quiz/${encodeURIComponent(quiz)}`} className="start-quiz-btn">
                    Start Quiz
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSelection;
