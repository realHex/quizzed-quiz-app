import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parseQuizData } from '../services/quizService';
import '../styles/QuizResult.css';

const QuizResult = () => {
  const { quizName } = useParams();
  const [results, setResults] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        // Get results from localStorage
        const resultData = localStorage.getItem(`quiz-result-${quizName}`);
        if (!resultData) {
          throw new Error('No results found');
        }
        
        const parsedResults = JSON.parse(resultData);
        setResults(parsedResults);
        
        // Get quiz data to show correct answers
        const quizData = await parseQuizData(quizName);
        setQuestions(quizData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading results:', err);
        setLoading(false);
      }
    };

    loadResults();
  }, [quizName]);

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (!results || !questions.length) {
    return (
      <div className="quiz-result error">
        <h2>Results Not Found</h2>
        <p>We couldn't find your quiz results. You may not have completed this quiz.</p>
        <Link to="/" className="btn-primary">Return to Quiz Selection</Link>
      </div>
    );
  }

  const { totalQuestions, correctAnswers, answers } = results;
  const percentageScore = Math.round((correctAnswers / totalQuestions) * 100);

  return (
    <div className="quiz-result">
      <h2>Quiz Results: {decodeURIComponent(quizName).replace('.csv', '')}</h2>
      
      <div className="score-summary">
        <div className="score-card">
          <div className="score-circle">
            <span className="score-percentage">{percentageScore}%</span>
          </div>
          <div className="score-details">
            <p>You scored {correctAnswers} out of {totalQuestions}</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Link to="/" className="btn-primary">Take Another Quiz</Link>
        <Link to={`/quiz/${quizName}`} className="btn-secondary">Retry This Quiz</Link>
      </div>
    </div>
  );
};

export default QuizResult;
