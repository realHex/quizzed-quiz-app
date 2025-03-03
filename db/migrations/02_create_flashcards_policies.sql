-- Set up Row Level Security policies for flashcard tables

-- Enable Row Level Security
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_items ENABLE ROW LEVEL SECURITY;

-- Create policies for flashcard_sets table
-- Policy for selecting: users can read their own flashcard sets
CREATE POLICY select_own_flashcard_sets
    ON flashcard_sets
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy for inserting: authenticated users can create flashcard sets
CREATE POLICY insert_flashcard_sets
    ON flashcard_sets
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy for updating: users can update their own flashcard sets
CREATE POLICY update_own_flashcard_sets
    ON flashcard_sets
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy for deleting: users can delete their own flashcard sets
CREATE POLICY delete_own_flashcard_sets
    ON flashcard_sets
    FOR DELETE
    USING (user_id = auth.uid());

-- Create policies for flashcard_items table
-- Policy for selecting: users can read their own flashcard items
CREATE POLICY select_own_flashcard_items
    ON flashcard_items
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy for inserting: authenticated users can create flashcard items for their sets
CREATE POLICY insert_flashcard_items
    ON flashcard_items
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND 
        EXISTS (
            SELECT 1 FROM flashcard_sets 
            WHERE flashcard_sets.id = set_id AND flashcard_sets.user_id = auth.uid()
        )
    );

-- Policy for updating: users can update their own flashcard items
CREATE POLICY update_own_flashcard_items
    ON flashcard_items
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy for deleting: users can delete their own flashcard items
CREATE POLICY delete_own_flashcard_items
    ON flashcard_items
    FOR DELETE
    USING (user_id = auth.uid());

-- Add a storage bucket for flashcard images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('flashcard_images', 'flashcard_images', false)
ON CONFLICT (id) DO NOTHING;

-- Policy for flashcard images bucket
CREATE POLICY "Users can upload flashcard images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'flashcard_images' AND auth.uid() = owner);

CREATE POLICY "Users can update their own flashcard images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'flashcard_images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own flashcard images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'flashcard_images' AND auth.uid() = owner);

CREATE POLICY "Users can view their own flashcard images" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'flashcard_images' AND auth.uid() = owner);
