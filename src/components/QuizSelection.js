import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizList } from '../utils/quizService';
import { organizeQuizzesByTag, getFoldersList } from '../utils/quizOrganizer';
import { useAuth } from '../context/AuthContext';
import '../styles/QuizSelection.css';

const QuizSelection = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'my' or 'all'
  const [viewMode, setViewMode] = useState('folders'); // 'folders' or 'flat'
  const [displayMode, setDisplayMode] = useState('list'); // Changed from 'grid' to 'list' to make list view default
  const [organizedQuizzes, setOrganizedQuizzes] = useState({ folders: {}, untagged: [] });
  const [expandedFolder, setExpandedFolder] = useState(null); // Only one folder can be expanded
  const { user } = useAuth();

  useEffect(() => {
    loadQuizzes();
  }, [userFilter, user]);

  useEffect(() => {
    // Organize quizzes when they change or when view mode is changed to folders
    if (quizzes.length > 0 && viewMode === 'folders') {
      const organized = organizeQuizzesByTag(filteredQuizzes);
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

  const toggleFolder = (folderName) => {
    setExpandedFolder(expandedFolder === folderName ? null : folderName);
  };

  // Filter quizzes by search term
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quiz.tag && quiz.tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter organized quizzes when search is active
  const getFilteredOrganizedQuizzes = () => {
    if (!searchTerm) {
      const organized = organizeQuizzesByTag(filteredQuizzes);
      return organized;
    }
    
    const filteredFolders = {};
    const filteredUntagged = organizedQuizzes.untagged.filter(quiz => 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    Object.keys(organizedQuizzes.folders).forEach(folderName => {
      const filteredFolderQuizzes = organizedQuizzes.folders[folderName].filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        folderName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredFolderQuizzes.length > 0 || folderName.toLowerCase().includes(searchTerm.toLowerCase())) {
        filteredFolders[folderName] = filteredFolderQuizzes;
      }
    });
    
    return {
      folders: filteredFolders,
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
          // Folder View
          <div className="folder-view-container">
            {Object.keys(filteredOrganized.folders).length === 0 && filteredOrganized.untagged.length === 0 ? (
              <div className="no-quizzes">
                <p>No matching quizzes found.</p>
              </div>
            ) : (
              <>
                {Object.keys(filteredOrganized.folders).length > 0 && (
                  <div className="folders-section">
                    <h2>Folders</h2>
                    {displayMode === 'grid' ? (
                      <div className="folder-grid">
                        {Object.keys(filteredOrganized.folders).map(folderName => (
                          <div key={folderName} className="folder-container">
                            <div 
                              className={`folder-card ${expandedFolder === folderName ? 'expanded' : ''}`}
                              onClick={() => toggleFolder(folderName)}
                            >
                              <div className="folder-icon">📁</div>
                              <h3>{folderName}</h3>
                              <p>{filteredOrganized.folders[folderName].length} {filteredOrganized.folders[folderName].length === 1 ? 'quiz' : 'quizzes'}</p>
                              <div className="folder-toggle-icon">
                                {expandedFolder === folderName ? '−' : '+'}
                              </div>
                            </div>
                            
                            {expandedFolder === folderName && (
                              <div className="folder-contents-wrapper">
                                <div className="folder-contents">
                                  <h4 className="folder-content-title">{folderName} Quizzes</h4>
                                  <div className={displayMode === 'grid' ? 'quiz-grid folder-quiz-grid' : 'quiz-list'}>
                                    {filteredOrganized.folders[folderName].map(quiz => 
                                      renderQuizItem(quiz, true)
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="folder-list">
                        {Object.keys(filteredOrganized.folders).map(folderName => (
                          <div key={folderName} className="folder-list-container">
                            <div 
                              className={`folder-list-header ${expandedFolder === folderName ? 'expanded' : ''}`}
                              onClick={() => toggleFolder(folderName)}
                            >
                              <div className="folder-icon">📁</div>
                              <h3>{folderName}</h3>
                              <p>{filteredOrganized.folders[folderName].length} {filteredOrganized.folders[folderName].length === 1 ? 'quiz' : 'quizzes'}</p>
                              <div className="folder-toggle-icon">
                                {expandedFolder === folderName ? '−' : '+'}
                              </div>
                            </div>
                            
                            {expandedFolder === folderName && (
                              <div className="folder-list-contents">
                                <div className="quiz-list">
                                  {filteredOrganized.folders[folderName].map(quiz => 
                                    renderQuizItem(quiz, true)
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
