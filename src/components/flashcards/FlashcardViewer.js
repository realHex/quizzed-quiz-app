import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFlashcardSet, updateFlashcardReviewTime } from '../../utils/flashcardService';
import '../../styles/Flashcards.css';

const FlashcardViewer = () => {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [originalItems, setOriginalItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRecallButtons, setShowRecallButtons] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);
  const [reviewingCardId, setReviewingCardId] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const questionRef = useRef(null);
  const answerRef = useRef(null);

  useEffect(() => {
    const loadFlashcardSet = async () => {
      try {
        setLoading(true);
        const data = await fetchFlashcardSet(id);
        
        // Store all items for the "Show All Cards" view
        setOriginalItems(data.items || []);
        
        // Filter out flashcards that aren't due for review yet
        const now = new Date();
        const availableCards = data.items.filter(item => 
          !item.next_review_at || new Date(item.next_review_at) <= now
        );
        
        setFlashcardSet({
          ...data,
          items: availableCards
        });
      } catch (err) {
        setError('Error loading flashcards. Please try again later.');
        console.error('Error loading flashcard set:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFlashcardSet();
  }, [id]);

  // Reset answer visibility and recall buttons when changing cards
  useEffect(() => {
    setShowAnswer(false);
    setShowRecallButtons(false);
  }, [currentIndex]);

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
    setCurrentIndex(prevIndex => {
      return prevIndex === 0 ? (flashcardSet.items.length - 1) : (prevIndex - 1);
    });
  };

  const handleNextCard = () => {
    setCurrentIndex(prevIndex => {
      return prevIndex === flashcardSet.items.length - 1 ? 0 : (prevIndex + 1);
    });
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setShowRecallButtons(true);
  };

  const handleRecallDifficulty = async (difficulty, cardId = null) => {
    try {
      setReviewLoading(true);
      const targetCardId = cardId || currentCard.id;
      const result = await updateFlashcardReviewTime(targetCardId, difficulty);
      
      if (showAllCards) {
        // In "Show All Cards" view, update the next_review_at for the card being reviewed
        const nextReviewAt = result.next_review_at;
        const lastReviewed = result.last_reviewed;
        
        // Update the original items with the new review time
        setOriginalItems(prevItems => 
          prevItems.map(item => 
            item.id === targetCardId 
              ? {...item, next_review_at: nextReviewAt, last_reviewed: lastReviewed} 
              : item
          )
        );
        
        // Clear the reviewing card ID
        setReviewingCardId(null);
      } else {
        // Important: Prepare next card data before any state changes
        const updatedItems = flashcardSet.items.filter(item => item.id !== targetCardId);
        
        // Calculate new index
        let newIndex = currentIndex;
        if (newIndex >= updatedItems.length) {
          newIndex = 0;
        }
        
        // Handle the case when no cards are left
        if (updatedItems.length === 0) {
          setShowAnswer(false);
          setShowRecallButtons(false);
          
          setTimeout(() => {
            setShowAllCards(true);
          }, 50);
          return;
        }
        
        // Reset state for next card
        setShowAnswer(false);
        setShowRecallButtons(false);
        
        // Update state on next tick to avoid conflicts
        setTimeout(() => {
          setFlashcardSet(prev => ({
            ...prev,
            items: updatedItems
          }));
          setCurrentIndex(newIndex);
        }, 50);
      }
    } catch (err) {
      console.error('Error updating flashcard review time:', err);
      
      if (!showAllCards) {
        setShowAnswer(false);
        setShowRecallButtons(false);
        
        setTimeout(() => {
          const nextIndex = currentIndex === flashcardSet.items.length - 1 ? 0 : currentIndex + 1;
          setCurrentIndex(nextIndex);
        }, 50);
      }
    } finally {
      setReviewLoading(false);
    }
  };

  // Utility functions
  const formatNextReviewTime = (dateStr) => {
    if (!dateStr) return 'Not reviewed yet';
    
    const reviewDate = new Date(dateStr);
    const now = new Date();
    const diffMs = reviewDate - now;
    
    // If review time is in the past, it's available now
    if (diffMs <= 0) return 'Available now';
    
    // Convert ms to more human-readable format
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    if (diffHours > 0) return `In ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    if (diffMins > 0) return `In ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
    return `In ${diffSecs} ${diffSecs === 1 ? 'second' : 'seconds'}`;
  };

  const processAnswerContent = (answer) => {
    // Check for image-only content
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

  const handleShowAllCards = () => {
    setShowAllCards(true);
  };

  const handleReturnToReview = () => {
    // Filter cards again based on updated review times
    const now = new Date();
    const availableCards = originalItems.filter(item => 
      !item.next_review_at || new Date(item.next_review_at) <= now
    );
    
    setFlashcardSet(prev => ({
      ...prev,
      items: availableCards
    }));
    
    setShowAllCards(false);
    setCurrentIndex(0);
  };

  const handleReviewTimeClick = (cardId) => {
    if (reviewingCardId === cardId) {
      setReviewingCardId(null);
    } else {
      setReviewingCardId(cardId);
    }
  };

  // All Cards view
  const renderAllCardsView = () => {
    return (
      <div className="flashcards-all-view">
        <h2>All Cards</h2>
        <div className="flashcards-all-list">
          {originalItems.map(card => (
            <div key={card.id} className="flashcard-all-item">
              <div className="flashcard-all-content">
                <div className="flashcard-all-side">
                  <h3>Question</h3>
                  <div className="flashcard-all-question">{card.question}</div>
                </div>
                <div className="flashcard-all-side">
                  <h3>Answer</h3>
                  <div className="flashcard-all-answer" 
                       dangerouslySetInnerHTML={{ __html: processAnswerContent(card.answer) }}></div>
                </div>
              </div>
              <div className="flashcard-all-review">
                <div 
                  className="flashcard-review-time" 
                  onClick={() => handleReviewTimeClick(card.id)}
                >
                  Next review: {formatNextReviewTime(card.next_review_at)}
                </div>
                {reviewingCardId === card.id && (
                  <div className="recall-buttons recall-buttons-horizontal">
                    <button 
                      onClick={() => handleRecallDifficulty('again', card.id)} 
                      className="recall-button again-button"
                      disabled={reviewLoading}
                    >
                      Again (&lt;1m)
                    </button>
                    <button 
                      onClick={() => handleRecallDifficulty('hard', card.id)} 
                      className="recall-button hard-button"
                      disabled={reviewLoading}
                    >
                      Hard (&lt;6m)
                    </button>
                    <button 
                      onClick={() => handleRecallDifficulty('good', card.id)} 
                      className="recall-button good-button"
                      disabled={reviewLoading}
                    >
                      Good (&lt;15m)
                    </button>
                    <button 
                      onClick={() => handleRecallDifficulty('easy', card.id)} 
                      className="recall-button easy-button"
                      disabled={reviewLoading}
                    >
                      Easy (&lt;5d)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flashcard-actions">
          <button onClick={handleReturnToReview} className="back-button">
            Return to Review
          </button>
        </div>
      </div>
    );
  };

  // Study mode with show/hide answer
  const renderReviewMode = () => {
    return (
      <div className="flashcard-study-area">
        {totalCards === 0 ? (
          <div className="empty-state">
            <p>No cards available to review at this time.</p>
            <p>All cards are scheduled for later review based on your previous selections.</p>
            <button onClick={handleShowAllCards} className="show-all-cards-btn">
              Show All Cards
            </button>
          </div>
        ) : (
          <div className="flashcard-review-container">
            <div className="card-progress">
              Card {currentIndex + 1} of {totalCards}
            </div>

            <div className="flashcard-container-new">
              {/* Question section */}
              <div className="flashcard-question-section" ref={questionRef}>
                <div className="flashcard-question-content">
                  <div className="flashcard-text">{currentCard.question}</div>
                </div>
              </div>
              
              {/* Show Answer button (only when answer is hidden) */}
              {!showAnswer && (
                <button 
                  onClick={handleShowAnswer} 
                  className="show-answer-button"
                >
                  Show Answer
                </button>
              )}
              
              {/* Answer section (only visible when showAnswer is true) */}
              {showAnswer && (
                <div className="flashcard-answer-section" ref={answerRef}>
                  <div className={`flashcard-answer-content ${isImageOnly(currentCard.answer) ? 'image-only-content' : ''}`}>
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: processAnswerContent(currentCard.answer) 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Recall buttons only (no Show All Cards button) */}
              {showRecallButtons && (
                <div className="recall-buttons recall-buttons-horizontal">
                  <button 
                    onClick={() => handleRecallDifficulty('again')} 
                    className="recall-button again-button"
                    disabled={reviewLoading}
                  >
                    Again (&lt;1m)
                  </button>
                  <button 
                    onClick={() => handleRecallDifficulty('hard')} 
                    className="recall-button hard-button"
                    disabled={reviewLoading}
                  >
                    Hard (&lt;6m)
                  </button>
                  <button 
                    onClick={() => handleRecallDifficulty('good')} 
                    className="recall-button good-button"
                    disabled={reviewLoading}
                  >
                    Good (&lt;15m)
                  </button>
                  <button 
                    onClick={() => handleRecallDifficulty('easy')} 
                    className="recall-button easy-button"
                    disabled={reviewLoading}
                  >
                    Easy (&lt;5d)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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

      {/* Fixed position Show All Cards button */}
      {!showAllCards && (
        <div className="show-all-cards-fixed-container">
          <button onClick={handleShowAllCards} className="show-all-cards-btn fixed">
            Show All Cards
          </button>
        </div>
      )}

      {showAllCards ? renderAllCardsView() : renderReviewMode()}
    </div>
  );
};

export default FlashcardViewer;
