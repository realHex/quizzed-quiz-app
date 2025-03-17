import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFlashcardSets, deleteFlashcardSet } from '../../utils/flashcardService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';
import '../../styles/Flashcards.css';

const FlashcardsList = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSet, setDeletingSet] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState(null); // Track expanded folder
  const [organizedSets, setOrganizedSets] = useState({ tagFolders: {}, untagged: [] });
  const { user } = useAuth();
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    loadFlashcardSets();
  }, []);

  useEffect(() => {
    // Organize flashcard sets when they change
    if (flashcardSets.length > 0) {
      const organized = organizeFlashcardsByTag(flashcardSets);
      setOrganizedSets(organized);
    }
  }, [flashcardSets, searchTerm]);

  // Function to organize flashcards by tag - updated to display sets directly
  const organizeFlashcardsByTag = (sets) => {
    const filtered = sets.filter(set => 
      set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (set.tag && set.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (set.description && set.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.reduce((acc, set) => {
      if (set.tag) {
        if (!acc.tagFolders[set.tag]) {
          acc.tagFolders[set.tag] = [];
        }
        acc.tagFolders[set.tag].push(set);
      } else {
        acc.untagged.push(set);
      }
      return acc;
    }, { tagFolders: {}, untagged: [] });
  };
  
  const toggleFolder = (folderName) => {
    setExpandedFolder(current => current === folderName ? null : folderName);
  };

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
          .select('id, name')
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

  // Render flashcard set in list format
  const renderFlashcardSetList = (set, inFolder = false) => {
    return (
      <div key={set.id} className="flashcard-set-list-item">
        <Link to={`/flashcards/${set.id}`} className="flashcard-list-content">
          <div className="flashcard-list-title">{set.title}</div>
          {!inFolder && set.tag && <div className="flashcard-list-tag">{set.tag}</div>}
          <div className="flashcard-list-info">
            <span>{set.card_count || 0} {set.card_count === 1 ? 'card' : 'cards'}</span>
            <span>Created by {getCreatorName(set.user_id)}</span>
            <span>{new Date(set.created_at).toLocaleDateString()}</span>
          </div>
        </Link>
        {isSetOwner(set) && (
          <button 
            className="delete-list-button"
            onClick={(e) => handleDeleteClick(set, e)}
            title="Delete this flashcard set"
          >
            🗑️
          </button>
        )}
      </div>
    );
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
      ) : Object.keys(organizedSets.tagFolders).length === 0 && organizedSets.untagged.length === 0 ? (
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
        <div>
          {/* Folders view - simplified to display flashcards directly */}
          {Object.keys(organizedSets.tagFolders).length > 0 && (
            <div className="folders-section">
              <h2>Folders</h2>
              <div className="folder-list">
                {Object.keys(organizedSets.tagFolders).map(tagName => (
                  <div key={tagName} className="folder-list-item">
                    <div 
                      className={`folder-row ${expandedFolder === tagName ? 'expanded' : ''}`}
                      onClick={() => toggleFolder(tagName)}
                    >
                      <div className="folder-icon">📁</div>
                      <div className="folder-details">
                        <h3>{tagName}</h3>
                        <p>
                          {organizedSets.tagFolders[tagName].length} {organizedSets.tagFolders[tagName].length === 1 ? 'set' : 'sets'}
                        </p>
                      </div>
                      <div className="folder-toggle-icon">
                        {expandedFolder === tagName ? '−' : '+'}
                      </div>
                    </div>
                    
                    {expandedFolder === tagName && (
                      <div className="folder-contents-wrapper">
                        <div className="folder-contents">
                          {/* Display flashcard sets directly without additional layer */}
                          <div className="flashcard-sets-list">
                            {organizedSets.tagFolders[tagName].map(set => 
                              renderFlashcardSetList(set, true)
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Untagged flashcard sets */}
          {organizedSets.untagged.length > 0 && (
            <div className="untagged-section">
              <h2>Untagged Flashcard Sets</h2>
              <div className="flashcard-sets-list">
                {organizedSets.untagged.map(set => 
                  renderFlashcardSetList(set)
                )}
              </div>
            </div>
          )}
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
