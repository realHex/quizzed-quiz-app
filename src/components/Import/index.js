import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { analyzeCsvData, normalizeCsvData, validateYesNoAnswers } from '../../utils/CsvDebugger';

import ImportHeader from './ImportHeader';
import FileUploadSection from './FileUploadSection';
import ManualCsvSection from './ManualCsvSection';
import SlideCsvSection from './SlideCsvSection';
import ImportInfo from './ImportInfo';
import SuccessMessage from './SuccessMessage';
import UserImports from './UserImports';
import DeleteModal from './DeleteModal';

import '../../styles/Import.css';

const Import = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userImports, setUserImports] = useState([]);
  const [loadingImports, setLoadingImports] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [importMode, setImportMode] = useState('file'); // 'file', 'manual', or 'slides'
  const [csvText, setCsvText] = useState('');
  const [csvName, setCsvName] = useState('');
  const [quizTag, setQuizTag] = useState('');
  const [quizTag2, setQuizTag2] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [newTagValue, setNewTagValue] = useState('');
  const [newTag2Value, setNewTag2Value] = useState('');
  const [selectedPdf, setSelectedPdf] = useState('');
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

  const handleTagChange = (e) => {
    setQuizTag(e.target.value);
  };

  const handleTag2Change = (e) => {
    setQuizTag2(e.target.value);
  };

  const handleModeToggle = (mode) => {
    setImportMode(mode);
    setError(null);
    setSuccess(false);
  };

  const startEditTag = (importItem) => {
    setEditingTag(importItem.id);
    setNewTagValue(importItem.tag || '');
    setNewTag2Value(importItem.tag2 || '');
  };

  const cancelEditTag = () => {
    setEditingTag(null);
    setNewTagValue('');
    setNewTag2Value('');
  };

  const saveTagEdit = async (importId) => {
    try {
      setError(null);
      
      const { data: importData, error: fetchError } = await supabase
        .from('imports')
        .select('*')
        .eq('id', importId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (importData.user !== user.id) {
        throw new Error('You can only edit tags for your own imports');
      }
      
      const { error: updateError } = await supabase
        .from('imports')
        .update({ 
          tag: newTagValue.trim() || null,
          tag2: newTag2Value.trim() || null
        })
        .eq('id', importId)
        .eq('user', user.id);
        
      if (updateError) throw updateError;
      
      console.log('Tags updated successfully!');
      
      setUserImports(prevImports => 
        prevImports.map(item => 
          item.id === importId 
            ? { 
                ...item, 
                tag: newTagValue.trim() || null,
                tag2: newTag2Value.trim() || null
              } 
            : item
        )
      );
      
      setEditingTag(null);
      setNewTagValue('');
      setNewTag2Value('');
    } catch (err) {
      console.error('Error updating tags:', err);
      setError(`Failed to update tags: ${err.message}`);
    }
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
      let finalFileName = csvName.trim();
      if (!finalFileName.toLowerCase().endsWith('.csv')) {
        finalFileName += '.csv';
      }

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

      const blob = new Blob([csvText], { type: 'text/csv' });
      const csvFile = new File([blob], finalFileName, { type: 'text/csv' });

      const { error: uploadError } = await supabase.storage
        .from('quizes')
        .upload(finalFileName, csvFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('imports')
        .insert([{
          user: user.id,
          quiz_name: finalFileName,
          tag: quizTag.trim() || null,
          tag2: quizTag2.trim() || null
        }]);

      if (dbError) throw dbError;

      console.log(`Manual CSV uploaded successfully as: ${finalFileName}`);
      setSuccess(true);
      setCsvText('');
      setCsvName('');
      setQuizTag('');
      setQuizTag2('');
      fetchUserImports();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload CSV data');
    } finally {
      setUploading(false);
    }
  };

  const processSlidesCsv = async () => {
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

      // Create record in the imports table with tag and PDF
      const { error: dbError } = await supabase
        .from('imports')
        .insert([{
          user: user.id,
          quiz_name: finalFileName,
          tag: quizTag.trim() || null,
          tag2: quizTag2.trim() || null,
          pdf: selectedPdf || null // Store the selected PDF filename
        }]);

      if (dbError) throw dbError;

      console.log(`Slides CSV uploaded successfully as: ${finalFileName}`);
      setSuccess(true);
      setCsvText('');
      setCsvName('');
      setQuizTag('');
      setQuizTag2('');
      setSelectedPdf('');
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
      const fileName = file.name;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      
      let finalFileName = fileName;
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
        
        finalFileName = `${baseName} (${counter})${extension}`;
        counter++;
      }

      const { error: uploadError } = await supabase.storage
        .from('quizes')
        .upload(finalFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('imports')
        .insert([{
          user: user.id,
          quiz_name: finalFileName,
          tag: quizTag.trim() || null,
          tag2: quizTag2.trim() || null
        }]);

      if (dbError) throw dbError;

      console.log(`File uploaded successfully as: ${finalFileName}`);
      setSuccess(true);
      setFile(null);
      setQuizTag('');
      setQuizTag2('');
      document.getElementById('file-upload').value = '';
      
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
    setQuizTag('');
    setQuizTag2('');
    
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
      if (importItem.user !== user.id) {
        throw new Error('You can only delete your own imports');
      }
      
      const { error: storageError } = await supabase
        .storage
        .from('quizes')
        .remove([importItem.quiz_name]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('imports')
        .delete()
        .eq('id', importItem.id)
        .eq('user', user.id);

      if (dbError) throw dbError;

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
        <ImportHeader importMode={importMode} handleModeToggle={handleModeToggle} />

        <div className="import-content">
          {!success ? (
            <>
              {importMode === 'file' ? (
                <FileUploadSection 
                  file={file}
                  uploading={uploading}
                  error={error}
                  quizTag={quizTag}
                  quizTag2={quizTag2}
                  handleFileChange={handleFileChange}
                  handleTagChange={handleTagChange}
                  handleTag2Change={handleTag2Change}
                  handleUpload={handleUpload}
                />
              ) : importMode === 'manual' ? (
                <ManualCsvSection 
                  csvName={csvName}
                  csvText={csvText}
                  quizTag={quizTag}
                  quizTag2={quizTag2}
                  uploading={uploading}
                  error={error}
                  handleCsvNameChange={handleCsvNameChange}
                  handleCsvTextChange={handleCsvTextChange}
                  handleTagChange={handleTagChange}
                  handleTag2Change={handleTag2Change}
                  processManualCsv={processManualCsv}
                />
              ) : (
                <SlideCsvSection 
                  csvName={csvName}
                  csvText={csvText}
                  selectedPdf={selectedPdf}
                  quizTag={quizTag}
                  quizTag2={quizTag2}
                  uploading={uploading}
                  error={error}
                  handleCsvNameChange={handleCsvNameChange}
                  handleCsvTextChange={handleCsvTextChange}
                  handleTagChange={handleTagChange}
                  handleTag2Change={handleTag2Change}
                  setSelectedPdf={setSelectedPdf}
                  processSlidesCsv={processSlidesCsv}
                />
              )}

              {importMode !== 'slides' && <ImportInfo />}
            </>
          ) : (
            <SuccessMessage handleTryAgain={handleTryAgain} />
          )}
        </div>

        <UserImports 
          loadingImports={loadingImports}
          userImports={userImports}
          editingTag={editingTag}
          newTagValue={newTagValue}
          newTag2Value={newTag2Value}
          setNewTagValue={setNewTagValue}
          setNewTag2Value={setNewTag2Value}
          startEditTag={startEditTag}
          saveTagEdit={saveTagEdit}
          cancelEditTag={cancelEditTag}
          confirmDelete={confirmDelete}
        />
      </div>

      <DeleteModal 
        deleteConfirm={deleteConfirm}
        handleDelete={handleDelete}
        cancelDelete={cancelDelete}
      />
    </div>
  );
};

export default Import;
