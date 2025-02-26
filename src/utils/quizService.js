import { supabase } from './supabase';
import Papa from 'papaparse';

export const fetchQuizList = async () => {
  try {
    // Get files from storage
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('quizes')
      .list('');

    if (storageError) throw storageError;

    // Filter to get only CSV files
    const csvFiles = storageFiles.filter(file => file.name.endsWith('.csv'));
    
    // Fetch import records
    const { data: importRecords, error: importError } = await supabase
      .from('imports')
      .select('quiz_name, user');
      
    if (importError) throw importError;
    
    // Get unique user IDs from imports
    const userIds = [...new Set(importRecords.map(record => record.user))];
    
    // Fetch user profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
      
    if (profilesError) throw profilesError;
    
    // Create a map of user IDs to names for quick lookup
    const userMap = {};
    profiles.forEach(profile => {
      userMap[profile.id] = profile.name;
    });
    
    // Map files to quiz objects with uploader info
    return csvFiles.map(file => {
      // Find matching import record
      const importRecord = importRecords.find(record => record.quiz_name === file.name);
      const uploaderName = importRecord ? userMap[importRecord.user] || 'Unknown' : 'Unknown';
      
      return {
        fileName: file.name,
        title: file.name.replace('.csv', ''),
        description: 'Take this quiz to test your knowledge.',
        category: 'General',
        difficulty: 'medium',
        questionCount: '?',
        timeEstimate: '10 min',
        uploaderName: uploaderName
      };
    });
  } catch (error) {
    console.error('Error fetching quiz list:', error);
    throw error;
  }
};

export const fetchQuizContent = async (quizName) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('quizes')
      .download(quizName);

    if (error) throw error;

    const text = await data.text();
    return processQuizData(text);
  } catch (error) {
    console.error('Error fetching quiz content:', error);
    throw error;
  }
};

export const saveQuizAttempt = async (attemptData) => {
  try {
    const { data, error } = await supabase
      .from('attempts')
      .insert([{
        user_id: attemptData.user_id,
        quiz_name: attemptData.quiz_name,
        score: attemptData.score,
        time: attemptData.time,          // Add time field (formatted as MM:SS)
        questions: attemptData.questions  // Add questions field (e.g., "5/10")
        // created_at is handled automatically by Supabase
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }
};

const processQuizData = (csvData) => {
  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return result.data.map((row, index) => {
    const type = row.Type?.trim().toUpperCase();
    let options = [];
    let correct = null;

    switch (type) {
      case 'YESNO':
        options = ['Yes', 'No'];
        correct = row.Correct?.trim().toLowerCase() === 'yes' ? 'Yes' : 'No';
        break;
      case 'MCQ':
        options = [row.Option1, row.Option2, row.Option3, row.Option4]
          .filter(Boolean)
          .map(opt => opt.trim());
        // For MCQ, Correct can be a number (1-based index) or the actual option text
        if (!isNaN(row.Correct)) {
          const correctIndex = parseInt(row.Correct) - 1;
          correct = correctIndex >= 0 && correctIndex < options.length ? options[correctIndex] : null;
        } else {
          correct = row.Correct?.trim();
        }
        break;
      case 'MULTI':
        options = [row.Option1, row.Option2, row.Option3, row.Option4]
          .filter(Boolean)
          .map(opt => opt.trim());
        // For MULTI, Correct is a semicolon-separated list of 1-based indices or actual options
        if (row.Correct?.includes(';')) {
          const correctIndices = row.Correct.split(';').map(val => val.trim());
          if (!isNaN(correctIndices[0])) {
            // If indices, convert to actual option values
            correct = correctIndices.map(idx => {
              const optionIndex = parseInt(idx) - 1;
              return optionIndex >= 0 && optionIndex < options.length ? options[optionIndex] : null;
            }).filter(Boolean);
          } else {
            // If option values
            correct = correctIndices;
          }
        } else {
          correct = [row.Correct?.trim()].filter(Boolean);
        }
        break;
      default:
        options = [row.Option1, row.Option2, row.Option3, row.Option4]
          .filter(Boolean)
          .map(opt => opt.trim());
        correct = row.Correct?.trim();
    }

    return {
      id: index,
      type: type,
      question: row.Question?.trim(),
      options: options,
      correct: correct
    };
  });
};
