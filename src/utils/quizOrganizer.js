/**
 * Organizes quizzes into folder structure by tags
 * @param {Array} quizzes - Array of quiz objects with tag property
 * @returns {Object} - Object containing organized quizzes
 */
export const organizeQuizzesByTag = (quizzes) => {
  if (!quizzes || !Array.isArray(quizzes)) {
    return { folders: {}, untagged: [] };
  }
  
  const folders = {};
  const untagged = [];
  
  quizzes.forEach(quiz => {
    if (quiz.tag) {
      // Create folder if it doesn't exist
      if (!folders[quiz.tag]) {
        folders[quiz.tag] = [];
      }
      
      // Add quiz to its folder
      folders[quiz.tag].push(quiz);
    } else {
      // Add to untagged list
      untagged.push(quiz);
    }
  });
  
  return {
    folders,
    untagged
  };
};

/**
 * Gets the list of folders from organized quiz data
 * @param {Object} organizedQuizzes - Output from organizeQuizzesByTag
 * @returns {Array} - Array of folder objects
 */
export const getFoldersList = (organizedQuizzes) => {
  if (!organizedQuizzes || !organizedQuizzes.folders) {
    return [];
  }
  
  return Object.keys(organizedQuizzes.folders).map(folderName => ({
    name: folderName,
    count: organizedQuizzes.folders[folderName].length
  }));
};
