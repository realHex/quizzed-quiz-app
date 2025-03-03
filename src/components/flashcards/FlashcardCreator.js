import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFlashcardSet, processHtmlContent } from '../../utils/flashcardService';
import '../../styles/Flashcards.css';

const FlashcardCreator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Info, 2: Paste content, 3: Review
  
  const navigate = useNavigate();
  
  const handleNextStep = () => {
    if (step === 1 && !title.trim()) {
      setError('Please enter a title for your flashcard set');
      return;
    }
    setStep(prevStep => prevStep + 1);
    setError(null);
  };
  
  const handlePrevStep = () => {
    setStep(prevStep => prevStep - 1);
    setError(null);
  };
  
  const handlePasteContent = async () => {
    if (!pastedContent.trim()) {
      setError('Please paste some content from your Word table');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Process the pasted HTML to extract questions, answers, and images
      const processedItems = await processHtmlContent(pastedContent);
      
      if (processedItems.length === 0) {
        setError('No valid flashcard content was detected. Please check your Word table format.');
        setLoading(false);
        return;
      }
      
      setItems(processedItems);
      handleNextStep();
    } catch (err) {
      setError(`Error processing content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveFlashcards = async () => {
    if (items.length === 0) {
      setError('No flashcard items to save');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Save the flashcard set and its items
      const newFlashcardSet = await createFlashcardSet({
        title,
        description,
        tag,
        items
      });
      
      // Navigate to the flashcard set page
      navigate(`/flashcards/${newFlashcardSet.id}`);
    } catch (err) {
      setError(`Error saving flashcards: ${err.message}`);
      setLoading(false);
    }
  };
  
  const handleContentPaste = (e) => {
    // Save the HTML content when pasting
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('text/html');
    
    if (pastedData) {
      e.preventDefault();
      setPastedContent(pastedData);
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flashcard-form">
            <h2>Create New Flashcard Set</h2>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your flashcard set"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description (optional)"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tag">Tag/Category</label>
              <input
                type="text"
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Enter a tag or category (optional)"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="next-button"
                onClick={handleNextStep}
              >
                Next
              </button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="paste-content">
            <h2>Paste Your Word Table</h2>
            <div className="paste-instructions">
              <p>Please copy and paste your Word table below. The first column should contain questions, and the second column should contain answers (which may include images).</p>
              <ol>
                <li>Open your Word document</li>
                <li>Select and copy the table (Ctrl+C)</li>
                <li>Paste it below (Ctrl+V)</li>
              </ol>
            </div>
            
            <div className="form-group">
              <div 
                className="paste-area" 
                contentEditable={true}
                onPaste={handleContentPaste}
                dangerouslySetInnerHTML={{ __html: pastedContent }}
              />
              <small>Click in the box above and paste (Ctrl+V) your Word table</small>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="back-button"
                onClick={handlePrevStep}
                disabled={loading}
              >
                Back
              </button>
              <button 
                type="button" 
                className="process-button"
                onClick={handlePasteContent}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Process Content'}
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="review-flashcards">
            <h2>Review Your Flashcards</h2>
            <p>Found {items.length} flashcards. Please review them before saving.</p>
            
            <div className="flashcards-preview">
              {items.map((item, index) => (
                <div key={index} className="flashcard-preview-item">
                  <h3>Card {index + 1}</h3>
                  <div className="flashcard-preview-content">
                    <div className="flashcard-question">
                      <strong>Question:</strong>
                      <div>{item.question}</div>
                    </div>
                    <div className="flashcard-answer">
                      <strong>Answer:</strong>
                      <div dangerouslySetInnerHTML={{ __html: item.answer.replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" alt="Flashcard image" class="preview-image" />') }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="back-button"
                onClick={handlePrevStep}
                disabled={loading}
              >
                Back
              </button>
              <button 
                type="button" 
                className="save-button"
                onClick={handleSaveFlashcards}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Flashcards'}
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="flashcard-creator-container">
      <div className="flashcard-creator">
        {error && <div className="error-message">{error}</div>}
        
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Set Info</div>
          <div className={`step-connector ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Paste Content</div>
          <div className={`step-connector ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Review</div>
        </div>
        
        {renderStepContent()}
      </div>
    </div>
  );
};

export default FlashcardCreator;
