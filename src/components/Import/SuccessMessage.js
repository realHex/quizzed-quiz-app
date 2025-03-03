import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessMessage = ({ handleTryAgain }) => {
  const navigate = useNavigate();
  
  return (
    <div className="success-message">
      <div className="success-icon">✓</div>
      <h3>Upload Successful!</h3>
      <p>Your quiz has been imported successfully.</p>
      <div className="success-actions">
        <button onClick={handleTryAgain} className="upload-another-button">
          Upload Another Quiz
        </button>
        <button onClick={() => navigate('/')} className="view-quizzes-button">
          View Quizzes
        </button>
      </div>
    </div>
  );
};

export default SuccessMessage;
