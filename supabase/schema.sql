-- ==========================================
-- KANBANKU — SUPABASE DATABASE SCHEMA & RLS
-- ==========================================

-- 1. BOARDS TABLE
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LISTS (COLUMNS) TABLE
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CARDS TABLE
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LABELS TABLE
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6'
);

-- 5. CARD_LABELS (MANY-TO-MANY)
CREATE TABLE IF NOT EXISTS card_labels (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- 6. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id);

-- ==========================================
-- TRIGGER: AUTO-UPDATE UPDATED_AT ON CARDS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cards_updated_at ON cards;
CREATE TRIGGER trigger_cards_updated_at
BEFORE UPDATE ON cards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- BOARDS POLICIES
DROP POLICY IF EXISTS "Users can manage their own boards" ON boards;
CREATE POLICY "Users can manage their own boards"
ON boards FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- LISTS POLICIES
DROP POLICY IF EXISTS "Users can manage lists in their boards" ON lists;
CREATE POLICY "Users can manage lists in their boards"
ON lists FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM boards
    WHERE boards.id = lists.board_id
      AND boards.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boards
    WHERE boards.id = lists.board_id
      AND boards.user_id = auth.uid()
  )
);

-- CARDS POLICIES
DROP POLICY IF EXISTS "Users can manage cards in their boards" ON cards;
CREATE POLICY "Users can manage cards in their boards"
ON cards FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lists
    JOIN boards ON boards.id = lists.board_id
    WHERE lists.id = cards.list_id
      AND boards.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lists
    JOIN boards ON boards.id = lists.board_id
    WHERE lists.id = cards.list_id
      AND boards.user_id = auth.uid()
  )
);

-- LABELS POLICIES
DROP POLICY IF EXISTS "Users can manage their own labels" ON labels;
CREATE POLICY "Users can manage their own labels"
ON labels FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CARD_LABELS POLICIES
DROP POLICY IF EXISTS "Users can manage labels on their cards" ON card_labels;
CREATE POLICY "Users can manage labels on their cards"
ON card_labels FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cards
    JOIN lists ON lists.id = cards.list_id
    JOIN boards ON boards.id = lists.board_id
    WHERE cards.id = card_labels.card_id
      AND boards.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cards
    JOIN lists ON lists.id = cards.list_id
    JOIN boards ON boards.id = lists.board_id
    WHERE cards.id = card_labels.card_id
      AND boards.user_id = auth.uid()
  )
);

-- COMMENTS POLICIES
DROP POLICY IF EXISTS "Users can manage comments on their cards" ON comments;
CREATE POLICY "Users can manage comments on their cards"
ON comments FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- MIGRATION: SOFT DELETE (ARCHIVED_AT)
-- ==========================================
-- To enable soft-deleting cards and lists without losing data:
-- Run this block in the Supabase SQL Editor:
ALTER TABLE cards ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE lists ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Rollback script:
-- ALTER TABLE cards DROP COLUMN IF EXISTS archived_at;
-- ALTER TABLE lists DROP COLUMN IF EXISTS archived_at;

-- ==========================================
-- MIGRATION: LIST ENHANCEMENTS (WIP LIMIT, COLOR, COLLAPSE)
-- ==========================================
ALTER TABLE lists ADD COLUMN IF NOT EXISTS wip_limit INTEGER DEFAULT NULL;
ALTER TABLE lists ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;
ALTER TABLE lists ADD COLUMN IF NOT EXISTS is_collapsed BOOLEAN DEFAULT FALSE;

-- Rollback script:
-- ALTER TABLE lists DROP COLUMN IF EXISTS wip_limit;
-- ALTER TABLE lists DROP COLUMN IF EXISTS color;
-- ALTER TABLE lists DROP COLUMN IF EXISTS is_collapsed;
