import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and set the user
    const session = supabase.auth.getSession();
    setUser(session?.user || null);
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch user profile when user changes
  useEffect(() => {
    async function fetchUserProfile() {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
        }
      } else {
        setUserProfile(null);
      }
    }

    fetchUserProfile();
  }, [user]);

  // Update user settings
  const updateUserSettings = async (settings) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      // Update the local userProfile state
      setUserProfile((prev) => ({ ...prev, ...settings }));
      return data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  };

  // Toggle the shuffle setting
  const toggleShuffleSetting = async () => {
    if (!userProfile) return;
    
    try {
      // Get current value (defaulting to false if undefined)
      const currentShuffle = userProfile.shuffle ?? false;
      const newShuffleValue = !currentShuffle;
      
      // Directly update the database with the new boolean value
      const result = await updateUserSettings({ shuffle: newShuffleValue });
      
      return result;
    } catch (error) {
      console.error('Error in toggleShuffleSetting:', error);
      throw error;
    }
  };

  // Add this function to the AuthContext provider
  const toggleFlashcardShuffleSetting = async () => {
    try {
      const newValue = !(userProfile?.shuffle_flashcards ?? false);
      
      const { error } = await supabase
        .from('profiles')
        .update({ shuffle_flashcards: newValue })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        shuffle_flashcards: newValue
      }));
      
      return newValue;
    } catch (error) {
      console.error('Error toggling flashcard shuffle setting:', error);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) throw error;
    return data;
  };

  // Sign up function
  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: name
        }
      }
    });
    
    if (error) throw error;
    
    // Create a profile for the user with default settings
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, name: name, shuffle: false }]);
      
      if (profileError) throw profileError;
    }
    
    return data;
  };

  // Sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    userProfile,
    signIn,
    signUp,
    signOut,
    loading,
    updateUserSettings,
    toggleShuffleSetting,
    toggleFlashcardShuffleSetting // Add this line
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
