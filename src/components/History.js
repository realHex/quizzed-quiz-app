import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
        .from('attempts')
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

  if (loading) return <div>Loading history...</div>;

  return (
    <div className="history-container">
      <h2>Your Quiz History</h2>
      <div className="attempts-list">
        {attempts.length === 0 ? (
          <p>No attempts yet. Try taking a quiz!</p>
        ) : (
          attempts.map((attempt) => (
            <div key={attempt.id} className="attempt-card">
              <h3>{attempt.quiz_name}</h3>
              <div className="attempt-details">
                <p>Score: {attempt.score}%</p>
                <p>Questions: {attempt.questions || 'N/A'}</p>
                <p>Time: {attempt.time || 'N/A'}</p>
                <p>Date: {new Date(attempt.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={handleBackToQuizzes} className="back-btn">
        Back to Quizzes
      </button>
    </div>
  );
};

export default History;
