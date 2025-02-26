import { supabase } from './supabase';

export const saveQuizAttempt = async (attemptData) => {
  try {
    const { data, error } = await supabase
      .from('attempts')
      .insert([attemptData]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }
};

export const fetchQuizList = async () => {
  try {
    const { data, error } = await supabase
      .storage
      .from('quizes')
      .list('');

    if (error) throw error;
    
    // Filter only CSV files
    return data
      .filter(file => file.name.endsWith('.csv'))
      .map(file => file.name);
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

    // Convert blob to text and parse CSV
    const text = await data.text();
    return parseCSV(text);
  } catch (error) {
    console.error('Error fetching quiz content:', error);
    throw error;
  }
};

const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      return {
        question: values[0],
        options: values.slice(1, -1),
        correct: values[values.length - 1].trim()
      };
    });
};
