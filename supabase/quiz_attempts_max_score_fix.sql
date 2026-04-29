-- Add missing quiz_attempts.max_score column (safe to run multiple times).
-- Run this in Supabase SQL Editor.

alter table if exists public.quiz_attempts
  add column if not exists max_score int default 0;

