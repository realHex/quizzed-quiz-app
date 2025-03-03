// This file contains utilities for analyzing and fixing CSV data

/**
 * Analyzes CSV data to detect potential issues
 */
export const analyzeCsvData = (csvContent) => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return {
      hasProperFormat: false,
      details: 'CSV file is empty'
    };
  }
  
  // Check header row
  const header = lines[0].toLowerCase();
  const hasCorrectHeaders = header.includes('type') && 
                          header.includes('question') && 
                          header.includes('correct');
                          
  // Check if it has the optional slide column
  const hasSlideColumn = header.includes('slide');
  
  // Basic format analysis
  const analysis = {
    hasProperFormat: hasCorrectHeaders,
    lineCount: lines.length,
    questionCount: lines.length - 1,
    hasHeaderRow: hasCorrectHeaders,
    hasSlideColumn: hasSlideColumn,
    details: hasCorrectHeaders ? 'CSV format appears correct' : 'CSV header format is incorrect'
  };
  
  return analysis;
};

/**
 * Attempts to normalize CSV data that might have formatting issues
 */
export const normalizeCsvData = (csvContent) => {
  // Split into lines
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) return csvContent;
  
  // Check if header exists, if not add it
  const firstLine = lines[0].toLowerCase();
  if (!firstLine.includes('type') || !firstLine.includes('question') || !firstLine.includes('correct')) {
    // Add proper header
    const hasSlide = firstLine.split(',').length >= 7;
    const newHeader = hasSlide 
      ? 'Type,Question,Option1,Option2,Option3,Option4,Correct,Slide'
      : 'Type,Question,Option1,Option2,Option3,Option4,Correct';
      
    lines.unshift(newHeader);
  }
  
  // Ensure proper quote escaping
  const normalizedLines = lines.map(line => {
    const columns = line.split(',');
    
    // Process each column
    const processedColumns = columns.map(col => {
      // If already properly quoted, leave it
      if (col.startsWith('"') && col.endsWith('"')) return col;
      
      // Check if the column needs quotes (contains commas, quotes, or new lines)
      const needsQuotes = col.includes(',') || col.includes('"') || col.includes('\n');
      
      if (needsQuotes) {
        // Escape any quotes by doubling them and wrap in quotes
        const escaped = col.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      
      return col;
    });
    
    return processedColumns.join(',');
  });
  
  return normalizedLines.join('\n');
};

/**
 * Validates and fixes YES/NO answers to be consistent
 */
export const validateYesNoAnswers = (questions) => {
  return questions.map(question => {
    if (question.type === 'YESNO') {
      // Normalize 'yes' or 'no' answers to lowercase
      const normalizedAnswer = question.correct.trim().toLowerCase();
      
      // Ensure answer is exactly 'yes' or 'no'
      if (normalizedAnswer === 'y' || normalizedAnswer === 'yes' || normalizedAnswer === 'true' || normalizedAnswer === '1') {
        question.correct = 'yes';
      } else if (normalizedAnswer === 'n' || normalizedAnswer === 'no' || normalizedAnswer === 'false' || normalizedAnswer === '0') {
        question.correct = 'no';
      }
    }
    return question;
  });
};
