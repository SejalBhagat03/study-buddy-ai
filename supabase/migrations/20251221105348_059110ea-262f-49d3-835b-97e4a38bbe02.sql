-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('chapter-pdfs', 'chapter-pdfs', false);

-- Allow authenticated users to upload their own PDFs
CREATE POLICY "Users can upload own PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chapter-pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own PDFs
CREATE POLICY "Users can view own PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chapter-pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own PDFs
CREATE POLICY "Users can delete own PDFs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chapter-pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  score INTEGER,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- RLS policies for quizzes
CREATE POLICY "Users can view own quizzes"
ON public.quizzes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quizzes"
ON public.quizzes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
ON public.quizzes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes"
ON public.quizzes
FOR DELETE
USING (auth.uid() = user_id);