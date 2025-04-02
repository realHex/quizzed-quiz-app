import { supabase } from './supabase';
import Papa from 'papaparse';
import { parse } from 'papaparse';

export const fetchQuizList = async (userId = null) => {
  try {
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
    
    // If no quiz files found, return empty array early
    if (csvFiles.length === 0) {
      return [];
    }
    
    // Fetch import records - now including the tag column
    const { data: importRecords, error: importError } = await supabase
      .from('imports')
      .select('quiz_name, user, tag, tag2, visibility');
    
    if (importError) {
      console.error('Error fetching import records:', importError);
      throw importError;
    }
    
    let filteredImports = importRecords || [];
    let filteredFiles = csvFiles;
    
    // If filtering by user, only include their quizzes
    if (userId) {
      const userQuizNames = filteredImports
        .filter(record => record.user === userId)
        .map(record => record.quiz_name);
      
      filteredFiles = csvFiles.filter(file => userQuizNames.includes(file.name));
      
      // If user has no quizzes, return empty array early
      if (filteredFiles.length === 0) {
        return [];
      }
    } else {
      // If not filtering by user, only show public quizzes or the user's own quizzes
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      
      // Filter imports to only include public quizzes or the user's own quizzes
      filteredImports = filteredImports.filter(record => 
        record.visibility === true || // Public quizzes
        (currentUserId && record.user === currentUserId) // User's own quizzes
      );
      
      // Filter files to only include those in the filtered imports
      const visibleQuizNames = filteredImports.map(record => record.quiz_name);
      filteredFiles = csvFiles.filter(file => visibleQuizNames.includes(file.name));
    }

    // Get unique user IDs from imports
    const userIds = [...new Set(filteredImports.map(record => record.user))].filter(Boolean);
    
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
    
    // Map files to quiz objects with uploader info and tag
    return filteredFiles.map(file => {
      // Find matching import record using the correct column name
      const importRecord = filteredImports.find(record => record.quiz_name === file.name);
      
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
        uploaderName: uploaderName,
        tag: importRecord?.tag || null,
        tag2: importRecord?.tag2 || null,
        userId: importRecord?.user || null
      };
    });
  } catch (error) {
    console.error('Error fetching quiz list:', error);
    throw error;
  }
};

/**
 * Fetch the quiz content from Supabase storage and parse it
 * @param {string} quizName - Name of the quiz file (.csv)
 * @returns {Object} - Contains questions array and metadata
 */
export const fetchQuizContent = async (quizName) => {
  try {
    // First, get quiz metadata from the imports table
    const { data: importData, error: importError } = await supabase
      .from('imports')
      .select('*')
      .eq('quiz_name', quizName)
      .single();

    if (importError && importError.code !== 'PGRST116') {
      throw new Error(`Error fetching quiz metadata: ${importError.message}`);
    }
    
    // Now get the CSV file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('quizes')
      .download(quizName);

    if (fileError) {
      throw new Error(`Error downloading quiz file: ${fileError.message}`);
    }

    // Parse the CSV content
    const csvText = await fileData.text();
    const parsed = parse(csvText, { header: true, skipEmptyLines: true });
    
    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }

    // Process questions
    const questions = parsed.data.map(row => {
      // Transform the data based on question type
      const type = row.Type?.toUpperCase();
      const question = {
        type: type,
        question: row.Question,
        slide: row.Slide || null, // This can be slide number or text explanation
        options: []
      };

      // Handle different question types
      if (type === 'YESNO') {
        question.options = ['Yes', 'No'];
        question.correct = row.Correct?.toLowerCase() === 'yes' ? 'Yes' : 'No';
      } else if (type === 'MCQ') {
        question.options = [
          row.Option1, row.Option2, row.Option3, row.Option4
        ].filter(Boolean); // Remove empty options
        
        // For MCQ, the correct answer is the option index
        const correctIndex = parseInt(row.Correct, 10) - 1;
        question.correct = question.options[correctIndex];
      } else if (type === 'MULTI') {
        question.options = [
          row.Option1, row.Option2, row.Option3, row.Option4
        ].filter(Boolean);
        
        // For MULTI, the correct answer is an array of option indices
        const correctIndices = row.Correct.split(';').map(i => parseInt(i, 10) - 1);
        question.correctArray = correctIndices;
        question.correct = correctIndices.map(idx => question.options[idx]);
      }

      return question;
    });

    // Prepare metadata object
    const metadata = {
      pdf: importData?.pdf || null,
      tag: importData?.tag || null
    };

    return { questions, metadata };
  } catch (error) {
    console.error('Error fetching quiz content:', error);
    throw error;
  }
};

/**
 * Save a quiz attempt to the database
 */
export const saveQuizAttempt = async (attemptData) => {
  try {
    const { error } = await supabase
      .from('attempts')  // Changed from 'history' to 'attempts' 
      .insert([attemptData]);

    if (error) throw error;
    return true;
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
