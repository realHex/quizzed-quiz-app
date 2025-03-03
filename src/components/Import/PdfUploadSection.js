import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';

const PdfUploadSection = ({ onUploadSuccess }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePdfChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.pdf')) {
      setPdfFile(selectedFile);
      setError(null);
    } else {
      setPdfFile(null);
      setError('Please select a PDF file.');
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileName = pdfFile.name;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      
      // Check if file exists and find available name
      let finalFileName = fileName;
      let counter = 1;
      let fileExists = true;
      
      while (fileExists) {
        const { data } = await supabase.storage
          .from('pdf_files')
          .list('', {
            search: finalFileName
          });
        
        if (!data || data.length === 0) {
          fileExists = false;
          break;
        }
        
        const exactMatch = data.find(item => item.name === finalFileName);
        
        if (!exactMatch) {
          fileExists = false;
          break;
        }
        
        finalFileName = `${baseName} (${counter})${extension}`;
        counter++;
      }

      // Upload with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('pdf_files')
        .upload(finalFileName, pdfFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });

      if (uploadError) throw uploadError;

      // Call the success callback with the file name
      onUploadSuccess(finalFileName);
      setPdfFile(null);
      
      // Reset the file input
      document.getElementById('pdf-file-upload').value = '';
      
    } catch (err) {
      console.error('PDF upload error:', err);
      setError(err.message || 'Failed to upload PDF file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="pdf-upload-section">
      <h3>Upload PDF for Slides</h3>
      <p className="pdf-upload-info">
        Upload a PDF file that contains slides you want to reference in quiz questions.
      </p>
      
      <div className="pdf-upload-area">
        <label htmlFor="pdf-file-upload" className="file-label">
          {pdfFile ? pdfFile.name : 'Choose a PDF file'}
        </label>
        <input
          type="file"
          id="pdf-file-upload"
          accept=".pdf"
          onChange={handlePdfChange}
          disabled={uploading}
        />
        {pdfFile && (
          <div className="file-info">
            <p>File size: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>{uploadProgress}% uploaded</p>
        </div>
      )}

      <div className="upload-actions">
        <button
          onClick={handlePdfUpload}
          className="upload-button"
          disabled={!pdfFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>
    </div>
  );
};

export default PdfUploadSection;
