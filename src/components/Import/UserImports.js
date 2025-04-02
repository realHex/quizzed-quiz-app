import React from 'react';

const UserImports = ({ 
  loadingImports, 
  userImports, 
  editingTag, 
  newTagValue, 
  newTag2Value,
  setNewTagValue,
  setNewTag2Value, 
  startEditTag, 
  saveTagEdit, 
  cancelEditTag,
  editingName, 
  newNameValue, 
  setNewNameValue, 
  startEditName, 
  saveNameEdit, 
  cancelEditName, 
  confirmDelete,
  toggleVisibility,
  updatingVisibility
}) => {
  return (
    <div className="user-imports-section">
      <h3>Your Imported Quizzes</h3>
      
      {loadingImports ? (
        <div className="loading-imports">Loading your imports...</div>
      ) : userImports.length === 0 ? (
        <div className="no-imports">You haven't imported any quizzes yet.</div>
      ) : (
        <div className="imports-list">
          {userImports.map(importItem => (
            <div key={importItem.id} className="import-item">
              <div className="import-item-name">
                {editingName === importItem.id ? (
                  <div className="name-edit-form">
                    <input
                      type="text"
                      value={newNameValue}
                      onChange={(e) => setNewNameValue(e.target.value)}
                      className="name-edit-input"
                      placeholder="Enter quiz name"
                    />
                    <div className="name-edit-buttons">
                      <button 
                        onClick={() => saveNameEdit(importItem.id, importItem.quiz_name)} 
                        className="save-name-btn"
                        title="Save name"
                      >
                        ✓
                      </button>
                      <button 
                        onClick={cancelEditName} 
                        className="cancel-name-btn"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="quiz-name-container">
                    <span className="quiz-name-text">{importItem.quiz_name}</span>
                    <button 
                      className="edit-name-btn" 
                      onClick={() => startEditName(importItem)}
                      title="Edit quiz name"
                    >
                      ✎
                    </button>
                  </div>
                )}
                <span 
                  className={`
                    visibility-badge 
                    ${importItem.visibility ? 'public' : 'private'}
                    ${updatingVisibility?.[importItem.id] ? 'updating' : ''}
                    toggle-enabled
                  `}
                  onClick={() => !updatingVisibility?.[importItem.id] && toggleVisibility(importItem.id, !importItem.visibility)}
                  role="button"
                  tabIndex="0"
                  aria-label={`Toggle visibility to ${importItem.visibility ? 'private' : 'public'}`}
                >
                  {updatingVisibility?.[importItem.id] ? (
                    <span className="visibility-loading">Updating...</span>
                  ) : (
                    <>
                      {importItem.visibility ? 'Public' : 'Private'}
                      <span className="toggle-indicator">⇄</span>
                    </>
                  )}
                </span>
              </div>
              
              <div className="import-item-tag">
                {editingTag === importItem.id ? (
                  <div className="tag-edit-form">
                    <div className="tag-edit-fields">
                      <input
                        type="text"
                        value={newTag2Value}
                        onChange={(e) => setNewTag2Value(e.target.value)}
                        placeholder="Enter main category"
                        className="tag-edit-input"
                      />
                      <input
                        type="text"
                        value={newTagValue}
                        onChange={(e) => setNewTagValue(e.target.value)}
                        placeholder="Enter subcategory"
                        className="tag-edit-input"
                      />
                    </div>
                    <div className="tag-edit-buttons">
                      <button 
                        onClick={() => saveTagEdit(importItem.id)} 
                        className="save-tag-btn"
                        title="Save tags"
                      >
                        ✓
                      </button>
                      <button 
                        onClick={cancelEditTag} 
                        className="cancel-tag-btn"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="tag-display" onClick={() => startEditTag(importItem)}>
                    <span className="tag-label">
                      {importItem.tag2 && importItem.tag 
                        ? `${importItem.tag2} / ${importItem.tag}` 
                        : importItem.tag2 
                          ? importItem.tag2 
                          : importItem.tag 
                            ? importItem.tag 
                            : 'Add tags'}
                    </span>
                    <button className="edit-tag-btn" title="Edit tags">
                      ✎
                    </button>
                  </div>
                )}
              </div>
              
              <div className="import-item-date">
                {new Date(importItem.uploaded_at).toLocaleDateString()}
              </div>
              <button 
                className="delete-import-btn"
                onClick={() => confirmDelete(importItem)}
                title="Delete quiz"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserImports;
