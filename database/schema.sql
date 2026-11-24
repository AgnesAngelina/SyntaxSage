-- Code Explainer AI — PostgreSQL Database Creation Script
-- Run this script against your PostgreSQL database to initialize all tables.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  preferred_explanation_language VARCHAR(50) NOT NULL DEFAULT 'English',
  preferred_level VARCHAR(20) NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_files (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(200) NOT NULL,
  programming_language VARCHAR(50) NOT NULL,
  code_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS explanations (
  id SERIAL PRIMARY KEY,
  file_id INT NOT NULL REFERENCES code_files(id) ON DELETE CASCADE,
  explanation_level VARCHAR(20) DEFAULT 'beginner',
  explanation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id INT REFERENCES code_files(id) ON DELETE CASCADE,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_code_files_project_id ON code_files(project_id);
CREATE INDEX IF NOT EXISTS idx_explanations_file_id ON explanations(file_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_file_id ON chat_messages(file_id);
