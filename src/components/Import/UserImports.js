import React from 'react';

const UserImports = ({ 
  loadingImports, 
  userImports, 
  editingTag, 
  newTagValue, 
  setNewTagValue, 
  startEditTag, 
  saveTagEdit, 
  cancelEditTag, 
  confirmDelete 
}) => {
  return (
    <div className="user-imports-section">
      <h3>Your Uploaded Quizzes</h3>
      
      {loadingImports ? (
        <div className="imports-loading">Loading your uploads...</div>
      ) : userImports.length === 0 ? (
        <div className="no-imports">No quizzes uploaded yet.</div>
      ) : (
        <div className="imports-list">
          {userImports.map(importItem => (
            <div key={importItem.id} className="import-item">
              <div className="import-item-name" title={importItem.quiz_name}>
                {importItem.quiz_name}
              </div>
              
              <div className="import-item-tag">
                {editingTag === importItem.id ? (
                  <div className="tag-edit-form">
                    <input
                      type="text"
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      placeholder="Enter folder tag"
                      className="tag-edit-input"
                    />
                    <div className="tag-edit-buttons">
                      <button 
                        onClick={() => saveTagEdit(importItem.id)} 
                        className="save-tag-btn"
                        title="Save tag"
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
                      {importItem.tag ? `Tag: ${importItem.tag}` : 'Add tag'}
                    </span>
                    <button className="edit-tag-btn" title="Edit tag">
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
