import React from 'react';

const ManualCsvSection = ({ csvName, csvText, quizTag, uploading, error, handleCsvNameChange, handleCsvTextChange, handleTagChange, processManualCsv }) => {
  return (
    <div className="manual-csv-section">
      <div className="csv-name-input">
        <label htmlFor="csv-name">CSV Name:</label>
        <input
          type="text"
          id="csv-name"
          value={csvName}
          onChange={handleCsvNameChange}
          placeholder="Enter a name for your CSV file"
          disabled={uploading}
        />
      </div>
      
      <div className="tag-input">
        <label htmlFor="manual-quiz-tag">Folder Tag (Optional):</label>
        <input
          type="text"
          id="manual-quiz-tag"
          value={quizTag}
          onChange={handleTagChange}
          placeholder="e.g., Math, Science, History..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by folder tag</small>
      </div>
      
      <div className="csv-text-input">
        <label htmlFor="csv-text">CSV Data:</label>
        <textarea
          id="csv-text"
          value={csvText}
          onChange={handleCsvTextChange}
          placeholder="Type or paste your CSV data here..."
          rows={10}
          disabled={uploading}
        ></textarea>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-actions">
        <button
          onClick={processManualCsv}
          className="upload-button"
          disabled={!csvText.trim() || !csvName.trim() || uploading}
        >
          {uploading ? 'Processing...' : 'Create and Upload Quiz'}
        </button>
      </div>
    </div>
  );
};

export default ManualCsvSection;
