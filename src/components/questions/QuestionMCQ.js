import React from 'react';

const QuestionMCQ = ({ question, answer, onAnswerChange, disabled }) => {
  return (
    <div className="question-content">
      <h3>{question.question}</h3>
      <div className="question-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerChange((index + 1).toString())}
            className={`option-button ${answer === (index + 1).toString() ? 'selected' : ''}`}
            disabled={disabled}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionMCQ;
