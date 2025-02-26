import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Import.css';

const Import = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a CSV file.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the base filename without extension
      const fileName = file.name;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      
      // Check if file exists and find available name
      let finalFileName = fileName;
      let counter = 1;
      let fileExists = true;
      
      while (fileExists) {
        // Check if file exists in storage
        const { data } = await supabase.storage
          .from('quizes')
          .list('', {
            search: finalFileName
          });
        
        // If no matching files or empty result, break the loop
        if (!data || data.length === 0) {
          fileExists = false;
          break;
        }
        
        // Check if the exact filename exists
        const exactMatch = data.find(item => item.name === finalFileName);
        
        if (!exactMatch) {
          // If no exact match found, the filename is available
          fileExists = false;
          break;
        }
        
        // Create a new filename with incrementing counter
        finalFileName = `${baseName} (${counter})${extension}`;
        counter++;
      }

      // Upload file to Supabase storage with possibly modified name
      const { error: uploadError } = await supabase.storage
        .from('quizes')
        .upload(finalFileName, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite, we've ensured the name is unique
        });

      if (uploadError) throw uploadError;

      // Create record in the imports table with the final filename
      const { error: dbError } = await supabase
        .from('imports')
        .insert([{
          user: user.id,
          quiz_name: finalFileName
        }]);

      if (dbError) throw dbError;

      console.log(`File uploaded successfully as: ${finalFileName}`);
      setSuccess(true);
      setFile(null);
      // Reset the file input
      document.getElementById('file-upload').value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setSuccess(false);
    setFile(null);
    
    // Use setTimeout to ensure the input element exists in the DOM after re-render
    setTimeout(() => {
      const fileInput = document.getElementById('file-upload');
      if (fileInput) {
        fileInput.value = '';
      }
    }, 0);
  };

  return (
    <div className="import-container">
      <div className="import-card">
        <div className="import-header">
          <h2>Import Quiz</h2>
          <p>Upload a CSV file containing quiz questions</p>
        </div>

        <div className="import-content">
          {!success ? (
            <>
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

              <div className="upload-info">
                <h3>CSV Format Requirements:</h3>
                <ul>
                  <li>Column headers: Question, Type, Option1, Option2, Option3, Option4, Correct</li>
                  <li>Type can be: MCQ (Multiple Choice), YESNO, or MULTI</li>
                  <li>For YESNO, Correct should be 'Yes' or 'No'</li>
                  <li>For MCQ, Correct should be the correct option text or index (1-4)</li>
                  <li>For MULTI, Correct should be a semicolon-separated list of correct options</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>Upload Successful!</h3>
              <p>Your quiz has been imported successfully.</p>
              <div className="success-actions">
                <button onClick={handleTryAgain} className="upload-another-button">
                  Upload Another Quiz
                </button>
                <button onClick={() => navigate('/')} className="view-quizzes-button">
                  View Quizzes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Import;
