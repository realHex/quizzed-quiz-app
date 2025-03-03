import React, { useState, useEffect } from 'react';
import { shuffleArray } from '../../utils/arrayUtils';
import '../../styles/Question.css';

const QuestionMulti = ({ question, answer, onAnswerChange, disabled }) => {
  const [shuffledOptions, setShuffledOptions] = useState([]);
  
  useEffect(() => {
    // Shuffle options for this question
    setShuffledOptions(shuffleArray([...question.options]));
  }, [question]);
  
  const handleOptionToggle = (option) => {
    if (disabled) return;
    
    // Copy current answers
    const currentAnswers = Array.isArray(answer) ? [...answer] : [];
    
    // Toggle the selection
    if (currentAnswers.includes(option)) {
      onAnswerChange(currentAnswers.filter(a => a !== option));
    } else {
      onAnswerChange([...currentAnswers, option]);
    }
  };
  
  return (
    <div className="question-multi">
      <div className="question-text">{question.question}</div>
      <div className="multi-instructions">(Select all that apply)</div>
      <div className="options-list">
        {shuffledOptions.map((option, index) => (
          <div 
            key={index} 
            className={`option ${Array.isArray(answer) && answer.includes(option) ? 'selected' : ''}`}
            onClick={() => handleOptionToggle(option)}
          >
            <span className="checkbox">
              {Array.isArray(answer) && answer.includes(option) ? '✓' : ''}
            </span>
            <span className="option-text">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionMulti;
