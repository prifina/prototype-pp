-- Add payload column to message_log table for storing additional metadata
ALTER TABLE public.message_log 
ADD COLUMN payload jsonb DEFAULT '{}'::jsonb;