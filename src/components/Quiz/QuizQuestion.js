import React, { useState, useEffect } from 'react';
import { shuffleArray } from '../../utils/arrayUtils';
import SlideDisplay from './SlideDisplay';

const QuizQuestion = ({ 
  question, 
  onAnswerSubmit, 
  showAnswer = false, 
  userAnswer = null, 
  onNextQuestion,
  quizData,
  onPreviousQuestion,
  isFirstQuestion
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showSlide, setShowSlide] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [optionMapping, setOptionMapping] = useState({});
  
  // Reset state when question changes and shuffle options
  useEffect(() => {
    setSelectedOption(null);
    setSelectedOptions([]);
    setShowSlide(false);
    
    // Don't shuffle for YES/NO questions
    if (question.type === 'YESNO') {
      setShuffledOptions(question.options);
      return;
    }
    
    // Create a mapping between original and shuffled options
    const mapping = {};
    const originalOptions = [...question.options];
    const shuffled = shuffleArray(originalOptions);
    
    shuffled.forEach((option, shuffledIndex) => {
      const originalIndex = originalOptions.indexOf(option);
      mapping[shuffledIndex] = originalIndex;
    });
    
    setShuffledOptions(shuffled);
    setOptionMapping(mapping);
  }, [question]);
  
  // Show slide after answer is checked
  useEffect(() => {
    if (showAnswer && question.slide) {
      setShowSlide(true);
    } else {
      setShowSlide(false);
    }
  }, [showAnswer, question]);
  
  const handleOptionSelect = (optionIndex) => {
    if (showAnswer) return; // Prevent changing answer after submission
    
    if (question.type === 'MCQ' || question.type === 'YESNO') {
      setSelectedOption(optionIndex);
    } else if (question.type === 'MULTI') {
      // For multi-select questions
      if (selectedOptions.includes(optionIndex)) {
        setSelectedOptions(selectedOptions.filter(index => index !== optionIndex));
      } else {
        setSelectedOptions([...selectedOptions, optionIndex]);
      }
    }
  };
  
  const handleSubmitAnswer = () => {
    if (showAnswer) {
      // If already showing answer, proceed to next question
      onNextQuestion();
      return;
    }
    
    let answer;
    if (question.type === 'MCQ' || question.type === 'YESNO') {
      // For single-select, get the actual option value
      answer = selectedOption !== null ? shuffledOptions[selectedOption] : null;
    } else {
      // For multi-select, get all selected option values
      answer = selectedOptions.map(index => shuffledOptions[index]);
    }
    
    onAnswerSubmit(answer);
    
    // Show slide if available
    if (question.slide) {
      setShowSlide(true);
    }
  };

  // Determine if an option is correct for displaying feedback
  const isOptionCorrect = (optionIndex) => {
    if (!showAnswer) return false;
    
    const optionText = shuffledOptions[optionIndex];
    
    if (question.type === 'MCQ' || question.type === 'YESNO') {
      return optionText === question.correct;
    } else if (question.type === 'MULTI') {
      return question.correct.includes(optionText);
    }
    
    return false;
  };
  
  // Check if user selected this option
  const isOptionSelected = (optionIndex) => {
    if (question.type === 'MCQ' || question.type === 'YESNO') {
      return selectedOption === optionIndex;
    } else {
      return selectedOptions.includes(optionIndex);
    }
  };

  return (
    <div className="quiz-question">
      <div className="question-header">
        <h3>{question.question}</h3>
        {question.type === 'MULTI' && <p className="multi-instruction">(Select all that apply)</p>}
      </div>
      
      <div className="options-container">
        {shuffledOptions.map((option, index) => (
          <div 
            key={index} 
            className={`option ${isOptionSelected(index) ? 'selected' : ''} 
                        ${showAnswer && isOptionCorrect(index) ? 'correct' : ''}
                        ${showAnswer && isOptionSelected(index) && !isOptionCorrect(index) ? 'incorrect' : ''}`}
            onClick={() => handleOptionSelect(index)}
          >
            <span className="option-text">{option}</span>
          </div>
        ))}
      </div>
      
      <div className="navigation-controls">
        <button
          onClick={onPreviousQuestion}
          disabled={isFirstQuestion}
          className="nav-button prev-button"
        >
          Previous
        </button>
        
        <button 
          className="submit-answer-btn" 
          onClick={handleSubmitAnswer}
          disabled={
            question.type === 'MULTI' 
              ? selectedOptions.length === 0 && !showAnswer 
              : selectedOption === null && !showAnswer
          }
        >
          {showAnswer ? 'Next Question' : 'Check Answer'}
        </button>
      </div>
      
      <SlideDisplay 
        slideInfo={question.slide} 
        pdfName={quizData?.pdf} 
        isVisible={showSlide}
      />
    </div>
  );
};

export default QuizQuestion;
