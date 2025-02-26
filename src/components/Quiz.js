import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveQuizAttempt, fetchQuizContent } from '../utils/quizService';

const Quiz = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
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
            } catch (error) {
                console.error('Error loading quiz:', error);
                setError('Failed to load quiz questions');
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [quizName]);

    const calculateScore = (answers, correctAnswers) => {
        let correct = 0;
        answers.forEach((answer, index) => {
            if (answer === correctAnswers[index]) correct++;
        });
        return Math.round((correct / answers.length) * 100);
    };

    const handleQuizSubmit = async () => {
        const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
        const score = calculateScore(userAnswers, questions.map(q => q.correct));

        try {
            await saveQuizAttempt({
                user_id: user.id,
                quiz_name: quizName.replace('.csv', ''),
                score: score,
                time: timeSpent,
            });

            setQuizCompleted(true);
            setFinalScore(score);
            setTotalTime(timeSpent);
        } catch (error) {
            console.error('Failed to save quiz attempt:', error);
            setError('Failed to save quiz results');
        }
    };

    // ... existing question handling code ...

    return (
        <div className="quiz-container">
            {loading ? (
                <div>Loading quiz...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : quizCompleted ? (
                <div className="quiz-results">
                    <h2>Quiz Completed!</h2>
                    <div className="results-details">
                        <p>Final Score: {finalScore}%</p>
                        <p>Time Taken: {totalTime} seconds</p>
                    </div>
                    <button onClick={() => navigate('/history')} className="view-history-btn">
                        View History
                    </button>
                </div>
            ) : (
                <>
                    {/* ... existing quiz questions display ... */}
                    <button 
                        onClick={handleQuizSubmit} 
                        className="submit-quiz-btn"
                        disabled={userAnswers.length !== questions.length}
                    >
                        Submit Quiz
                    </button>
                </>
            )}
        </div>
    );
};

export default Quiz;
