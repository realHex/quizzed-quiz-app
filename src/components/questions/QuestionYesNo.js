import React from 'react';
import '../../styles/Question.css';

const QuestionYesNo = ({ question, answer, onAnswerChange, disabled }) => {
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
            disabled={disabled}
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
            disabled={disabled}
          />
          No
        </label>
      </div>
    </div>
  );
};

export default QuestionYesNo;
