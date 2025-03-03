import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFlashcardSet } from '../../utils/flashcardService';
import '../../styles/Flashcards.css';

const FlashcardViewer = () => {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCardIndex, setNextCardIndex] = useState(null); // Store the next card index
  const flipTimeoutRef = useRef(null); // Ref for the timeout
  const { id } = useParams();
  const navigate = useNavigate();
  const frontContentRef = useRef(null);
  const backContentRef = useRef(null);
  const frontScalerRef = useRef(null);
  const backScalerRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadFlashcardSet = async () => {
      try {
        setLoading(true);
        const data = await fetchFlashcardSet(id);
        setFlashcardSet(data);
      } catch (err) {
        setError('Error loading flashcards. Please try again later.');
        console.error('Error loading flashcard set:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFlashcardSet();
  }, [id]);

  // Fix for flipping issue: Add useEffect to reset flipped state when index changes
  useEffect(() => {
    setFlipped(false);
  }, [currentIndex]);

  // Add an effect for content scaling with corrected dependency
  useEffect(() => {
    // Only run this effect when flashcardSet is available
    if (!flashcardSet || !flashcardSet.items || flashcardSet.items.length === 0) return;
    
    const scaleContent = () => {
      // Scale front content
      if (frontContentRef.current && frontScalerRef.current) {
        const content = frontContentRef.current;
        const container = frontScalerRef.current;
        
        // Reset transform to measure original size
        container.style.transform = 'scale(1)';
        
        // Get dimensions
        const containerRect = container.parentElement.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        
        // Calculate scale factors
        let scaleX = containerRect.width / contentRect.width;
        let scaleY = containerRect.height / contentRect.height;
        
        // Use the smaller scale factor to ensure content fits
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1
        
        // Apply transformation
        container.style.transform = `scale(${scale})`;
      }
      
      // Scale back content if being shown
      if (flipped && backContentRef.current && backScalerRef.current) {
        const content = backContentRef.current;
        const container = backScalerRef.current;
        
        // Reset transform to measure original size
        container.style.transform = 'scale(1)';
        
        // Get dimensions
        const containerRect = container.parentElement.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        
        // Calculate scale factors
        let scaleX = containerRect.width / contentRect.width;
        let scaleY = containerRect.height / contentRect.height;
        
        // Use the smaller scale factor to ensure content fits
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1
        
        // Apply transformation
        container.style.transform = `scale(${scale})`;
      }
    };
    
    // Perform initial scaling
    scaleContent();
    
    // Scale when window resizes
    window.addEventListener('resize', scaleContent);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', scaleContent);
    };
  }, [flashcardSet, flipped]); // Remove currentCard from dependencies

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <p>Loading flashcards...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!flashcardSet) {
    return (
      <div className="empty-state">
        <h3>Flashcard set not found</h3>
        <button onClick={() => navigate('/flashcards')} className="back-button">
          Back to Flashcards
        </button>
      </div>
    );
  }

  const { items = [] } = flashcardSet || {};
  const totalCards = items.length;
  const currentCard = items[currentIndex] || { question: '', answer: '' };

  const handlePrevCard = () => {
    // If the card is already flipped, first flip it back, then change cards
    if (flipped) {
      setFlipped(false);
      
      // Set the target card index for the transition
      const newIndex = currentIndex === 0 ? (flashcardSet.items.length - 1) : (currentIndex - 1);
      setNextCardIndex(newIndex);
      
      // Wait for the flip animation to complete before changing cards
      flipTimeoutRef.current = setTimeout(() => {
        setCurrentIndex(newIndex);
        setNextCardIndex(null);
      }, 300); // Half of the flip animation time (0.6s)
    } else {
      // If not flipped, just change cards directly
      setCurrentIndex(prevIndex => {
        return prevIndex === 0 ? (flashcardSet.items.length - 1) : (prevIndex - 1);
      });
    }
  };

  const handleNextCard = () => {
    // If the card is already flipped, first flip it back, then change cards
    if (flipped) {
      setFlipped(false);
      
      // Set the target card index for the transition
      const newIndex = currentIndex === flashcardSet.items.length - 1 ? 0 : currentIndex + 1;
      setNextCardIndex(newIndex);
      
      // Wait for the flip animation to complete before changing cards
      flipTimeoutRef.current = setTimeout(() => {
        setCurrentIndex(newIndex);
        setNextCardIndex(null);
      }, 300); // Half of the flip animation time (0.6s)
    } else {
      // If not flipped, just change cards directly
      setCurrentIndex(prevIndex => {
        return prevIndex === flashcardSet.items.length - 1 ? 0 : prevIndex + 1;
      });
    }
  };

  const toggleFlip = () => {
    // Cancel any pending transitions
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = null;
    }
    
    // Only toggle if not in the middle of a card change
    if (nextCardIndex === null) {
      setFlipped(!flipped);
    }
  };

  // Add a utility function to process the answer content
  const processAnswerContent = (answer) => {
    // More comprehensive check for image-only content
    // This handles cases with or without paragraph tags
    const containsOnlyImage = (
      /^\s*<img[^>]+>\s*$/.test(answer) || // Just an image tag
      /^\s*<p>\s*<img[^>]+>\s*<\/p>\s*$/.test(answer) || // Image in a paragraph
      /^\s*<div>\s*<img[^>]+>\s*<\/div>\s*$/.test(answer) // Image in a div
    );
    
    // If it's only an image, add a CSS class for styling
    let processedAnswer = answer;
    if (containsOnlyImage) {
      processedAnswer = answer.replace(
        /<img/, 
        '<img class="image-only-answer"'
      );
    }
      
    // Replace any markdown-style image references
    return processedAnswer.replace(
      /!\[.*?\]\((.*?)\)/g, 
      '<img src="$1" alt="Flashcard image" class="flashcard-image" />'
    );
  };

  const isImageOnly = (content) => {
    return (
      /^\s*<img[^>]+>\s*$/.test(content) || 
      /^\s*<p>\s*<img[^>]+>\s*<\/p>\s*$/.test(content) ||
      /^\s*<div>\s*<img[^>]+>\s*<\/div>\s*$/.test(content)
    );
  };

  return (
    <div className="flashcard-viewer-container">
      <div className="viewer-header">
        <button onClick={() => navigate('/flashcards')} className="back-link">
          ← Back to Flashcards
        </button>
        <h1>{flashcardSet.title}</h1>
      </div>

      {totalCards === 0 ? (
        <div className="empty-state">
          <p>This flashcard set is empty.</p>
        </div>
      ) : (
        <div className="flashcard-study-area">
          <div className="card-progress">
            Card {currentIndex + 1} of {totalCards}
          </div>

          <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={toggleFlip}>
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="card-content">
                  <div className="content-scaler" ref={frontScalerRef}>
                    <div className="scaled-content" ref={frontContentRef}>
                      <div className="flashcard-text">{currentCard.question}</div>
                    </div>
                  </div>
                  <div className="card-flip-hint">Click to flip</div>
                </div>
              </div>
              <div className="flashcard-back">
                <div className={`card-content ${isImageOnly(currentCard.answer) ? 'image-only-content' : ''}`}>
                  <div className="content-scaler" ref={backScalerRef}>
                    <div 
                      className="scaled-content" 
                      ref={backContentRef}
                      dangerouslySetInnerHTML={{ 
                        __html: processAnswerContent(currentCard.answer)
                      }}
                    />
                  </div>
                  <div className="card-flip-hint">Click to flip</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-navigation">
            <button onClick={handlePrevCard} className="nav-button prev-button">
              Previous
            </button>
            <button onClick={handleNextCard} className="nav-button next-button">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardViewer;
