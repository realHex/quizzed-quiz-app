import { supabase } from './supabase';
import Papa from 'papaparse';

export const fetchQuizList = async (userId = null) => {
  try {
    // If userId provided, first get the quizzes uploaded by this user
    let userQuizNames = [];
    if (userId) {
      console.log('Fetching quizzes for user:', userId);
      
      // Using 'user' column (not 'userid') which contains the UUID
      const { data: userImports, error: userImportsError } = await supabase
        .from('imports')
        .select('quiz_name')
        .eq('user', userId);
        
      if (userImportsError) {
        console.error('Error fetching user imports:', userImportsError);
        throw userImportsError;
      }
      
      console.log('User imports data:', userImports);
      
      // Extract quiz names from the user's imports
      userQuizNames = userImports?.map(record => record.quiz_name) || [];
      
      // If user has no quizzes, return empty array early
      if (userQuizNames.length === 0) {
        console.log('No quizzes found for user:', userId);
        return [];
      }
    }
    
    // Get files from storage
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('quizes')
      .list('');

    if (storageError) {
      console.error('Error fetching storage files:', storageError);
      throw storageError;
    }

    // Filter to get only CSV files
    let csvFiles = storageFiles?.filter(file => file.name.endsWith('.csv')) || [];
    
    // If filtering by user, only include their quizzes
    if (userId && userQuizNames.length > 0) {
      csvFiles = csvFiles.filter(file => userQuizNames.includes(file.name));
    }
    
    // If no quiz files found, return empty array early
    if (csvFiles.length === 0) {
      return [];
    }
    
    // Fetch import records
    const { data: importRecords, error: importError } = await supabase
      .from('imports')
      .select('quiz_name, user');
      
    if (importError) {
      console.error('Error fetching import records:', importError);
      throw importError;
    }
    
    // Handle case where no import records are found
    if (!importRecords || importRecords.length === 0) {
      console.log('No import records found');
      // Return basic quiz information without uploader details
      return csvFiles.map(file => ({
        fileName: file.name,
        title: file.name.replace('.csv', ''),
        description: 'Take this quiz to test your knowledge.',
        category: 'General',
        difficulty: 'medium',
        questionCount: '?',
        timeEstimate: '10 min',
        uploaderName: 'Unknown'
      }));
    }
    
    // Get unique user IDs from imports
    const userIds = [...new Set(importRecords.map(record => record.user))].filter(Boolean);
    
    // Only fetch profiles if there are any userIds
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        throw profilesError;
      }
      
      profiles = profilesData || [];
    }
    
    // Create a map of user IDs to names for quick lookup
    const userMap = {};
    profiles.forEach(profile => {
      if (profile && profile.id) {
        userMap[profile.id] = profile.name || 'Unknown';
      }
    });
    
    // Map files to quiz objects with uploader info
    return csvFiles.map(file => {
      // Find matching import record using the correct column name
      const importRecord = importRecords.find(record => record.quiz_name === file.name);
      
      // Access the user ID using importRecord.user (not user_id)
      const uploaderName = importRecord && userMap[importRecord.user] ? 
        userMap[importRecord.user] : 'Unknown';
      
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
