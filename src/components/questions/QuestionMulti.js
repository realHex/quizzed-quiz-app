import React from 'react';
import '../../styles/Question.css';

const QuestionMulti = ({ question, answer, onAnswerChange, disabled }) => {
  const isOptionSelected = (index) => {
    return answer.includes(String(index + 1));
  };

  const handleCheckboxChange = (index) => {
    if (disabled) return;

    const optionValue = String(index + 1);
    let updatedAnswer;
    
    if (isOptionSelected(index)) {
      // Remove option if already selected
      updatedAnswer = answer.filter(item => item !== optionValue);
    } else {
      // Add option if not already selected
      updatedAnswer = [...answer, optionValue];
    }
    
    onAnswerChange(updatedAnswer);
  };

  return (
    <div className="question multi-question">
      <h3>{question.text}</h3>
      <p className="hint">Select all that apply</p>
      <div className="options-container">
        {question.options.map((option, index) => (
          <label key={index} className={`option ${isOptionSelected(index) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              name={`question-${question.id}-option-${index + 1}`}
              value={index + 1}
              checked={isOptionSelected(index)}
              onChange={() => handleCheckboxChange(index)}
              disabled={disabled}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionMulti;
