-- Create tables for flashcards functionality

-- Create the flashcard_sets table
CREATE TABLE IF NOT EXISTS flashcard_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    card_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the flashcard_items table
CREATE TABLE IF NOT EXISTS flashcard_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    position INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    last_reviewed TIMESTAMPTZ,
    confidence_level INTEGER DEFAULT 0, -- 0-5 scale for confidence/familiarity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on set_id for better query performance
CREATE INDEX IF NOT EXISTS flashcard_items_set_id_idx ON flashcard_items(set_id);

-- Create an index on user_id for both tables for better query performance
CREATE INDEX IF NOT EXISTS flashcard_sets_user_id_idx ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS flashcard_items_user_id_idx ON flashcard_items(user_id);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update the updated_at column
CREATE TRIGGER update_flashcard_sets_updated_at
BEFORE UPDATE ON flashcard_sets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_items_updated_at
BEFORE UPDATE ON flashcard_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to auto-update card_count when items are added/removed
CREATE OR REPLACE FUNCTION update_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE flashcard_sets
        SET card_count = card_count + 1
        WHERE id = NEW.set_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE flashcard_sets
        SET card_count = card_count - 1
        WHERE id = OLD.set_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating card count
CREATE TRIGGER update_card_count_insert
AFTER INSERT ON flashcard_items
FOR EACH ROW
EXECUTE FUNCTION update_card_count();

CREATE TRIGGER update_card_count_delete
AFTER DELETE ON flashcard_items
FOR EACH ROW
EXECUTE FUNCTION update_card_count();
