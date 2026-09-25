create table if not exists spotter_email_codes (
  email text primary key,
  code text not null,
  created_at timestamptz not null default now()
);
