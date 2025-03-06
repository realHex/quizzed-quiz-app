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
  confirmDelete 
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
                {importItem.quiz_name}
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
