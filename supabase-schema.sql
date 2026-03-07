-- ============================================================
-- STREET TASKER — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('customer', 'tasker', 'admin')),
  avatar_url    TEXT,
  bio           TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  skills        TEXT[] DEFAULT '{}',
  rating        NUMERIC(3,1) DEFAULT 0,
  jobs_completed INT DEFAULT 0,
  verified      BOOLEAN DEFAULT FALSE,
  banned        BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TASKS ─────────────────────────────────────────────────────
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  budget      NUMERIC(10,2) NOT NULL,
  location    TEXT NOT NULL,
  deadline    DATE,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','assigned','in_progress','completed','cancelled')),
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  photos      TEXT[] DEFAULT '{}',
  views       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPLICATIONS ─────────────────────────────────────────────
CREATE TABLE applications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tasker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_price NUMERIC(10,2) NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','accepted','rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, tasker_id)
);

-- ── MESSAGES ─────────────────────────────────────────────────
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEWS ──────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, reviewer_id)
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT DEFAULT '',
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CATEGORIES ───────────────────────────────────────────────
CREATE TABLE categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  icon  TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#FF5C28'
);

INSERT INTO categories (name, icon, color) VALUES
  ('Cleaning',        '🧹', '#22C55E'),
  ('Delivery',        '📦', '#3B82F6'),
  ('Errands',         '🛒', '#F59E0B'),
  ('Moving',          '📦', '#8B5CF6'),
  ('Home Repairs',    '🔧', '#EF4444'),
  ('Gardening',       '🌿', '#10B981'),
  ('Tech Help',       '💻', '#6366F1'),
  ('Personal Help',   '🤝', '#EC4899'),
  ('Painting',        '🎨', '#F97316'),
  ('Pet Care',        '🐾', '#14B8A6'),
  ('Cooking',         '🍳', '#EAB308'),
  ('Tutoring',        '📚', '#0EA5E9');

-- ── TRIGGERS — updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── TRIGGER — auto-create profile on signup ──────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'location', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── TRIGGER — update rating on new review ───────────────────
CREATE OR REPLACE FUNCTION update_tasker_rating()
RETURNS TRIGGER AS $$
DECLARE avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating) INTO avg_rating FROM reviews WHERE reviewee_id = NEW.reviewee_id;
  UPDATE profiles SET rating = ROUND(avg_rating::numeric, 1), jobs_completed = jobs_completed + 1
  WHERE id = NEW.reviewee_id;
  UPDATE tasks SET status = 'completed' WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_tasker_rating();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, self write
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_insert"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update"  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tasks: public read, owner write
CREATE POLICY "tasks_public_read"   ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_auth_insert"   ON tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tasks_owner_update"  ON tasks FOR UPDATE USING (
  auth.uid() = created_by OR auth.uid() = assigned_to OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "tasks_owner_delete"  ON tasks FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Applications: tasker can apply, task owner can view
CREATE POLICY "apps_tasker_insert"  ON applications FOR INSERT WITH CHECK (auth.uid() = tasker_id);
CREATE POLICY "apps_read"           ON applications FOR SELECT USING (
  auth.uid() = tasker_id OR
  EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND created_by = auth.uid())
);
CREATE POLICY "apps_task_owner_update" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND created_by = auth.uid())
);

-- Messages: participants only
CREATE POLICY "messages_read"   ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews: public read, reviewer write
CREATE POLICY "reviews_public_read"    ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_reviewer_write" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications: own only
CREATE POLICY "notifs_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifs_service_insert" ON notifications FOR INSERT WITH CHECK (true);

-- Categories: public read
CREATE POLICY "cats_public_read" ON categories FOR SELECT USING (true);

-- ── REALTIME ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- ── STORAGE BUCKETS ──────────────────────────────────────────
-- Run these separately in Supabase Dashboard → Storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('task-photos', 'task-photos', true);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX tasks_status_idx       ON tasks(status);
CREATE INDEX tasks_category_idx     ON tasks(category);
CREATE INDEX tasks_created_by_idx   ON tasks(created_by);
CREATE INDEX apps_task_id_idx       ON applications(task_id);
CREATE INDEX apps_tasker_id_idx     ON applications(tasker_id);
CREATE INDEX messages_task_id_idx   ON messages(task_id);
CREATE INDEX notifs_user_id_idx     ON notifications(user_id);
CREATE INDEX reviews_reviewee_idx   ON reviews(reviewee_id);
