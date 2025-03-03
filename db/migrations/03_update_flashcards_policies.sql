-- Update Row Level Security policies for flashcard tables to enable sharing

-- Drop the existing select policies
DROP POLICY IF EXISTS select_own_flashcard_sets ON flashcard_sets;
DROP POLICY IF EXISTS select_own_flashcard_items ON flashcard_items;

-- Create new select policies that allow any authenticated user to read any flashcard set
CREATE POLICY select_any_flashcard_sets
    ON flashcard_sets
    FOR SELECT
    USING (auth.uid() IS NOT NULL); -- User just needs to be authenticated

-- Create new select policy that allows any authenticated user to read flashcard items
CREATE POLICY select_any_flashcard_items
    ON flashcard_items
    FOR SELECT
    USING (auth.uid() IS NOT NULL); -- User just needs to be authenticated

-- Keep the existing insert/update/delete policies that restrict to owners
-- This ensures users can only modify their own content
