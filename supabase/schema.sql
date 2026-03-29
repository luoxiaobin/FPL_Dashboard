-- ==========================================
-- FPL Dashboard PostgreSQL Schema for Supabase
-- Run this in the Supabase SQL Editor
-- ==========================================

-- 1. Create User table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpl_entry_id BIGINT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create Enums for Players
CREATE TYPE player_position AS ENUM ('GKP', 'DEF', 'MID', 'FWD');
CREATE TYPE player_status AS ENUM ('Available', 'Injured', 'Suspended', 'Unavailable');

-- 3. Create Player table (Stores the global list of Premier League players)
CREATE TABLE IF NOT EXISTS public.players (
  id BIGINT PRIMARY KEY, -- Official FPL Player ID
  web_name TEXT NOT NULL,
  position player_position NOT NULL,
  current_price DECIMAL(4,1) NOT NULL,
  status player_status NOT NULL DEFAULT 'Available',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Create Gameweeks table
CREATE TABLE IF NOT EXISTS public.gameweeks (
  id INT PRIMARY KEY, -- 1 to 38
  deadline_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  is_next BOOLEAN DEFAULT FALSE
);

-- 5. Create Squads table (A User's squad at a specific gameweek)
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gameweek_id INT NOT NULL REFERENCES public.gameweeks(id) ON DELETE CASCADE,
  bank_balance DECIMAL(4,1) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, gameweek_id) -- A user only has one squad state per gameweek
);

-- 6. Create Squad_Players table (Many-to-Many mapping holding 15 players per squad)
CREATE TABLE IF NOT EXISTS public.squad_players (
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  multiplier INT NOT NULL DEFAULT 1, -- 1 = standard, 2 = captain, 3 = triple captain, 0 = bench
  is_vice_captain BOOLEAN DEFAULT FALSE,
  pitch_position INT NOT NULL, -- 1 to 15 (1-11 are starters, 12-15 are bench)
  PRIMARY KEY (squad_id, player_id)
);

-- Enable Row Level Security (RLS) for security best practices
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_players ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads to public data, but authenticate users later
CREATE POLICY "Allow public read access" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.gameweeks FOR SELECT USING (true);
