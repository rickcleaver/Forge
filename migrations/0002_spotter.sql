create table if not exists spotter_profiles (
  user_id text primary key,
  handle text not null,
  role text not null check (role in ('athlete', 'coach')),
  created_at timestamptz not null default now()
);

create table if not exists spotter_invites (
  code text primary key,
  coach_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists spotter_links (
  id text primary key,
  coach_id text not null,
  athlete_id text not null,
  created_at timestamptz not null default now(),
  unique (coach_id, athlete_id)
);
create index if not exists spotter_links_coach_idx on spotter_links (coach_id);
create index if not exists spotter_links_athlete_idx on spotter_links (athlete_id);

create table if not exists spotter_weeks (
  athlete_id text primary key,
  payload text not null,
  updated_at timestamptz not null default now()
);

create table if not exists spotter_plans (
  athlete_id text primary key,
  coach_id text not null,
  payload text not null,
  created_at timestamptz not null default now()
);

create table if not exists spotter_messages (
  id text primary key,
  coach_id text not null,
  athlete_id text not null,
  sender_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists spotter_messages_pair_idx on spotter_messages (coach_id, athlete_id, created_at);
