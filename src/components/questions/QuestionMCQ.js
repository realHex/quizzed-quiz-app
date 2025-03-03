import React, { useState, useEffect } from 'react';
import { shuffleArray } from '../../utils/arrayUtils';

const QuestionMCQ = ({ question, answer, onAnswerChange, disabled }) => {
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [optionMap, setOptionMap] = useState({});
  
  useEffect(() => {
    // Create mapping between original and shuffled options
    const originalOptions = [...question.options];
    const shuffled = shuffleArray(originalOptions);
    
    // Create a map from shuffled index to original option
    const mapping = {};
    shuffled.forEach((option, index) => {
      mapping[index] = option;
    });
    
    setShuffledOptions(shuffled);
    setOptionMap(mapping);
  }, [question]);
  
  const handleOptionSelect = (optionText) => {
    if (disabled) return;
    onAnswerChange(optionText);
  };
  
  return (
    <div className="question-mcq">
      <div className="question-text">{question.question}</div>
      <div className="options-list">
        {shuffledOptions.map((option, index) => (
          <div 
            key={index} 
            className={`option ${answer === option ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(option)}
          >
            <span className="option-text">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionMCQ;
