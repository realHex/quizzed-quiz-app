import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const PdfSelector = ({ selectedPdf, setSelectedPdf }) => {
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  
  // Load available PDFs from Supabase
  useEffect(() => {
    const fetchPdfs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .storage
          .from('pdf_files')
          .list();
          
        if (error) throw error;
        
        // Filter to only show PDF files
        const pdfFiles = data.filter(file => file.name.toLowerCase().endsWith('.pdf'));
        setPdfList(pdfFiles);
      } catch (err) {
        console.error('Error loading PDFs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPdfs();
  }, []);
  
  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setUploadError(null);
    } else {
      setPdfFile(null);
      setUploadError('Please select a valid PDF file');
    }
  };
  
  const uploadPdf = async () => {
    if (!pdfFile) return;
    
    setUploadingPdf(true);
    setUploadError(null);
    
    try {
      // Ensure unique filename
      let fileName = pdfFile.name;
      let counter = 1;
      let fileExists = true;
      
      while (fileExists) {
        // Check if file exists in storage
        const { data } = await supabase.storage
          .from('pdf_files')
          .list('', {
            search: fileName
          });
        
        if (!data || data.length === 0 || !data.find(item => item.name === fileName)) {
          fileExists = false;
          break;
        }
        
        // Create a new filename with incrementing counter
        const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        fileName = `${baseName} (${counter})${extension}`;
        counter++;
      }
      
      // Upload file
      const { error: uploadError } = await supabase
        .storage
        .from('pdf_files')
        .upload(fileName, pdfFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Refresh list and select the newly uploaded file
      const { data: newList } = await supabase
        .storage
        .from('pdf_files')
        .list();
        
      if (newList) {
        setPdfList(newList.filter(file => file.name.toLowerCase().endsWith('.pdf')));
        setSelectedPdf(fileName);
      }
      
      // Reset file input
      setPdfFile(null);
      document.getElementById('pdf-file-upload').value = '';
      
    } catch (err) {
      console.error('Error uploading PDF:', err);
      setUploadError(err.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };
  
  return (
    <div className="pdf-selector-container">
      <div className="pdf-selector">
        <label htmlFor="pdf-select">Select existing PDF:</label>
        <select 
          id="pdf-select" 
          value={selectedPdf || ''} 
          onChange={(e) => setSelectedPdf(e.target.value)}
          disabled={loading || uploadingPdf}
        >
          <option value="">-- Select a PDF --</option>
          {pdfList.map(pdf => (
            <option key={pdf.id} value={pdf.name}>
              {pdf.name}
            </option>
          ))}
        </select>
        {loading && <div className="loading-pdfs">Loading PDFs...</div>}
      </div>
      
      <div className="pdf-upload">
        <h4>Or upload a new PDF:</h4>
        <div className="pdf-upload-area">
          <input
            type="file"
            id="pdf-file-upload"
            accept=".pdf"
            onChange={handlePdfFileChange}
            disabled={uploadingPdf}
          />
          {pdfFile && (
            <div className="file-info">
              <p>File: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            </div>
          )}
          <button 
            onClick={uploadPdf} 
            className="upload-pdf-btn"
            disabled={!pdfFile || uploadingPdf}
          >
            {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>
        {uploadError && <div className="error-message">{uploadError}</div>}
      </div>
    </div>
  );
};

export default PdfSelector;
