/**
 * Utility to debug CSV parsing issues
 */

export function analyzeCsvData(csvText) {
  // Check if data has proper line breaks
  const lineCount = (csvText.match(/\n/g) || []).length + 1;
  console.log(`CSV contains ${lineCount} lines`);
  
  // Parse the CSV manually to inspect
  const lines = csvText.split('\n');
  console.log("Header:", lines[0]);
  
  // Check the first YESNO question specifically
  const yesNoQuestions = lines.filter(line => line.startsWith('YESNO'));
  console.log("YESNO questions:", yesNoQuestions);
  
  // Inspect answer format for YESNO questions
  yesNoQuestions.forEach((q, i) => {
    const parts = q.split(',');
    // The answer should be in the last item, with quotes removed
    const answer = parts[parts.length - 1].replace(/"/g, '').trim().toLowerCase();
    console.log(`YESNO question ${i+1} answer:`, answer, `(valid: ${answer === 'yes' || answer === 'no'})`);
  });
  
  return {
    lineCount,
    hasProperFormat: lineCount > 1,
    firstLineIssue: lines[0].indexOf("Type") !== 0
  };
}

export function normalizeCsvData(csvText) {
  // Your CSV appears to be missing proper line breaks
  // Try to split by the pattern "YESNO," or "MCQ," or "MULTI," except for the first occurrence
  let fixedCsv = csvText;
  
  // First clean up any unexpected characters
  fixedCsv = fixedCsv.replace(/^"|"$/g, ''); // Remove quotes at start/end
  
  // Insert line breaks before each question type, but not before the header
  if (!fixedCsv.startsWith('Type,')) {
    fixedCsv = 'Type,Question,Option1,Option2,Option3,Option4,Correct\n' + fixedCsv;
  }
  
  // Add proper line breaks
  fixedCsv = fixedCsv.replace(/ (YESNO,|MCQ,|MULTI,)/g, '\n$1');
  
  return fixedCsv;
}

export function validateYesNoAnswers(questions) {
  return questions.map(question => {
    // Clone to avoid modifying the original
    const q = {...question};
    
    if (q.type === 'YESNO') {
      // Normalize the answer to lowercase and trim
      const normalizedAnswer = q.correct.toLowerCase().trim();
      
      // Log for debugging
      console.log(`YESNO question "${q.question}" - original answer: "${q.correct}", normalized: "${normalizedAnswer}"`);
      
      // Ensure we have "yes" or "no" exactly
      if (normalizedAnswer === 'yes' || normalizedAnswer === 'no') {
        q.correct = normalizedAnswer;
      } else {
        console.warn(`Invalid YESNO answer format for question: ${q.question}`);
      }
    }
    
    return q;
  });
}
