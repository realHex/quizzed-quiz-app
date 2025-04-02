import React from 'react';

const ImportHeader = ({ importMode, handleModeToggle, onHelpClick }) => {
  return (
    <div className="import-header">
      <div className="import-header-top">
        <h2>Import Quiz</h2>
        <button 
          className="help-button compact-help-button" 
          onClick={onHelpClick}
          title="How to generate questions"
        >
          Help
        </button>
      </div>
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
        <button 
          className={`import-tab ${importMode === 'slides' ? 'active' : ''}`} 
          onClick={() => handleModeToggle('slides')}
        >
          Create CSV (with slides)
        </button>
      </div>
    </div>
  );
};

export default ImportHeader;
