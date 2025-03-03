
-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf_files', 'pdf_files', false)
ON CONFLICT (id) DO NOTHING;

-- Set up policy to allow users to upload their own PDFs
CREATE POLICY "Users can upload their own PDFs" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'pdf_files');

-- Set up policy to allow users to view PDFs
CREATE POLICY "Users can view all PDFs" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'pdf_files');

-- Set up policy to allow users to update their own PDFs
CREATE POLICY "Users can update their own PDFs" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'pdf_files' AND auth.uid()::text = owner);

-- Set up policy to allow users to delete their own PDFs
CREATE POLICY "Users can delete their own PDFs" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'pdf_files' AND auth.uid()::text = owner);

-- Add 'pdf' column to imports table if it doesn't exist
ALTER TABLE public.imports 
ADD COLUMN IF NOT EXISTS pdf TEXT;
