import React from 'react';

const FileUploadSection = ({ file, uploading, error, quizTag, quizTag2, handleFileChange, handleTagChange, handleTag2Change, handleUpload }) => {
  return (
    <div className="file-upload-section">
      <div className="file-upload-area">
        <label htmlFor="file-upload" className="upload-label">
          <div className="upload-icon">
            <span>📄</span>
          </div>
          <div className="upload-text">
            <strong>Choose CSV file</strong>
            <span>or drag and drop</span>
          </div>
        </label>
        <input
          type="file"
          id="file-upload"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        {file && (
          <div className="selected-file">
            <div className="file-name">{file.name}</div>
          </div>
        )}
      </div>
      
      <div className="tag-input">
        <label htmlFor="file-quiz-tag2">Department/Main Category (Optional):</label>
        <input
          type="text"
          id="file-quiz-tag2"
          value={quizTag2}
          onChange={handleTag2Change}
          placeholder="e.g., Science, Engineering, Medicine..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by main department or category</small>
      </div>

      <div className="tag-input">
        <label htmlFor="file-quiz-tag">Course/Subcategory (Optional):</label>
        <input
          type="text"
          id="file-quiz-tag"
          value={quizTag}
          onChange={handleTagChange}
          placeholder="e.g., Biology, Physics, Chemistry..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by specific course or subcategory</small>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-actions">
        <button
          onClick={handleUpload}
          className="upload-button"
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
};

export default FileUploadSection;
