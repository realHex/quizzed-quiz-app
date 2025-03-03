import React from 'react';

const ImportHeader = ({ importMode, handleModeToggle }) => {
  return (
    <div className="import-header">
      <h2>Import Quiz</h2>
      <div className="import-tabs">
        <button 
          className={`import-tab ${importMode === 'file' ? 'active' : ''}`} 
          onClick={() => handleModeToggle('file')}
        >
          Upload File
        </button>
        <button 
          className={`import-tab ${importMode === 'manual' ? 'active' : ''}`} 
          onClick={() => handleModeToggle('manual')}
        >
          Create CSV
        </button>
      </div>
    </div>
  );
};

export default ImportHeader;
