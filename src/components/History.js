import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/History.css';

const History = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAttempts();
  }, [user]);

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('attempts')  // Changed from 'history' to 'attempts'
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttempts(data);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToQuizzes = () => {
    navigate('/');
  };

  // Function to determine score class (excellent, good, needs-work)
  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-needs-work';
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="history-loading-spinner"></div>
        <p>Loading your quiz history...</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Your Quiz History</h2>
        <p>Track your progress and improve your scores</p>
      </div>

      {attempts.length === 0 ? (
        <div className="empty-history">
          <p>You haven't completed any quizzes yet.</p>
          <Link to="/" className="take-quiz-btn">
            Take a Quiz
          </Link>
        </div>
      ) : (
        <div className="attempts-list">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="attempt-card">
              <div className="attempt-header">
                <h3>{attempt.quiz_name}</h3>
                <span className="attempt-date">
                  {formatDate(attempt.created_at)}
                </span>
              </div>
              <div className="attempt-details">
                <div className="detail-item">
                  <div className="detail-icon icon-score">
                    <span>%</span>
                  </div>
                  <span className="detail-label">Score:</span>
                  <span className={`score-value ${getScoreClass(attempt.score)}`}>
                    {attempt.score}%
                  </span>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon icon-questions">
                    <span>?</span>
                  </div>
                  <span className="detail-label">Questions:</span>
                  <span className="detail-value">{attempt.questions || 'N/A'}</span>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon icon-time">
                    <span>⏱️</span>
                  </div>
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{attempt.time || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={handleBackToQuizzes} className="back-btn">
        Back to Quizzes
      </button>
    </div>
  );
};

export default History;
