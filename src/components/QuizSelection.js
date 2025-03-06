import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizList } from '../utils/quizService';
import { useAuth } from '../context/AuthContext';
import '../styles/QuizSelection.css';

const QuizSelection = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'my' or 'all'
  const [viewMode, setViewMode] = useState('folders'); // 'folders' or 'flat'
  const [displayMode, setDisplayMode] = useState('list'); // Changed from 'grid' to 'list' to make list view default
  const [expandedFolder, setExpandedFolder] = useState(null); // Top-level folder (tag2)
  const [expandedSubFolder, setExpandedSubFolder] = useState(null); // Sub-folder (tag)
  const [organizedQuizzes, setOrganizedQuizzes] = useState({ 
    tag2Folders: {}, // Structure for two-level hierarchy
    untagged: [] 
  });
  const { user } = useAuth();

  useEffect(() => {
    loadQuizzes();
  }, [userFilter, user]);

  useEffect(() => {
    // Organize quizzes when they change or when view mode is changed to folders
    if (quizzes.length > 0 && viewMode === 'folders') {
      const organized = organizeQuizzesByTag2(filteredQuizzes);
      setOrganizedQuizzes(organized);
    }
  }, [quizzes, viewMode, userFilter, searchTerm]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      // Pass user ID if filtering by "My Quizzes"
      const quizData = await fetchQuizList(userFilter === 'my' ? user.id : null);
      setQuizzes(quizData);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleUserFilter = (filter) => {
    setUserFilter(filter);
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  const toggleDisplayMode = (mode) => {
    setDisplayMode(mode);
  };

  // Toggle top level folder (tag2)
  const toggleFolder = (folderName) => {
    if (expandedFolder === folderName) {
      setExpandedFolder(null);
      setExpandedSubFolder(null); // Close any open subfolder
    } else {
      setExpandedFolder(folderName);
      setExpandedSubFolder(null); // Reset subfolder when changing top folder
    }
  };
  
  // Toggle subfolder (tag)
  const toggleSubFolder = (subFolderName, event) => {
    event.stopPropagation(); // Prevent triggering the parent folder toggle
    setExpandedSubFolder(expandedSubFolder === subFolderName ? null : subFolderName);
  };

  // Filter quizzes by search term
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quiz.tag && quiz.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (quiz.tag2 && quiz.tag2.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Organize quizzes into a nested folder structure based on tag2 and tag
  const organizeQuizzesByTag2 = (quizList) => {
    const tag2Folders = {};
    const untagged = [];
    
    quizList.forEach(quiz => {
      if (quiz.tag2) {
        // Initialize tag2 folder if it doesn't exist
        if (!tag2Folders[quiz.tag2]) {
          tag2Folders[quiz.tag2] = {
            subfolders: {},
            untagged: []
          };
        }
        
        if (quiz.tag) {
          // Quiz has both tag2 and tag
          if (!tag2Folders[quiz.tag2].subfolders[quiz.tag]) {
            tag2Folders[quiz.tag2].subfolders[quiz.tag] = [];
          }
          tag2Folders[quiz.tag2].subfolders[quiz.tag].push(quiz);
        } else {
          // Quiz has tag2 but no tag
          tag2Folders[quiz.tag2].untagged.push(quiz);
        }
      } else if (quiz.tag) {
        // Quiz has tag but no tag2 - create a virtual tag2 folder using the tag
        const virtualTag2 = quiz.tag;
        if (!tag2Folders[virtualTag2]) {
          tag2Folders[virtualTag2] = {
            subfolders: {},
            untagged: []
          };
        }
        tag2Folders[virtualTag2].untagged.push(quiz);
      } else {
        // Quiz has neither tag2 nor tag
        untagged.push(quiz);
      }
    });
    
    return { tag2Folders, untagged };
  };

  // Filter organized quizzes when search is active
  const getFilteredOrganizedQuizzes = () => {
    if (!searchTerm) {
      return organizeQuizzesByTag2(filteredQuizzes);
    }
    
    const filteredTag2Folders = {};
    const filteredUntagged = organizedQuizzes.untagged.filter(quiz => 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    Object.keys(organizedQuizzes.tag2Folders).forEach(tag2Name => {
      const tag2Folder = organizedQuizzes.tag2Folders[tag2Name];
      const tag2Matches = tag2Name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter untagged quizzes in this tag2 folder
      const filteredTag2Untagged = tag2Folder.untagged.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || tag2Matches
      );
      
      // Filter subfolders
      const filteredSubfolders = {};
      let hasMatchingSubfolders = false;
      
      Object.keys(tag2Folder.subfolders).forEach(subfolderName => {
        const subfolderQuizzes = tag2Folder.subfolders[subfolderName];
        const subfolderMatches = subfolderName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const filteredSubfolderQuizzes = subfolderQuizzes.filter(quiz => 
          quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          subfolderMatches || 
          tag2Matches
        );
        
        if (filteredSubfolderQuizzes.length > 0) {
          filteredSubfolders[subfolderName] = filteredSubfolderQuizzes;
          hasMatchingSubfolders = true;
        }
      });
      
      // Add this tag2 folder if it has any matching content
      if (filteredTag2Untagged.length > 0 || hasMatchingSubfolders || tag2Matches) {
        filteredTag2Folders[tag2Name] = {
          subfolders: filteredSubfolders,
          untagged: filteredTag2Untagged
        };
      }
    });
    
    return {
      tag2Folders: filteredTag2Folders,
      untagged: filteredUntagged
    };
  };
  
  const filteredOrganized = getFilteredOrganizedQuizzes();

  // Render a single quiz item (used in both grid and list views)
  const renderQuizItem = (quiz, inFolder = false) => {
    if (displayMode === 'grid') {
      return (
        <div key={quiz.fileName} className={`quiz-card ${inFolder ? 'in-folder' : ''}`}>
          <div className="quiz-card-header">
            <h3>{quiz.title}</h3>
            {!inFolder && quiz.tag && <div className="category-tag">{quiz.tag}</div>}
            <div className="quiz-uploader">by {quiz.uploaderName}</div>
          </div>
          <Link to={`/quiz/${encodeURIComponent(quiz.fileName)}`} className="start-quiz-btn">
            Start Quiz
          </Link>
        </div>
      );
    } else {
      return (
        <div key={quiz.fileName} className="quiz-list-item">
          <div className="quiz-list-title">{quiz.title}</div>
          {!inFolder && quiz.tag && <div className="quiz-list-tag">{quiz.tag}</div>}
          <div className="quiz-list-uploader">by {quiz.uploaderName}</div>
          <Link to={`/quiz/${encodeURIComponent(quiz.fileName)}`} className="quiz-list-action">
            Start
          </Link>
        </div>
      );
    }
  };

  // Render nested folder structure - grid view
  const renderNestedFoldersGrid = () => {
    return (
      <div className="folder-grid">
        {Object.keys(filteredOrganized.tag2Folders).map(tag2Name => (
          <div key={tag2Name} className="folder-container">
            <div 
              className={`folder-card ${expandedFolder === tag2Name ? 'expanded' : ''}`}
              onClick={() => toggleFolder(tag2Name)}
            >
              <div className="folder-icon">📁</div>
              <h3>{tag2Name}</h3>
              <p>
                {Object.keys(filteredOrganized.tag2Folders[tag2Name].subfolders).length} subfolder(s), 
                {filteredOrganized.tag2Folders[tag2Name].untagged.length} quiz(zes)
              </p>
              <div className="folder-toggle-icon">
                {expandedFolder === tag2Name ? '−' : '+'}
              </div>
            </div>
            
            {expandedFolder === tag2Name && (
              <div className="folder-contents-wrapper">
                <div className="folder-contents">
                  <h4 className="folder-content-title">{tag2Name}</h4>
                  
                  {/* Render subfolders first */}
                  {Object.keys(filteredOrganized.tag2Folders[tag2Name].subfolders).length > 0 && (
                    <div className="subfolders-section">
                      <h5>Subfolders</h5>
                      <div className="subfolder-grid">
                        {Object.keys(filteredOrganized.tag2Folders[tag2Name].subfolders).map(subfolderName => (
                          <div key={subfolderName} className="subfolder-container">
                            <div 
                              className={`subfolder-card ${expandedSubFolder === subfolderName ? 'expanded' : ''}`}
                              onClick={(e) => toggleSubFolder(subfolderName, e)}
                            >
                              <div className="folder-icon">📂</div>
                              <h4>{subfolderName}</h4>
                              <p>{filteredOrganized.tag2Folders[tag2Name].subfolders[subfolderName].length} quizzes</p>
                              <div className="folder-toggle-icon">
                                {expandedSubFolder === subfolderName ? '−' : '+'}
                              </div>
                            </div>
                            
                            {expandedSubFolder === subfolderName && (
                              <div className="subfolder-contents">
                                <div className={displayMode === 'grid' ? 'quiz-grid folder-quiz-grid' : 'quiz-list'}>
                                  {filteredOrganized.tag2Folders[tag2Name].subfolders[subfolderName].map(quiz => 
                                    renderQuizItem(quiz, true)
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Render untagged quizzes in this tag2 folder */}
                  {filteredOrganized.tag2Folders[tag2Name].untagged.length > 0 && (
                    <div className="folder-quizzes-section">
                      <h5>Quizzes</h5>
                      <div className={displayMode === 'grid' ? 'quiz-grid folder-quiz-grid' : 'quiz-list'}>
                        {filteredOrganized.tag2Folders[tag2Name].untagged.map(quiz => 
                          renderQuizItem(quiz, true)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render nested folder structure - list view
  const renderNestedFoldersList = () => {
    return (
      <div className="folder-list">
        {Object.keys(filteredOrganized.tag2Folders).map(tag2Name => (
          <div key={tag2Name} className="folder-list-container">
            <div 
              className={`folder-list-header ${expandedFolder === tag2Name ? 'expanded' : ''}`}
              onClick={() => toggleFolder(tag2Name)}
            >
              <div className="folder-icon">📁</div>
              <h3>{tag2Name}</h3>
              <p>
                {Object.keys(filteredOrganized.tag2Folders[tag2Name].subfolders).length} subfolder(s), 
                {filteredOrganized.tag2Folders[tag2Name].untagged.length} quiz(zes)
              </p>
              <div className="folder-toggle-icon">
                {expandedFolder === tag2Name ? '−' : '+'}
              </div>
            </div>
            
            {expandedFolder === tag2Name && (
              <div className="folder-list-contents">
                {/* Render subfolders first */}
                {Object.keys(filteredOrganized.tag2Folders[tag2Name].subfolders).length > 0 && (
                  <div className="subfolders-section">
                    <h5>Subfolders</h5>
                    {Object.keys(filteredOrganized.tag2Folders[tag2Name].subfolders).map(subfolderName => (
                      <div key={subfolderName} className="subfolder-list-container">
                        <div 
                          className={`subfolder-list-header ${expandedSubFolder === subfolderName ? 'expanded' : ''}`}
                          onClick={(e) => toggleSubFolder(subfolderName, e)}
                        >
                          <div className="folder-icon">📂</div>
                          <h4>{subfolderName}</h4>
                          <p>{filteredOrganized.tag2Folders[tag2Name].subfolders[subfolderName].length} quizzes</p>
                          <div className="folder-toggle-icon">
                            {expandedSubFolder === subfolderName ? '−' : '+'}
                          </div>
                        </div>
                        
                        {expandedSubFolder === subfolderName && (
                          <div className="subfolder-list-contents">
                            <div className="quiz-list">
                              {filteredOrganized.tag2Folders[tag2Name].subfolders[subfolderName].map(quiz => 
                                renderQuizItem(quiz, true)
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Render untagged quizzes in this tag2 folder */}
                {filteredOrganized.tag2Folders[tag2Name].untagged.length > 0 && (
                  <div className="folder-quizzes-section">
                    <h5>Quizzes</h5>
                    <div className="quiz-list">
                      {filteredOrganized.tag2Folders[tag2Name].untagged.map(quiz => 
                        renderQuizItem(quiz, true)
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="quiz-selection-container">
      <div className="quiz-selection">
        <div className="header-section">
          <h1>Choose a Quiz</h1>
          <p>Test your knowledge with our wide range of quizzes</p>
        </div>
        
        <div className="control-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search quizzes..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="view-controls">
            {/* User Filter Toggle */}
            <div className="filter-toggle-container">
              <div className="filter-toggle">
                <button 
                  className={`toggle-btn ${userFilter === 'my' ? 'active' : ''}`}
                  onClick={() => toggleUserFilter('my')}
                  disabled={!user}
                  title={!user ? "Login to see your quizzes" : "Show only your quizzes"}
                >
                  My Quizzes
                </button>
                <button 
                  className={`toggle-btn ${userFilter === 'all' ? 'active' : ''}`}
                  onClick={() => toggleUserFilter('all')}
                >
                  All Quizzes
                </button>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="view-toggle-container">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'folders' ? 'active' : ''}`}
                  onClick={() => toggleViewMode('folders')}
                  title="Group by folders"
                >
                  Folders
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'flat' ? 'active' : ''}`}
                  onClick={() => toggleViewMode('flat')}
                  title="Show all quizzes"
                >
                  Flat View
                </button>
              </div>
            </div>
            
            {/* Display Mode Toggle */}
            <div className="display-toggle-container">
              <div className="display-toggle">
                <button 
                  className={`toggle-btn ${displayMode === 'list' ? 'active' : ''}`}
                  onClick={() => toggleDisplayMode('list')}
                  title="List View"
                >
                  <span className="toggle-icon">≡</span>
                </button>
                <button 
                  className={`toggle-btn ${displayMode === 'grid' ? 'active' : ''}`}
                  onClick={() => toggleDisplayMode('grid')}
                  title="Grid View"
                >
                  <span className="toggle-icon">⊞</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>
              {userFilter === 'my' 
                ? "You haven't uploaded any quizzes yet."
                : "No quizzes available. Be the first to import a quiz!"
              }
            </p>
            <Link to="/import" className="upload-button">Import Quiz</Link>
          </div>
        ) : viewMode === 'folders' ? (
          // Folder View with nested structure
          <div className="folder-view-container">
            {Object.keys(filteredOrganized.tag2Folders).length === 0 && filteredOrganized.untagged.length === 0 ? (
              <div className="no-quizzes">
                <p>No matching quizzes found.</p>
              </div>
            ) : (
              <>
                {Object.keys(filteredOrganized.tag2Folders).length > 0 && (
                  <div className="folders-section">
                    <h2>Categories</h2>
                    {displayMode === 'grid' ? renderNestedFoldersGrid() : renderNestedFoldersList()}
                  </div>
                )}
                
                {filteredOrganized.untagged.length > 0 && (
                  <div className="untagged-section">
                    <h2>Untagged Quizzes</h2>
                    <div className={displayMode === 'grid' ? 'quiz-grid' : 'quiz-list'}>
                      {filteredOrganized.untagged.map(quiz => 
                        renderQuizItem(quiz)
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Flat View (All Quizzes)
          <div className="flat-view-container">
            {filteredQuizzes.length === 0 ? (
              <div className="no-quizzes">
                <p>No matching quizzes found.</p>
              </div>
            ) : (
              <div className={displayMode === 'grid' ? 'quiz-grid' : 'quiz-list'}>
                {filteredQuizzes.map(quiz => 
                  renderQuizItem(quiz)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSelection;
