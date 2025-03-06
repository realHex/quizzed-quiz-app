import React from 'react';

const ManualCsvSection = ({ csvName, csvText, quizTag, quizTag2, uploading, error, handleCsvNameChange, handleCsvTextChange, handleTagChange, handleTag2Change, processManualCsv }) => {
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
        <label htmlFor="manual-quiz-tag2">Department/Main Category (Optional):</label>
        <input
          type="text"
          id="manual-quiz-tag2"
          value={quizTag2}
          onChange={handleTag2Change}
          placeholder="e.g., Science, Engineering, Medicine..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by main department or category</small>
      </div>

      <div className="tag-input">
        <label htmlFor="manual-quiz-tag">Course/Subcategory (Optional):</label>
        <input
          type="text"
          id="manual-quiz-tag"
          value={quizTag}
          onChange={handleTagChange}
          placeholder="e.g., Biology, Physics, Chemistry..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by specific course or subcategory</small>
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
