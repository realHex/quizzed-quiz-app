import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Import.css';

const Import = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userImports, setUserImports] = useState([]);
  const [loadingImports, setLoadingImports] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's imported files
  useEffect(() => {
    fetchUserImports();
  }, [user]);

  const fetchUserImports = async () => {
    if (!user) return;

    setLoadingImports(true);
    try {
      const { data, error } = await supabase
        .from('imports')
        .select('*')
        .eq('user', user.id)
        .order('uploaded_at', { ascending: false }); // Changed from created_at to uploaded_at

      if (error) throw error;
      setUserImports(data || []);
    } catch (err) {
      console.error('Error fetching user imports:', err);
    } finally {
      setLoadingImports(false);
    }
  };

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
      
      // After successful upload, refresh the user's imports list
      fetchUserImports();
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

  const confirmDelete = (importItem) => {
    setDeleteConfirm(importItem);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDelete = async (importItem) => {
    try {
      // Delete from storage bucket
      const { error: storageError } = await supabase
        .storage
        .from('quizes')
        .remove([importItem.quiz_name]);

      if (storageError) throw storageError;

      // Delete from imports table
      const { error: dbError } = await supabase
        .from('imports')
        .delete()
        .eq('id', importItem.id);

      if (dbError) throw dbError;

      // Refresh the list
      setDeleteConfirm(null);
      fetchUserImports();
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(`Failed to delete ${importItem.quiz_name}: ${err.message}`);
    }
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

        {/* Uploaded files section */}
        <div className="user-imports-section">
          <h3>Your Uploaded Quizzes</h3>
          
          {loadingImports ? (
            <div className="imports-loading">Loading your uploads...</div>
          ) : userImports.length === 0 ? (
            <div className="no-imports">No quizzes uploaded yet.</div>
          ) : (
            <div className="imports-list">
              {userImports.map(importItem => (
                <div key={importItem.id} className="import-item">
                  <div className="import-item-name" title={importItem.quiz_name}>
                    {importItem.quiz_name}
                  </div>
                  <div className="import-item-date">
                    {new Date(importItem.uploaded_at).toLocaleDateString()} {/* Changed from created_at to uploaded_at */}
                  </div>
                  <button 
                    className="delete-import-btn"
                    onClick={() => confirmDelete(importItem)}
                    title="Delete quiz"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      {deleteConfirm && (
        <div className="delete-modal-backdrop">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete "{deleteConfirm.quiz_name}"?</p>
            <p>This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                onClick={() => handleDelete(deleteConfirm)} 
                className="confirm-delete-btn"
              >
                Yes, Delete
              </button>
              <button 
                onClick={cancelDelete} 
                className="cancel-delete-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Import;
