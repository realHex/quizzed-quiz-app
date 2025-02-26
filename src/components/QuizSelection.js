import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAvailableQuizzes } from '../services/quizService';
import '../styles/QuizSelection.css';

const QuizSelection = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const availableQuizzes = await fetchAvailableQuizzes();
        setQuizzes(availableQuizzes);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  if (loading) {
    return <div className="loading">Loading available quizzes...</div>;
  }

  return (
    <div className="quiz-selection">
      <h2>Available Quizzes</h2>
      {quizzes.length === 0 ? (
        <p>No quizzes available at the moment.</p>
      ) : (
        <ul className="quiz-list">
          {quizzes.map((quiz, index) => (
            <li key={index} className="quiz-item">
              <Link to={`/quiz/${encodeURIComponent(quiz)}`} className="quiz-link">
                {quiz.replace('.csv', '')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QuizSelection;
