/*
  # Ajout des likes et commentaires

  1. Nouvelles tables
    - `session_likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers users)
      - `session_id` (uuid, foreign key vers surf_sessions)
      - `created_at` (timestamp)
    - `session_comments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers users)
      - `session_id` (uuid, foreign key vers surf_sessions)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur les deux tables
    - Politiques pour permettre aux utilisateurs authentifiés de liker/commenter
    - Politiques pour permettre aux utilisateurs de supprimer leurs propres likes/commentaires

  3. Index
    - Index sur session_id pour les deux tables pour optimiser les requêtes
    - Index unique sur (user_id, session_id) pour session_likes pour éviter les doublons
*/

-- Table des likes
CREATE TABLE IF NOT EXISTS session_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES surf_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, session_id)
);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS session_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES surf_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_session_likes_session_id ON session_likes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_likes_user_session ON session_likes(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_session_id ON session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_created_at ON session_comments(created_at);

-- Enable RLS
ALTER TABLE session_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les likes
CREATE POLICY "Users can view all likes"
    ON session_likes
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own likes"
    ON session_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON session_likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Politiques RLS pour les commentaires
CREATE POLICY "Users can view all comments"
    ON session_comments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own comments"
    ON session_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON session_comments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON session_comments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger pour updated_at sur les commentaires
CREATE TRIGGER update_session_comments_updated_at 
    BEFORE UPDATE ON session_comments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();