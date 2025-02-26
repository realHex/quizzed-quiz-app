import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveQuizAttempt, fetchQuizContent } from '../utils/quizService';
import '../styles/Quiz.css';

const Quiz = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizStartTime, setQuizStartTime] = useState(null);
    const [totalTime, setTotalTime] = useState(0);
    
    const { quizName } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            setError(null);
            setQuizStartTime(Date.now());

            try {
                const quizQuestions = await fetchQuizContent(quizName);
                setQuestions(quizQuestions);
                // Initialize empty arrays for user answers
                setUserAnswers(quizQuestions.map(() => []));
                setAnsweredQuestions(new Array(quizQuestions.length).fill(false));
            } catch (error) {
                console.error('Error loading quiz:', error);
                setError('Failed to load quiz questions');
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [quizName]);

    const calculateScore = () => {
        let correct = 0;
        
        questions.forEach((question, index) => {
            if (isAnswerCorrect(question, userAnswers[index])) {
                correct++;
            }
        });
        
        return Math.round((correct / questions.length) * 100);
    };

    const isAnswerCorrect = (question, answer) => {
        if (!question || !answer) return false;
        
        switch(question.type) {
            case 'YESNO':
            case 'MCQ':
                return question.correct === answer;
            case 'MULTI':
                // For MULTI, all correct options must be selected and nothing extra
                if (!Array.isArray(answer) || !Array.isArray(question.correct)) return false;
                return (
                    answer.length === question.correct.length &&
                    question.correct.every(opt => answer.includes(opt))
                );
            default:
                return false;
        }
    };

    const handleQuizSubmit = async () => {
        const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
        const score = calculateScore();
        setLoading(true);

        try {
            await saveQuizAttempt({
                user_id: user.id,
                quiz_name: quizName.replace('.csv', ''),
                score: score
                // No time field in the attempts table
            });

            setQuizCompleted(true);
            setFinalScore(score);
            setTotalTime(timeSpent);
        } catch (error) {
            console.error('Failed to save quiz attempt:', error);
            setError('Failed to save quiz results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelection = (selectedOption) => {
        if (answeredQuestions[currentQuestion]) return; // Prevent changing answered questions
        
        const newAnswers = [...userAnswers];
        const question = questions[currentQuestion];
        
        if (question.type === 'MULTI') {
            // For multi-select, toggle the selected option
            if (newAnswers[currentQuestion].includes(selectedOption)) {
                newAnswers[currentQuestion] = newAnswers[currentQuestion].filter(opt => opt !== selectedOption);
            } else {
                newAnswers[currentQuestion] = [...newAnswers[currentQuestion], selectedOption];
            }
        } else {
            // For single-select questions
            newAnswers[currentQuestion] = selectedOption;
        }
        
        setUserAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
        if (showFeedback) {
            setShowFeedback(false);
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            }
        } else {
            // Mark current question as answered and show feedback
            const newAnsweredQuestions = [...answeredQuestions];
            newAnsweredQuestions[currentQuestion] = true;
            setAnsweredQuestions(newAnsweredQuestions);
            setShowFeedback(true);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestion > 0) {
            // When going back to a previous question, check if it was answered
            const prevQuestion = currentQuestion - 1;
            setCurrentQuestion(prevQuestion);
            
            // If the previous question was already answered, show the feedback
            setShowFeedback(answeredQuestions[prevQuestion]);
        }
    };

    const isQuestionAnswered = () => {
        const answer = userAnswers[currentQuestion];
        if (!answer) return false;
        
        // For multi-select, at least one option must be selected
        if (questions[currentQuestion].type === 'MULTI') {
            return Array.isArray(answer) && answer.length > 0;
        }
        
        // For other types, any non-empty answer is valid
        return answer !== '';
    };

    const renderFeedback = () => {
        const question = questions[currentQuestion];
        const userAnswer = userAnswers[currentQuestion];
        const isCorrect = isAnswerCorrect(question, userAnswer);
        
        return (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                <h4>{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
                {!isCorrect && (
                    <div className="correct-answer">
                        <p>Correct answer: 
                            {question.type === 'MULTI' 
                                ? question.correct.join(', ')
                                : question.correct}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const renderQuestion = () => {
        const question = questions[currentQuestion];
        if (!question) return null;
        
        const isAnswered = answeredQuestions[currentQuestion];
        const currentAnswer = userAnswers[currentQuestion];

        return (
            <div className="question-container">
                <h3 className="question-text">{question.question}</h3>
                
                {question.type === 'MULTI' ? (
                    // Multi-select question
                    <div className="options-grid multi-select">
                        {question.options.map((option, index) => (
                            <label 
                                key={index}
                                className={`option-checkbox ${
                                    isAnswered ? 'disabled' : ''
                                } ${
                                    Array.isArray(currentAnswer) && currentAnswer.includes(option) ? 'selected' : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                                    onChange={() => handleAnswerSelection(option)}
                                    disabled={isAnswered}
                                />
                                <span className="checkmark"></span>
                                {option}
                            </label>
                        ))}
                    </div>
                ) : (
                    // Single-select question (YESNO or MCQ)
                    <div className="options-grid">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                className={`option-button ${
                                    currentAnswer === option ? 'selected' : ''
                                } ${
                                    isAnswered ? 'disabled' : ''
                                }`}
                                onClick={() => handleAnswerSelection(option)}
                                disabled={isAnswered}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
                
                {(showFeedback && isAnswered) && renderFeedback()}
            </div>
        );
    };

    return (
        <div className="quiz-container">
            {loading ? (
                <div className="loading">Loading quiz...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : quizCompleted ? (
                <div className="quiz-results">
                    <h2>Quiz Completed!</h2>
                    <div className="results-details">
                        <p>Final Score: {finalScore}%</p>
                        <p>Time Taken: {totalTime} seconds</p>
                    </div>
                    <div className="results-actions">
                        <button onClick={() => navigate('/history')} className="view-history-btn">
                            View History
                        </button>
                        <button onClick={() => navigate('/')} className="back-to-quizzes-btn">
                            Back to Quizzes
                        </button>
                    </div>
                </div>
            ) : (
                <div className="quiz-content">
                    <div className="quiz-header">
                        <h2>{decodeURIComponent(quizName).replace('.csv', '')}</h2>
                        <div className="quiz-progress">
                            Question {currentQuestion + 1} of {questions.length}
                        </div>
                    </div>

                    {renderQuestion()}

                    <div className="navigation-controls">
                        <button
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestion === 0}
                        >
                            Previous
                        </button>
                        
                        {currentQuestion === questions.length - 1 && answeredQuestions[currentQuestion] && !showFeedback ? (
                            <button 
                                onClick={handleQuizSubmit} 
                                className="submit-quiz-btn"
                            >
                                Submit Quiz
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                disabled={!isQuestionAnswered() && !showFeedback}
                            >
                                {showFeedback ? 'Next' : 'Check Answer'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quiz;
