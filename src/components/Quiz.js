import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveQuizAttempt, fetchQuizContent } from '../utils/quizService';
import { shuffleArray } from '../utils/arrayUtils';
import '../styles/Quiz.css';
import QuizQuestion from './Quiz/QuizQuestion';

const Quiz = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quizStartTime, setQuizStartTime] = useState(null);
    const [totalTime, setTotalTime] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [quizData, setQuizData] = useState(null); // To store metadata including PDF info
    
    const { quizName } = useParams();
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();

    // Format seconds into MM:SS format
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Timer effect
    useEffect(() => {
        if (quizStartTime && !quizCompleted && !loading) {
            const timer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
                setElapsedTime(elapsed);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [quizStartTime, quizCompleted, loading]);

    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            setError(null);
            setQuizStartTime(Date.now());

            try {
                // Now fetchQuizContent returns both questions and metadata
                const { questions: fetchedQuestions, metadata } = await fetchQuizContent(quizName);
                
                // Get shuffle preference from user profile
                const shouldShuffle = userProfile?.shuffle ?? false;
                
                // Prepare questions - shuffle if user preference is ON
                let quizQuestions = [...fetchedQuestions];
                
                if (shouldShuffle) {
                    quizQuestions = shuffleArray(quizQuestions);
                } else {
                    // Sort questions by ID or another field if needed
                    quizQuestions.sort((a, b) => a.id - b.id);
                }
                
                setQuestions(quizQuestions);
                setQuizData(metadata); // Store metadata including PDF info
                
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
    }, [quizName, userProfile]);

    const calculateScore = () => {
        let correct = 0;
        
        questions.forEach((question, index) => {
            if (isAnswerCorrect(question, userAnswers[index])) {
                correct++;
            }
        });
        
        setCorrectCount(correct);
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
        
        // Calculate score and get correct answers count directly
        let correct = 0;
        questions.forEach((question, index) => {
            if (isAnswerCorrect(question, userAnswers[index])) {
                correct++;
            }
        });
        
        const score = Math.round((correct / questions.length) * 100);
        setLoading(true);

        try {
            await saveQuizAttempt({
                user_id: user.id,
                quiz_name: quizName.replace('.csv', ''),
                score: score,
                time: formatTime(timeSpent),
                questions: `${correct}/${questions.length}`
            });

            // Update state after successful save
            setCorrectCount(correct);
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
                        <p>Questions: {correctCount}/{questions.length}</p>
                        <p>Time Taken: {formatTime(totalTime)}</p>
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
                            <div>Question {currentQuestion + 1} of {questions.length}</div>
                            <div className="quiz-timer">Time: {formatTime(elapsedTime)}</div>
                        </div>
                    </div>

                    <QuizQuestion 
                        question={questions[currentQuestion]}
                        onAnswerSubmit={(answer) => {
                            const newAnswers = [...userAnswers];
                            newAnswers[currentQuestion] = answer;
                            setUserAnswers(newAnswers);
                            
                            // Mark question as answered and show feedback
                            const newAnsweredQuestions = [...answeredQuestions];
                            newAnsweredQuestions[currentQuestion] = true;
                            setAnsweredQuestions(newAnsweredQuestions);
                            setShowFeedback(true);
                        }}
                        showAnswer={showFeedback && answeredQuestions[currentQuestion]}
                        userAnswer={userAnswers[currentQuestion]}
                        onNextQuestion={handleNextQuestion}
                        quizData={quizData} // Pass metadata including PDF info
                        onPreviousQuestion={handlePreviousQuestion} // Pass this to handle previous button
                        isFirstQuestion={currentQuestion === 0} // Let component know if it's first question
                    />

                    {/* Remove the navigation-controls section with the extra buttons, 
                        since we're handling navigation in the QuizQuestion component now */}
                    
                    {/* Add submit button only when on last question and it's been answered */}
                    {currentQuestion === questions.length - 1 && answeredQuestions[currentQuestion] && !showFeedback && (
                        <div className="submit-quiz-container">
                            <button 
                                onClick={handleQuizSubmit} 
                                className="submit-quiz-btn"
                            >
                                Submit Quiz
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Quiz;
