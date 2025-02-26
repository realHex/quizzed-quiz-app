import Papa from 'papaparse';

// Fetch available quizzes from the server
export const fetchAvailableQuizzes = async () => {
  try {
    const response = await fetch('/api/quizzes');
    if (!response.ok) {
      throw new Error('Failed to fetch quizzes');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    // For development, return mock data
    return ['Example Quiz.csv', 'JavaScript Basics.csv', 'React Fundamentals.csv'];
  }
};

// Parse CSV data into quiz questions
export const parseQuizData = async (quizName) => {
  try {
    // In a real app, this would be an API call to fetch the CSV data
    const response = await fetch(`/api/quiz/${quizName}`);
    if (!response.ok) {
      throw new Error('Failed to fetch quiz data');
    }
    
    const csvData = await response.text();
    
    return processQuizData(csvData);
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    
    // For development, use the Example Quiz data if requested
    if (quizName === 'Example%20Quiz.csv') {
      const mockCsvData = await mockFetchExampleQuiz();
      return processQuizData(mockCsvData);
    }
    
    throw error;
  }
};

// Process CSV data into structured format
const processQuizData = (csvData) => {
  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true
  });

  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
  }

  return result.data.map((row, index) => {
    const question = {
      id: index,
      type: row.Type,
      text: row.Question,
      options: [],
      correctAnswer: row.Correct
    };

    // Add options based on question type
    if (question.type === 'MCQ' || question.type === 'MULTI') {
      question.options = [
        row.Option1,
        row.Option2,
        row.Option3,
        row.Option4
      ].filter(option => option); // Filter out empty options
    }

    return question;
  });
};

// Mock function for development to return Example Quiz data
const mockFetchExampleQuiz = async () => {
  return `Type,Question,Option1,Option2,Option3,Option4,Correct
YESNO,"Is Python case-sensitive?",,,,yes
MCQ,"Which language is used for web development?",Python,HTML,C++,Java,2
MULTI,"Which are programming languages?",Python,HTML,C++,CSS,1;3
YESNO,"Is JavaScript the same as Java?",,,,no
MCQ,"What does HTML stand for?",HyperText Markup Language,HighText Machine Language,Hyperlink and Text Markup Language,Home Tool Markup Language,1
MULTI,"Which are markup languages?",HTML,CSS,XML,Python,1;3
YESNO,"Is CSS used for styling web pages?",,,,yes
MCQ,"Which company developed Java?",Microsoft,Sun Microsystems,Apple,Google,2
MULTI,"Which are valid data types in Python?",int,float,list,file,1;2;3
YESNO,"Is Python open-source?",,,,yes`;
};
