import React from 'react';
import '../../styles/Question.css';

const QuestionYesNo = ({ question, answer, onAnswerChange }) => {
  return (
    <div className="question yesno-question">
      <h3>{question.text}</h3>
      <div className="options-container">
        <label className={`option ${answer === 'yes' ? 'selected' : ''}`}>
          <input
            type="radio"
            name={`question-${question.id}`}
            value="yes"
            checked={answer === 'yes'}
            onChange={() => onAnswerChange('yes')}
          />
          Yes
        </label>
        
        <label className={`option ${answer === 'no' ? 'selected' : ''}`}>
          <input
            type="radio"
            name={`question-${question.id}`}
            value="no"
            checked={answer === 'no'}
            onChange={() => onAnswerChange('no')}
          />
          No
        </label>
      </div>
    </div>
  );
};

export default QuestionYesNo;
