import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFlashcardSets, deleteFlashcardSet } from '../../utils/flashcardService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase'; // Add this import
import '../../styles/Flashcards.css';

const FlashcardsList = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSet, setDeletingSet] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    loadFlashcardSets();
  }, []);

  const loadFlashcardSets = async () => {
    try {
      setLoading(true);
      const data = await fetchFlashcardSets();
      setFlashcardSets(data);
    } catch (err) {
      setError('Error loading flashcard sets. Please try again later.');
      console.error('Error loading flashcard sets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (!flashcardSets.length) return;
      
      const uniqueUserIds = [...new Set(flashcardSets.map(set => set.user_id))];
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name') // Remove avatar_url since it doesn't exist
          .in('id', uniqueUserIds);
          
        if (error) throw error;
        
        const profilesMap = data.reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {});
        
        setUserProfiles(profilesMap);
      } catch (err) {
        console.error('Error fetching user profiles:', err);
      }
    };
    
    fetchUserProfiles();
  }, [flashcardSets]);

  const getCreatorName = (userId) => {
    if (!userId) return 'Unknown';
    return userProfiles[userId]?.name || 'User';
  };

  const filteredSets = flashcardSets.filter(set => 
    set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (set.tag && set.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (set.description && set.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteClick = (set, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingSet(set);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingSet(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSet) return;
    
    try {
      setIsDeleting(true);
      await deleteFlashcardSet(deletingSet.id);
      setFlashcardSets(prevSets => prevSets.filter(set => set.id !== deletingSet.id));
      setShowDeleteModal(false);
      setDeletingSet(null);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const isSetOwner = (set) => {
    return user && set.user_id === user.id;
  };

  return (
    <div className="flashcards-container">
      <div className="flashcards-header">
        <h1>Flashcards</h1>
        <p>Study and memorize information with flashcards</p>
      </div>

      <div className="flashcards-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search flashcard sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <Link to="/flashcards/create" className="create-button">
          Create Flashcards
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading flashcard sets...</p>
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No flashcard sets found</h3>
          {searchTerm ? (
            <p>No results match your search. Try a different term or clear your search.</p>
          ) : (
            <p>Create your first flashcard set to start studying!</p>
          )}
          <Link to="/flashcards/create" className="create-button">
            Create Flashcard Set
          </Link>
        </div>
      ) : (
        <div className="flashcard-sets-grid">
          {filteredSets.map(set => (
            <div key={set.id} className="flashcard-set-wrapper">
              <Link to={`/flashcards/${set.id}`} className="flashcard-set-card">
                <div className="set-card-body">
                  <h3>{set.title}</h3>
                  {set.tag && <div className="set-tag">{set.tag}</div>}
                  <p className="set-description">{set.description || 'No description'}</p>
                  <div className="set-creator">Created by {getCreatorName(set.user_id)}</div>
                </div>
                <div className="set-card-footer">
                  <span className="card-count">
                    {set.card_count || 0} {set.card_count === 1 ? 'card' : 'cards'}
                  </span>
                  <span className="created-date">
                    {new Date(set.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
              {isSetOwner(set) && (
                <button 
                  className="delete-set-button"
                  onClick={(e) => handleDeleteClick(set, e)}
                  title="Delete this flashcard set"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showDeleteModal && deletingSet && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Flashcard Set</h3>
            <p>Are you sure you want to delete "{deletingSet.title}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                onClick={handleCancelDelete} 
                className="cancel-button"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} 
                className="delete-button"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsList;
