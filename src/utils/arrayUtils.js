/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to be shuffled
 * @returns {Array} - A new shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Adds a property to track original positions of items in an array
 * @param {Array} array - The array to process
 * @returns {Array} - Array with original index tracking
 */
export const addOriginalIndices = (array) => {
  return array.map((item, index) => ({
    ...item,
    originalIndex: index
  }));
};
