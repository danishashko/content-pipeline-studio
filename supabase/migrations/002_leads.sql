CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  articles_generated integer DEFAULT 0,
  max_articles integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
