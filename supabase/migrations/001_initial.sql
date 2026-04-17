-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Sites table
-- Stores multi-tenant site configurations (stored as JSONB).
-- ---------------------------------------------------------------------------
create table sites (
  id         uuid        primary key default uuid_generate_v4(),
  slug       text        unique not null,
  name       text        not null,
  config     jsonb       not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Keywords table
-- Tracks content targets associated with a site.
-- ---------------------------------------------------------------------------
create table keywords (
  id               uuid        primary key default uuid_generate_v4(),
  site_id          uuid        references sites(id) on delete cascade,
  keyword          text        not null,
  status           text        default 'pending'
                               check (status in (
                                 'pending', 'researching', 'writing',
                                 'validating', 'publishing', 'completed', 'failed'
                               )),
  priority         int         default 0,
  notes            text,
  target_word_count int        default 2000,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Jobs table
-- Execution records for the 4-stage pipeline.
-- ---------------------------------------------------------------------------
create table jobs (
  id               uuid        primary key default uuid_generate_v4(),
  keyword_id       uuid        references keywords(id) on delete cascade,
  site_id          uuid        references sites(id) on delete cascade,
  status           text        default 'pending',
  current_stage    text,
  stage_progress   jsonb       default '{}',
  research_output  jsonb,
  article_output   jsonb,
  validated_output jsonb,
  publish_result   jsonb,
  verification_log jsonb       default '[]',
  error            text,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Schedules table
-- Cron-based pipeline scheduling per site.
-- ---------------------------------------------------------------------------
create table schedules (
  id                   uuid        primary key default uuid_generate_v4(),
  site_id              uuid        references sites(id) on delete cascade,
  cron_expression      text        not null,
  description          text,
  max_articles_per_run int         default 1,
  enabled              boolean     default true,
  last_run_at          timestamptz,
  next_run_at          timestamptz,
  created_at           timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_keywords_site_status on keywords(site_id, status);
create index idx_jobs_site_status     on jobs(site_id, status);
create index idx_jobs_keyword         on jobs(keyword_id);
create index idx_schedules_site       on schedules(site_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sites_updated_at
  before update on sites
  for each row execute function update_updated_at();

create trigger keywords_updated_at
  before update on keywords
  for each row execute function update_updated_at();
