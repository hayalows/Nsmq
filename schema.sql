-- Prepared for a Vercel Marketplace Postgres provider such as Neon.
create table if not exists sources (
  id bigserial primary key,
  url text unique not null,
  publisher text,
  source_tier text not null,
  published_at timestamptz,
  retrieved_at timestamptz default now()
);
create table if not exists schools (
  id bigserial primary key,
  canonical_name text unique not null,
  aliases jsonb default '[]'::jsonb,
  region text
);
create table if not exists seasons (
  year int primary key,
  competition_held boolean default true,
  champion_school_id bigint references schools(id),
  notes text
);
create table if not exists contests (
  id bigserial primary key,
  season_year int references seasons(year),
  stage text not null,
  contest_date date,
  venue text,
  source_id bigint references sources(id),
  confidence text default 'partial'
);
create table if not exists contest_entries (
  contest_id bigint references contests(id) on delete cascade,
  school_id bigint references schools(id),
  finishing_position int,
  final_score numeric,
  primary key(contest_id, school_id)
);
create table if not exists round_scores (
  contest_id bigint references contests(id) on delete cascade,
  school_id bigint references schools(id),
  round_no int check(round_no between 1 and 5),
  cumulative_score numeric,
  raw_round_score numeric,
  source_id bigint references sources(id),
  primary key(contest_id, school_id, round_no)
);
create table if not exists contestants (
  id bigserial primary key,
  display_name text not null
);
create table if not exists appearances (
  contest_id bigint references contests(id) on delete cascade,
  school_id bigint references schools(id),
  contestant_id bigint references contestants(id),
  role text,
  entered_round int,
  left_round int,
  source_id bigint references sources(id)
);
create table if not exists model_snapshots (
  id bigserial primary key,
  as_of_date date not null,
  model_version text not null,
  features jsonb not null,
  metrics jsonb,
  created_at timestamptz default now()
);