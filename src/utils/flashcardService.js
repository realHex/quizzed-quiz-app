import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Update the fetchFlashcardSets function to get sets from all users

export const fetchFlashcardSets = async () => {
  try {
    // Get the authenticated user (still needed for checking ownership)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch all flashcard sets, not just the current user's
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching flashcard sets:', err);
    throw err;
  }
};

// Update the fetchFlashcardSet function to join with user_flashcard_progress
export const fetchFlashcardSet = async (id) => {
  if (!id) return null;
  
  try {
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the flashcard set
    const { data: setData, error: setError } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (setError) throw setError;
    
    // Get the flashcard items
    const { data: itemsData, error: itemsError } = await supabase
      .from('flashcard_items')
      .select('*')
      .eq('set_id', id)
      .order('position', { ascending: true });
    
    if (itemsError) throw itemsError;
    
    // Get user's progress for these items
    const { data: progressData, error: progressError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('flashcard_item_id', itemsData.map(item => item.id));
    
    if (progressError) throw progressError;
    
    // Create a map of progress data by flashcard_item_id
    const progressMap = (progressData || []).reduce((map, progress) => {
      map[progress.flashcard_item_id] = progress;
      return map;
    }, {});
    
    // Combine the items with their progress data
    const itemsWithProgress = itemsData.map(item => ({
      ...item,
      next_review_at: progressMap[item.id]?.next_review_at || null,
      last_reviewed: progressMap[item.id]?.last_reviewed || null,
      review_count: progressMap[item.id]?.review_count || 0
    }));
    
    // Combine the data
    const fullSet = {
      ...setData,
      items: itemsWithProgress || []
    };
    
    return fullSet;
  } catch (err) {
    console.error('Error fetching flashcard set:', err);
    throw err;
  }
};

// Create a new flashcard set
export const createFlashcardSet = async (flashcardData) => {
  try {
    // First get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    console.log('Creating flashcard set with user_id:', user.id);

    // Create the flashcard set with user_id
    const { data: setData, error: setError } = await supabase
      .from('flashcard_sets')
      .insert([{
        title: flashcardData.title,
        description: flashcardData.description || null,
        tag: flashcardData.tag || null,
        user_id: user.id, // Make sure user_id is included
        card_count: flashcardData.items?.length || 0
      }])
      .select()
      .single();
    
    if (setError) throw setError;
    
    // Now create all the flashcard items
    if (flashcardData.items && flashcardData.items.length > 0) {
      const itemsToInsert = flashcardData.items.map((item, index) => ({
        set_id: setData.id,
        question: item.question,
        answer: item.answer,
        position: index,
        user_id: user.id  // Make sure user_id is included here too
      }));
      
      const { error: itemsError } = await supabase
        .from('flashcard_items')
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
    }
    
    return setData;
  } catch (err) {
    console.error('Error creating flashcard set:', err);
    throw err;
  }
};

// Update an existing flashcard set
export const updateFlashcardSet = async (id, updateData) => {
  if (!id) throw new Error('Flashcard set ID is required');
  
  try {
    // Update the flashcard set
    const { data, error } = await supabase
      .from('flashcard_sets')  // Correct table name
      .update({
        title: updateData.title,
        description: updateData.description || null,
        tag: updateData.tag || null,
        card_count: updateData.items?.length || 0
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // If items are provided, handle item updates
    if (updateData.items) {
      // First, delete all existing items
      const { error: deleteError } = await supabase
        .from('flashcard_items')  // Correct table name
        .delete()
        .eq('set_id', id);
      
      if (deleteError) throw deleteError;
      
      // Then insert the new items
      const itemsToInsert = updateData.items.map((item, index) => ({
        set_id: id,
        question: item.question,
        answer: item.answer,
        position: index
      }));
      
      const { error: insertError } = await supabase
        .from('flashcard_items')  // Correct table name
        .insert(itemsToInsert);
      
      if (insertError) throw insertError;
    }
    
    return data;
  } catch (err) {
    console.error('Error updating flashcard set:', err);
    throw err;
  }
};

// Delete a flashcard set
export const deleteFlashcardSet = async (id) => {
  if (!id) throw new Error('Flashcard set ID is required');
  
  try {
    // Delete the flashcard set (items will cascade delete due to our SQL constraints)
    const { error } = await supabase
      .from('flashcard_sets')  // Correct table name
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error('Error deleting flashcard set:', err);
    throw err;
  }
};

// Process HTML content from Word to extract flashcards
export const processHtmlContent = (htmlContent) => {
  if (!htmlContent) return [];
  
  try {
    // Find table rows in the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const tableRows = tempDiv.querySelectorAll('tr');
    if (!tableRows.length) {
      throw new Error('No table found in the pasted content');
    }
    
    // Extract questions and answers from table rows
    const flashcardItems = [];
    
    tableRows.forEach((row, index) => {
      // Skip header row if present
      if (index === 0 && row.querySelector('th')) return;
      
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      
      const questionCell = cells[0];
      const answerCell = cells[1];
      
      if (!questionCell.textContent.trim() || !answerCell.innerHTML.trim()) return;
      
      flashcardItems.push({
        question: questionCell.textContent.trim(),
        answer: answerCell.innerHTML
      });
    });
    
    return flashcardItems;
  } catch (err) {
    console.error('Error processing HTML content:', err);
    throw new Error('Failed to process the pasted content');
  }
};

// Upload image from data URL
export const uploadImageFromDataUrl = async (dataUrl) => {
  try {
    // Extract content type and base64 data
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL');
    }
    
    const contentType = matches[1];
    const base64Data = matches[2];
    const blob = b64ToBlob(base64Data, contentType);
    
    // Generate a unique filename
    const fileExt = contentType.split('/')[1];
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${supabase.auth.user().id}/${fileName}`;
    
    // Upload the blob to Supabase storage
    const { data, error } = await supabase.storage
      .from('flashcard-images')
      .upload(filePath, blob, {
        contentType,
        upsert: false
      });
      
    if (error) throw error;
    
    // Get public URL for the uploaded image
    const { publicURL } = supabase.storage
      .from('flashcard-images')
      .getPublicUrl(filePath);
      
    return publicURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Helper function to convert base64 to Blob
function b64ToBlob(b64Data, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

// Update the next review time for a flashcard (user-specific)
export const updateFlashcardReviewTime = async (flashcardId, difficulty) => {
  try {
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Calculate the next review time based on difficulty
    const now = new Date();
    let nextReviewAt;

    switch (difficulty) {
      case 'again':
        // Review in less than 1 minute (10 seconds for testing)
        nextReviewAt = new Date(now.getTime() + 10 * 1000);
        break;
      case 'hard':
        // Review in less than 6 minutes
        nextReviewAt = new Date(now.getTime() + 6 * 60 * 1000);
        break;
      case 'good':
        // Review in less than 15 minutes
        nextReviewAt = new Date(now.getTime() + 15 * 60 * 1000);
        break;
      case 'easy':
        // Review in less than 5 days
        nextReviewAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Default: review in 1 day
        nextReviewAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // Check if a progress record exists for this user and flashcard
    const { data: existingProgress, error: selectError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('flashcard_item_id', flashcardId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
      throw selectError;
    }

    let result;
    if (existingProgress) {
      // Update the existing progress record
      const { data, error } = await supabase
        .from('user_flashcard_progress')
        .update({
          next_review_at: nextReviewAt.toISOString(),
          last_reviewed: now.toISOString(),
          review_count: existingProgress.review_count + 1
        })
        .eq('user_id', user.id)
        .eq('flashcard_item_id', flashcardId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create a new progress record
      const { data, error } = await supabase
        .from('user_flashcard_progress')
        .insert([{
          user_id: user.id,
          flashcard_item_id: flashcardId,
          next_review_at: nextReviewAt.toISOString(),
          last_reviewed: now.toISOString(),
          review_count: 1
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  } catch (err) {
    console.error('Error updating flashcard review time:', err);
    throw err;
  }
};
