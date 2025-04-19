import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/QuizSelection.css';

const NotAvailable = ({ featureName = "Feature" }) => {
  return (
    <div className="quiz-selection-container">
      <div className="no-quizzes" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#4a5568', marginBottom: '20px' }}>
          <span role="img" aria-label="lock">🔒</span> Not Available
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#718096', marginBottom: '25px' }}>
          {featureName} is not available for now.
        </p>
        <Link to="/" className="quiz-list-action" style={{ display: 'inline-block', marginTop: '10px' }}>
          Return to Quizzes
        </Link>
      </div>
    </div>
  );
};

export default NotAvailable;