import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Import.css';
import { analyzeCsvData, normalizeCsvData, validateYesNoAnswers } from '../utils/CsvDebugger';

const Import = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userImports, setUserImports] = useState([]);
  const [loadingImports, setLoadingImports] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [importMode, setImportMode] = useState('file'); // 'file' or 'manual'
  const [csvText, setCsvText] = useState('');
  const [csvName, setCsvName] = useState('');
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
        .order('uploaded_at', { ascending: false });

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

  const handleCsvTextChange = (e) => {
    setCsvText(e.target.value);
  };

  const handleCsvNameChange = (e) => {
    setCsvName(e.target.value);
  };

  const handleModeToggle = (mode) => {
    setImportMode(mode);
    setError(null);
    setSuccess(false);
  };

  const processManualCsv = async () => {
    if (!csvText.trim()) {
      setError('Please enter CSV data');
      return;
    }

    if (!csvName.trim()) {
      setError('Please enter a name for your CSV file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Ensure filename has .csv extension
      let finalFileName = csvName.trim();
      if (!finalFileName.toLowerCase().endsWith('.csv')) {
        finalFileName += '.csv';
      }

      // Check if file exists and find available name
      let counter = 1;
      let fileExists = true;
      
      while (fileExists) {
        const { data } = await supabase.storage
          .from('quizes')
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
        
        const baseName = finalFileName.substring(0, finalFileName.lastIndexOf('.'));
        const extension = '.csv';
        finalFileName = `${baseName} (${counter})${extension}`;
        counter++;
      }

      // Convert text to file object
      const blob = new Blob([csvText], { type: 'text/csv' });
      const csvFile = new File([blob], finalFileName, { type: 'text/csv' });

      // Upload the generated file
      const { error: uploadError } = await supabase.storage
        .from('quizes')
        .upload(finalFileName, csvFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create record in the imports table
      const { error: dbError } = await supabase
        .from('imports')
        .insert([{
          user: user.id,
          quiz_name: finalFileName
        }]);

      if (dbError) throw dbError;

      console.log(`Manual CSV uploaded successfully as: ${finalFileName}`);
      setSuccess(true);
      setCsvText('');
      setCsvName('');
      fetchUserImports();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload CSV data');
    } finally {
      setUploading(false);
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
    
    if (importMode === 'file') {
      setFile(null);
      setTimeout(() => {
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
          fileInput.value = '';
        }
      }, 0);
    } else {
      setCsvText('');
      setCsvName('');
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let csvContent = e.target.result;
        
        // Debug the CSV content
        const analysis = analyzeCsvData(csvContent);
        setDebugInfo(analysis);
        
        // If issues detected, try to fix the format
        if (!analysis.hasProperFormat) {
          console.log("CSV format issues detected, attempting to normalize");
          csvContent = normalizeCsvData(csvContent);
          console.log("Normalized CSV:", csvContent);
        }
        
        // Parse the CSV
        const questions = parseCSV(csvContent);
        
        // Validate and fix YESNO answers
        const validatedQuestions = validateYesNoAnswers(questions);
        
        // Save to local storage or your backend
        const quiz = {
          name: file.name,
          questions: validatedQuestions,
          created: new Date().toISOString()
        };
        
        // Example for local storage
        const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        localStorage.setItem('quizzes', JSON.stringify([...existingQuizzes, quiz]));
        
        // Redirect or show success
        navigate('/');
      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Error processing file: ${err.message}`);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Simple CSV parser function - enhance this based on your actual parsing logic
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    const questions = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const question = {
        type: values[0],
        question: values[1].replace(/^"|"$/g, ''),
        options: [
          values[2].replace(/^"|"$/g, ''),
          values[3].replace(/^"|"$/g, ''),
          values[4].replace(/^"|"$/g, ''),
          values[5].replace(/^"|"$/g, '')
        ].filter(opt => opt),
        correct: values[6].replace(/^"|"$/g, '')
      };
      
      questions.push(question);
    }
    
    return questions;
  };

  return (
    <div className="import-container">
      <div className="import-card">
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

        <div className="import-content">
          {!success ? (
            <>
              {importMode === 'file' ? (
                // File upload mode
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
              ) : (
                // Manual CSV creation mode
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
              )}

              <div className="upload-info">
                <h3>CSV Format Requirements:</h3>
                <ul>
                  <li>Column headers: Type, Question, Option1, Option2, Option3, Option4, Correct</li>
                  <li>Type can be: MCQ (Multiple Choice), YESNO, or MULTI</li>
                  <li>For YESNO, Correct should be 'yes' or 'no' (case-insensitive)</li>
                  <li>For MCQ, Correct should be the index (1-4) of the correct option</li>
                  <li>For MULTI, Correct should be a semicolon-separated list of correct indices (e.g., "1;2;3")</li>
                </ul>
                <div className="csv-example">
                  <h4>Example:</h4>
                  <pre>
                    Type,Question,Option1,Option2,Option3,Option4,Correct<br />
                    MCQ,"What is 2+2?","3","4","5","6",2<br />
                    YESNO,"Is the sky blue?",,,,,yes<br />
                    MULTI,"Select all prime numbers","2","3","4","5","1;2;4"
                  </pre>
                </div>
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

        {/* Uploaded files section - shown in both modes */}
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
                    {new Date(importItem.uploaded_at).toLocaleDateString()}
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
