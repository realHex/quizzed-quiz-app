import React from 'react';

const FileUploadSection = ({ file, uploading, error, quizTag, handleFileChange, handleTagChange, handleUpload }) => {
  return (
    <div className="file-upload-section">
      <div className="file-upload-area">
        <label htmlFor="file-upload" className="file-label">
          {file ? file.name : 'Choose a CSV file'}
        </label>
        <input
          type="file"
          id="file-upload"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {file && (
          <div className="file-info">
            <p>File size: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </div>

      <div className="tag-input">
        <label htmlFor="quiz-tag">Folder Tag (Optional):</label>
        <input
          type="text"
          id="quiz-tag"
          value={quizTag}
          onChange={handleTagChange}
          placeholder="e.g., Math, Science, History..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by folder tag</small>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="upload-actions">
        <button
          onClick={handleUpload}
          className="upload-button"
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Quiz'}
        </button>
      </div>
    </div>
  );
};

export default FileUploadSection;
