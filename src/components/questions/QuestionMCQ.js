import React from 'react';
import '../../styles/Question.css';

const QuestionMCQ = ({ question, answer, onAnswerChange }) => {
  return (
    <div className="question mcq-question">
      <h3>{question.text}</h3>
      <div className="options-container">
        {question.options.map((option, index) => (
          <label key={index} className={`option ${answer === String(index + 1) ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`question-${question.id}`}
              value={index + 1}
              checked={answer === String(index + 1)}
              onChange={() => onAnswerChange(String(index + 1))}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionMCQ;
