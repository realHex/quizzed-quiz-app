/**
 * Extracts the content from a pasted Word table HTML
 * @param {string} htmlContent - HTML content pasted from Word
 * @returns {Array<Object>} - Array of extracted flashcard items
 */
export const extractFlashcardsFromHtml = (htmlContent) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Find all tables
    const tables = doc.querySelectorAll('table');
    if (!tables || tables.length === 0) {
      console.warn('No tables found in pasted content');
      return [];
    }

    const flashcards = [];
    
    // Process each table
    tables.forEach((table) => {
      const rows = table.querySelectorAll('tr');
      
      Array.from(rows).forEach((row) => {
        const cells = row.querySelectorAll('td');
        
        // We need at least 2 cells for question and answer
        if (cells.length < 2) return;
        
        const questionCell = cells[0];
        const answerCell = cells[1];
        
        // Extract question (text only)
        const question = questionCell.textContent.trim();
        
        // Extract answer with images
        const answerContent = processAnswerContent(answerCell);
        
        if (question && answerContent) {
          flashcards.push({
            question,
            answer: answerContent
          });
        }
      });
    });
    
    return flashcards;
  } catch (error) {
    console.error('Error extracting flashcards from HTML:', error);
    throw new Error('Failed to extract flashcards from pasted content');
  }
};

/**
 * Process answer cell content including images
 * @param {HTMLElement} answerCell - The answer cell DOM element
 * @returns {string} - Processed answer content with markdown image placeholders
 */
const processAnswerContent = (answerCell) => {
  // Clone the cell to work with it
  const clone = answerCell.cloneNode(true);
  
  // Replace images with markdown placeholders for now
  // We'll process these images separately when uploading
  const images = clone.querySelectorAll('img');
  let imageIndex = 0;
  
  images.forEach((img) => {
    const placeholder = document.createTextNode(`[IMAGE_PLACEHOLDER_${imageIndex++}]`);
    img.parentNode.replaceChild(placeholder, img);
  });
  
  return clone.textContent.trim();
};

/**
 * Extract images from HTML content
 * @param {string} htmlContent - HTML content that may contain images
 * @returns {Array<Object>} - Array of image information
 */
export const extractImagesFromHtml = (htmlContent) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const images = [];
    const imgElements = doc.querySelectorAll('img');
    
    imgElements.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && (src.startsWith('data:') || src.startsWith('http'))) {
        images.push({
          src,
          alt: img.getAttribute('alt') || '',
          width: img.width || null,
          height: img.height || null
        });
      }
    });
    
    return images;
  } catch (error) {
    console.error('Error extracting images from HTML:', error);
    return [];
  }
};
