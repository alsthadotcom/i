-- Migration: Add profile_picture column to user_info table
-- Run this in Supabase SQL Editor if you have an existing database

-- Add profile_picture column
ALTER TABLE user_info 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_info.profile_picture IS 'URL to user profile picture stored in Supabase Storage';
