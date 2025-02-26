import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parseQuizData } from '../services/quizService';
import QuestionYesNo from './questions/QuestionYesNo';
import QuestionMCQ from './questions/QuestionMCQ';
import QuestionMulti from './questions/QuestionMulti';
import '../styles/QuizAttempt.css';

const QuizAttempt = () => {
  const { quizName } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const quizData = await parseQuizData(quizName);
        setQuestions(quizData);
        // Initialize empty answers for all questions
        const initialAnswers = {};
        quizData.forEach(question => {
          initialAnswers[question.id] = question.type === 'MULTI' ? [] : '';
        });
        setAnswers(initialAnswers);
        setLoading(false);
      } catch (err) {
        setError('Failed to load quiz data. Please try again.');
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizName]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: answer
    }));
  };

  const navigateToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const submitQuiz = () => {
    // Calculate results
    let correctCount = 0;
    
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;
      
      // Skip if answer is undefined or empty
      if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
        return;
      }

      switch(question.type) {
        case 'YESNO':
          if (userAnswer && correctAnswer && 
              userAnswer.toString().toLowerCase() === correctAnswer.toString().toLowerCase()) {
            correctCount++;
          }
          break;
        case 'MCQ':
          if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
            correctCount++;
          }
          break;
        case 'MULTI':
          if (Array.isArray(userAnswer) && userAnswer.length > 0 && correctAnswer) {
            const correctAnswersArray = correctAnswer.split(';');
            const correctSet = new Set(correctAnswersArray);
            const userSet = new Set(userAnswer);
            
            if (correctSet.size === userSet.size && 
                [...correctSet].every(value => userSet.has(value))) {
              correctCount++;
            }
          }
          break;
        default:
          break;
      }
    });

    // Store results in localStorage
    const results = {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      answers: answers
    };
    
    localStorage.setItem(`quiz-result-${quizName}`, JSON.stringify(results));
    
    // Navigate to results page
    navigate(`/result/${quizName}`);
  };

  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!questions.length) {
    return <div className="error">No questions found in this quiz.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-attempt">
      <h2>{decodeURIComponent(quizName).replace('.csv', '')}</h2>
      
      <div className="quiz-header">
        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <Link to="/" className="abandon-quiz">Return to Menu</Link>
      </div>
      
      <div className="question-container">
        {currentQuestion.type === 'YESNO' && (
          <QuestionYesNo
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        )}
        
        {currentQuestion.type === 'MCQ' && (
          <QuestionMCQ
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        )}
        
        {currentQuestion.type === 'MULTI' && (
          <QuestionMulti
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        )}
      </div>
      
      <div className="navigation-controls">
        <button 
          onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        
        <button 
          onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
        </button>
      </div>
      
      <div className="question-dots">
        {questions.map((_, index) => (
          <span 
            key={index} 
            className={`dot ${index === currentQuestionIndex ? 'active' : ''} ${answers[questions[index].id] ? 'answered' : ''}`}
            onClick={() => navigateToQuestion(index)}
          />
        ))}
      </div>
      
      <button 
        className="submit-button"
        onClick={submitQuiz}
      >
        Submit Quiz
      </button>
    </div>
  );
};

export default QuizAttempt;
