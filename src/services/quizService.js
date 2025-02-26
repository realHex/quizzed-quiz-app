import Papa from 'papaparse';

export const fetchAvailableQuizzes = async () => {
  try {
    // Return only the example quiz that exists in public folder
    return ['Example Quiz.csv'];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
};

export const parseQuizData = async (quizName) => {
  try {
    const response = await fetch(`/quizes/${quizName}`);
    if (!response.ok) {
      throw new Error('Failed to fetch quiz data');
    }
    
    const csvData = await response.text();
    return processQuizData(csvData);
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    throw error;
  }
};

// Process CSV data into structured format
const processQuizData = (csvData) => {
  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value?.trim() || '',  // Handle null/undefined values
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  // Validate required columns
  const requiredColumns = ['Type', 'Question', 'Correct'];
  const missingColumns = requiredColumns.filter(col => !result.meta.fields.includes(col));
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return result.data.map((row, index) => {
    // Validate question type
    if (!['MCQ', 'MULTI', 'YESNO'].includes(row.Type)) {
      throw new Error(`Invalid question type "${row.Type}" at question ${index + 1}`);
    }

    // Basic question structure
    const question = {
      id: index,
      type: row.Type,
      text: row.Question?.trim(),
      options: [],
      correctAnswer: row.Correct?.trim()
    };

    // Validate question text
    if (!question.text) {
      throw new Error(`Empty question text at question ${index + 1}`);
    }

    // Handle different question types
    if (question.type === 'MCQ' || question.type === 'MULTI') {
      // Collect non-empty options
      const options = [row.Option1, row.Option2, row.Option3, row.Option4]
        .map(opt => opt?.trim())
        .filter(Boolean);
      
      if (options.length < 2) {
        throw new Error(`Question ${index + 1} requires at least 2 options`);
      }
      
      question.options = options;
      
      if (!question.correctAnswer) {
        throw new Error(`Missing correct answer for question ${index + 1}`);
      }

      if (question.type === 'MCQ') {
        const correctNum = parseInt(question.correctAnswer);
        if (isNaN(correctNum) || correctNum < 1 || correctNum > options.length) {
          throw new Error(`Invalid correct answer for MCQ question ${index + 1}`);
        }
      } else { // MULTI
        const correctAnswers = question.correctAnswer.split(';')
          .map(num => num.trim())
          .map(num => parseInt(num))
          .filter(num => !isNaN(num));
          
        if (correctAnswers.length === 0 || 
            correctAnswers.some(num => num < 1 || num > options.length)) {
          throw new Error(`Invalid correct answer for MULTI question ${index + 1}`);
        }
        question.correctAnswer = correctAnswers.join(';');
      }
    } else { // YESNO
      if (!question.correctAnswer) {
        throw new Error(`Missing correct answer for question ${index + 1}`);
      }
      
      const answer = question.correctAnswer.toLowerCase();
      if (answer !== 'yes' && answer !== 'no') {
        throw new Error(`Invalid answer for YES/NO question ${index + 1}. Must be 'yes' or 'no'`);
      }
      question.correctAnswer = answer;
    }

    return question;
  });
};

export const getQuizMetadata = async (quizName) => {
  // In a real application, you would fetch this data from an API
  // For now, we'll return mock data
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // You can expand this mock data as needed
    const mockMetadata = {
      'JavaScript Basics.csv': {
        description: 'Test your knowledge of JavaScript fundamentals including variables, functions, and control flow.',
        questions: 10,
        difficulty: 'easy',
        timeEstimate: '10 min',
        category: 'Programming',
        lastAttempt: null
      },
      'Advanced CSS.csv': {
        description: 'Challenge yourself with advanced CSS concepts like flexbox, grid, and animations.',
        questions: 15,
        difficulty: 'medium',
        timeEstimate: '15 min',
        category: 'Web Design',
        lastAttempt: '2023-10-15'
      },
      // Add more metadata for other quizzes
    };
    
    return mockMetadata[quizName] || {
      description: 'Take this quiz to test your knowledge.',
      questions: '?',
      difficulty: 'medium',
      timeEstimate: '?',
      category: 'General',
      lastAttempt: null
    };
  } catch (error) {
    console.error("Error fetching quiz metadata:", error);
    return null;
  }
};