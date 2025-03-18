import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Settings.css';

const Settings = () => {
  const { userProfile, toggleShuffleSetting, toggleFlashcardShuffleSetting } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFlashcardUpdating, setIsFlashcardUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [flashcardError, setFlashcardError] = useState(null);
  
  const handleToggleShuffle = async () => {
    if (isUpdating) return;
    
    setError(null);
    try {
      setIsUpdating(true);
      
      // Log the current value before toggling
      console.log('Current shuffle value before toggle:', userProfile?.shuffle);
      
      await toggleShuffleSetting();
      
      // Log the updated value after toggling
      console.log('Updated shuffle value should be:', !(userProfile?.shuffle ?? false));
    } catch (error) {
      console.error('Failed to toggle shuffle setting:', error);
      setError('Failed to update setting. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFlashcardShuffle = async () => {
    if (isFlashcardUpdating) return;
    
    setFlashcardError(null);
    try {
      setIsFlashcardUpdating(true);
      
      await toggleFlashcardShuffleSetting();
      
    } catch (error) {
      console.error('Failed to toggle flashcard shuffle setting:', error);
      setFlashcardError('Failed to update setting. Please try again.');
    } finally {
      setIsFlashcardUpdating(false);
    }
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      <div className="settings-section">
        <h2>Quiz Preferences</h2>
        
        <div className="setting-item">
          <div className="setting-info">
            <h3>Enable Question Shuffling</h3>
            <p>When enabled, questions will be presented in random order during quizzes.</p>
            {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={userProfile?.shuffle ?? false}
                onChange={handleToggleShuffle}
                disabled={isUpdating}
              />
              <span className="toggle-slider"></span>
            </label>
            {isUpdating && <span className="setting-updating">Updating...</span>}
            <span style={{marginLeft: '10px', fontSize: '0.8rem'}}>
              Current value: {userProfile?.shuffle ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h3>Enable Flashcard Shuffling</h3>
            <p>When enabled, flashcards will be presented in random order during review.</p>
            {flashcardError && <p className="error-message" style={{color: 'red'}}>{flashcardError}</p>}
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={userProfile?.shuffle_flashcards ?? false}
                onChange={handleToggleFlashcardShuffle}
                disabled={isFlashcardUpdating}
              />
              <span className="toggle-slider"></span>
            </label>
            {isFlashcardUpdating && <span className="setting-updating">Updating...</span>}
            <span style={{marginLeft: '10px', fontSize: '0.8rem'}}>
              Current value: {userProfile?.shuffle_flashcards ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
