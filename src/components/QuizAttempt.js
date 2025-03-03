import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parseQuizData } from '../services/quizService';
import { shuffleArray } from '../utils/arrayUtils';
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
  const [feedback, setFeedback] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const quizData = await parseQuizData(quizName);
        // Randomize the questions
        const randomizedQuizData = shuffleArray(quizData);
        setQuestions(randomizedQuizData);
        
        // Initialize empty answers for all questions
        const initialAnswers = {};
        randomizedQuizData.forEach(question => {
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

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeLeft(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkAnswer = (questionId, answer) => {
    const question = questions.find(q => q.id === questionId);
    const correctAnswer = question.correctAnswer;
    
    switch(question.type) {
      case 'YESNO':
        return answer.toString().toLowerCase() === correctAnswer.toString().toLowerCase();
      case 'MCQ':
        return answer === correctAnswer;
      case 'MULTI':
        if (Array.isArray(answer) && answer.length > 0) {
          const correctAnswersArray = correctAnswer.split(';');
          const correctSet = new Set(correctAnswersArray);
          const userSet = new Set(answer);
          return correctSet.size === userSet.size && 
                 [...correctSet].every(value => userSet.has(value));
        }
        return false;
      default:
        return false;
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: answer
    }));
  };

  const checkAndShowAnswer = () => {
    const currentQuestionId = currentQuestion.id;
    const answer = answers[currentQuestionId];
    
    // Don't proceed if no answer selected
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      return;
    }

    const isCorrect = checkAnswer(currentQuestionId, answer);
    setFeedback({
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer
    });
    setIsAnswerChecked(true);
    
    // Add question to answered questions set
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionId]));
  };

  const isQuestionAnswered = (questionId) => {
    return answeredQuestions.has(questionId);
  };

  const handleNextClick = () => {
    if (!isAnswerChecked) {
      checkAndShowAnswer();
    } else {
      navigateToQuestion(currentQuestionIndex + 1);
      setFeedback(null);
      setIsAnswerChecked(false);
    }
  };

  const navigateToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      setFeedback(null);
      setIsAnswerChecked(false);
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

  const formatCorrectAnswer = (question) => {
    if (question.type === 'YESNO') {
      return question.correctAnswer;
    }
    
    if (question.type === 'MCQ') {
      const optionIndex = parseInt(question.correctAnswer) - 1;
      return question.options[optionIndex];
    }
    
    if (question.type === 'MULTI') {
      const correctIndices = question.correctAnswer.split(';');
      return correctIndices
        .map(index => question.options[parseInt(index) - 1])
        .join(', ');
    }
    
    return question.correctAnswer;
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

  const isAnswered = (questionIndex) => {
    const answer = answers[questions[questionIndex].id];
    if (!answer) return false;
    
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    
    return answer !== '';
  };

  return (
    <div className="quiz-attempt">
      <div className="quiz-header">
        <h2>{decodeURIComponent(quizName).replace('.csv', '')}</h2>
        
        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} of {questions.length}
          <div className="timer">{formatTime(timeLeft || 0)}</div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <Link to="/" className="abandon-quiz">Return to Menu</Link>
      </div>
      
      <div className="question-container">
        {currentQuestion.type === 'YESNO' && (
          <QuestionYesNo
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            disabled={isQuestionAnswered(currentQuestion.id)}
          />
        )}
        
        {currentQuestion.type === 'MCQ' && (
          <QuestionMCQ
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            disabled={isQuestionAnswered(currentQuestion.id)}
          />
        )}
        
        {currentQuestion.type === 'MULTI' && (
          <QuestionMulti
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            disabled={isQuestionAnswered(currentQuestion.id)}
          />
        )}

        {feedback && (
          <div className={`feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="score-animation">
              {feedback.isCorrect ? (
                <p>✅ Correct!</p>
              ) : (
                <div>
                  <p>❌ Incorrect</p>
                  <p>Correct answer: {formatCorrectAnswer(currentQuestion)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="navigation-container">
        <div className="navigation-controls">
          <button 
            onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          <button 
            onClick={handleNextClick}
            disabled={currentQuestionIndex === questions.length - 1 && isAnswerChecked}
          >
            {!isAnswerChecked ? 'Answer' : 
             (currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next')}
          </button>
        </div>
        
        <div className="question-dots">
          {questions.map((_, index) => (
            <span 
              key={index} 
              className={`dot ${index === currentQuestionIndex ? 'active' : ''} ${isAnswered(index) ? 'answered' : ''}`}
              onClick={() => navigateToQuestion(index)}
            />
          ))}
        </div>
        
        {currentQuestionIndex === questions.length - 1 && isAnswerChecked && (
          <button 
            className="submit-button"
            onClick={submitQuiz}
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizAttempt;
