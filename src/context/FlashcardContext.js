import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const FlashcardContext = createContext();

export const useFlashcards = () => useContext(FlashcardContext);

export const FlashcardProvider = ({ children }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch all flashcard sets for the current user
  const fetchFlashcardSets = async () => {
    if (!user) return [];

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setFlashcardSets(data || []);
      return data;
    } catch (err) {
      setError('Error loading flashcard sets');
      console.error('Error fetching flashcard sets:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific flashcard set by ID, including its items
  const fetchFlashcardSet = async (id) => {
    if (!id) return null;
    
    setLoading(true);
    setError(null);
    
    try {
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
      
      // Combine the data
      const fullSet = {
        ...setData,
        items: itemsData || []
      };
      
      return fullSet;
    } catch (err) {
      setError('Error loading flashcard set');
      console.error('Error fetching flashcard set:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new flashcard set
  const createFlashcardSet = async (flashcardData) => {
    if (!user) throw new Error('You must be logged in to create flashcards');
    
    setLoading(true);
    setError(null);
    
    try {
      // First create the flashcard set
      const { data: setData, error: setError } = await supabase
        .from('flashcard_sets')
        .insert([
          {
            title: flashcardData.title,
            description: flashcardData.description || null,
            tag: flashcardData.tag || null,
            user_id: user.id,
            card_count: flashcardData.items?.length || 0
          }
        ])
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
          user_id: user.id
        }));
        
        const { error: itemsError } = await supabase
          .from('flashcard_items')
          .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
      }
      
      // Refresh the flashcard sets
      await fetchFlashcardSets();
      
      return setData;
    } catch (err) {
      setError('Error creating flashcard set');
      console.error('Error creating flashcard set:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing flashcard set
  const updateFlashcardSet = async (id, updateData) => {
    if (!user) throw new Error('You must be logged in to update flashcards');
    if (!id) throw new Error('Flashcard set ID is required');
    
    setLoading(true);
    setError(null);
    
    try {
      // Update the flashcard set
      const { data, error } = await supabase
        .from('flashcard_sets')
        .update({
          title: updateData.title,
          description: updateData.description || null,
          tag: updateData.tag || null,
          card_count: updateData.items?.length || 0
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own sets
        .select()
        .single();
      
      if (error) throw error;
      
      // If items are provided, handle item updates
      if (updateData.items) {
        // First, delete all existing items
        const { error: deleteError } = await supabase
          .from('flashcard_items')
          .delete()
          .eq('set_id', id);
        
        if (deleteError) throw deleteError;
        
        // Then insert the new items
        const itemsToInsert = updateData.items.map((item, index) => ({
          set_id: id,
          question: item.question,
          answer: item.answer,
          position: index,
          user_id: user.id
        }));
        
        const { error: insertError } = await supabase
          .from('flashcard_items')
          .insert(itemsToInsert);
        
        if (insertError) throw insertError;
      }
      
      // Refresh the flashcard sets
      await fetchFlashcardSets();
      
      return data;
    } catch (err) {
      setError('Error updating flashcard set');
      console.error('Error updating flashcard set:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a flashcard set
  const deleteFlashcardSet = async (id) => {
    if (!user) throw new Error('You must be logged in to delete flashcards');
    if (!id) throw new Error('Flashcard set ID is required');
    
    setLoading(true);
    setError(null);
    
    try {
      // Delete flashcard items first (Cascading delete should handle this but being explicit)
      const { error: itemsError } = await supabase
        .from('flashcard_items')
        .delete()
        .eq('set_id', id)
        .eq('user_id', user.id);
      
      if (itemsError) throw itemsError;
      
      // Delete the flashcard set
      const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update the state by removing the deleted set
      setFlashcardSets(flashcardSets.filter(set => set.id !== id));
      
      return true;
    } catch (err) {
      setError('Error deleting flashcard set');
      console.error('Error deleting flashcard set:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Process HTML content from Word to extract flashcards
  const processHtmlContent = async (htmlContent) => {
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
        
        // Process answer cell to handle images properly
        const processedAnswer = processAnswerContent(answerCell.innerHTML);
        
        flashcardItems.push({
          question: questionCell.textContent.trim(),
          answer: processedAnswer
        });
      });
      
      return flashcardItems;
    } catch (err) {
      console.error('Error processing HTML content:', err);
      throw new Error('Failed to process the pasted content');
    }
  };
  
  // Helper function to process answer content and handle images
  const processAnswerContent = (html) => {
    // This is a simplified implementation
    // For a full solution, you'd need to handle image uploads to your storage
    
    // Convert HTML to a format that can be safely stored and rendered
    // Here we're just keeping it as-is for simplicity
    return html;
  };

  // Initialize by loading flashcard sets when user changes
  useEffect(() => {
    if (user) {
      fetchFlashcardSets();
    } else {
      setFlashcardSets([]);
    }
  }, [user]);

  const value = {
    flashcardSets,
    loading,
    error,
    fetchFlashcardSets,
    fetchFlashcardSet,
    createFlashcardSet,
    updateFlashcardSet,
    deleteFlashcardSet,
    processHtmlContent
  };

  return (
    <FlashcardContext.Provider value={value}>
      {children}
    </FlashcardContext.Provider>
  );
};
