import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import PdfUploadSection from './PdfUploadSection';

const SlideCsvSection = ({ 
  csvName, 
  csvText, 
  selectedPdf, 
  quizTag,
  quizTag2,
  visibility, // Add visibility prop
  uploading, 
  error, 
  handleCsvNameChange, 
  handleCsvTextChange, 
  handleTagChange,
  handleTag2Change,
  handleVisibilityChange, // Add handler prop
  setSelectedPdf, 
  processSlidesCsv 
}) => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [showUploadSection, setShowUploadSection] = useState(false);

  // Fetch available PDFs
  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    setLoadingPdfs(true);
    try {
      const { data, error } = await supabase.storage
        .from('pdf_files')
        .list();
        
      if (error) throw error;
      setPdfFiles(data || []);
    } catch (err) {
      console.error('Error fetching PDF files:', err);
    } finally {
      setLoadingPdfs(false);
    }
  };

  const handlePdfUploadSuccess = (fileName) => {
    // Add the newly uploaded PDF to the list
    setPdfFiles(prev => [...prev, { name: fileName }]);
    // Select the newly uploaded PDF
    setSelectedPdf(fileName);
    // Hide the upload section
    setShowUploadSection(false);
  };

  return (
    <div className="slide-csv-section">
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
      
      <div className="pdf-selector-container">
        <div className="pdf-selector-header">
          <h3>PDF for Slides</h3>
          <button 
            type="button" 
            className="toggle-pdf-upload" 
            onClick={() => setShowUploadSection(!showUploadSection)}
          >
            {showUploadSection ? 'Choose Existing PDF' : 'Upload New PDF'}
          </button>
        </div>
        
        {showUploadSection ? (
          <PdfUploadSection onUploadSuccess={handlePdfUploadSuccess} />
        ) : (
          <div className="pdf-selector">
            <label htmlFor="pdf-select">Select PDF for slides:</label>
            <select
              id="pdf-select"
              value={selectedPdf}
              onChange={(e) => setSelectedPdf(e.target.value)}
              disabled={uploading || loadingPdfs}
            >
              <option value="">-- No PDF (use text explanations) --</option>
              {pdfFiles.map((file) => (
                <option key={file.name} value={file.name}>
                  {file.name}
                </option>
              ))}
            </select>
            {loadingPdfs && <div className="loading-pdfs">Loading PDFs...</div>}
          </div>
        )}
      </div>
      
      <div className="tag-input">
        <label htmlFor="slide-quiz-tag2">Department/Main Category (Optional):</label>
        <input
          type="text"
          id="slide-quiz-tag2"
          value={quizTag2}
          onChange={handleTag2Change}
          placeholder="e.g., Science, Engineering, Medicine..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by main department or category</small>
      </div>

      <div className="tag-input">
        <label htmlFor="slide-quiz-tag">Course/Subcategory (Optional):</label>
        <input
          type="text"
          id="slide-quiz-tag"
          value={quizTag}
          onChange={handleTagChange}
          placeholder="e.g., Biology, Physics, Chemistry..."
          disabled={uploading}
        />
        <small className="tag-hint">Group quizzes by specific course or subcategory</small>
      </div>
      
      {/* Add visibility toggle */}
      <div className="visibility-toggle">
        <label className="visibility-label">
          <input
            type="checkbox"
            checked={visibility}
            onChange={handleVisibilityChange}
            disabled={uploading}
          />
          <span className="visibility-text">Make quiz visible to everyone</span>
        </label>
        <small className="visibility-hint">
          {visibility 
            ? "Everyone can see and take this quiz" 
            : "Only you can see and take this quiz"}
        </small>
      </div>
      
      <div className="csv-text-input">
        <label htmlFor="csv-text">CSV Data (with Slides):</label>
        <textarea
          id="csv-text"
          value={csvText}
          onChange={handleCsvTextChange}
          placeholder="Type or paste your CSV data here..."
          rows={10}
          disabled={uploading}
        ></textarea>
        <div className="format-note">
          Include a 'Slide' column with slide numbers or explanations.
        </div>
      </div>
      
      <div className="csv-example">
        <h4>Example with Slides:</h4>
        <pre>
          Type,Question,Option1,Option2,Option3,Option4,Correct,Slide<br />
          MCQ,"What is 2+2?","3","4","5","6",2,3<br />
          YESNO,"Is the sky blue?",,,,,yes,"The sky appears blue due to Rayleigh scattering"<br />
          MULTI,"Select all prime numbers","2","3","4","5","1;2;4",5
        </pre>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-actions">
        <button
          onClick={processSlidesCsv}
          className="upload-button"
          disabled={!csvText.trim() || !csvName.trim() || uploading}
        >
          {uploading ? 'Processing...' : 'Create and Upload Quiz'}
        </button>
      </div>
    </div>
  );
};

export default SlideCsvSection;
