-- Base Insiders launch schema. Apply in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique check (wallet_address ~ '^0x[a-f0-9]{40}$'),
  display_name text,
  handle text,
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  farcaster_fid bigint unique,
  x_username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_nonces (
  id uuid primary key default gen_random_uuid(),
  address text not null check (address ~ '^0x[a-f0-9]{40}$'),
  nonce text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists auth_nonces_active_idx on auth_nonces (address, nonce, expires_at) where used_at is null;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_address text not null references profiles(wallet_address) on delete cascade,
  body text not null default '' check (char_length(body) <= 5000),
  image_url text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(body)) > 0 or image_url is not null)
);
create index if not exists posts_feed_idx on posts (created_at desc) where not is_deleted;

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_address text not null references profiles(wallet_address) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on comments (post_id, created_at) where not is_deleted;

create table if not exists post_reactions (
  post_id uuid not null references posts(id) on delete cascade,
  actor_address text not null references profiles(wallet_address) on delete cascade,
  emoji text not null check (char_length(emoji) <= 16),
  created_at timestamptz not null default now(),
  primary key (post_id, actor_address)
);

create table if not exists follows (
  follower_address text not null references profiles(wallet_address) on delete cascade,
  following_address text not null references profiles(wallet_address) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_address, following_address),
  check (follower_address <> following_address)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  reward_xp integer not null check (reward_xp > 0),
  verification_type text not null check (verification_type in ('manual_review', 'onchain', 'partner_api')),
  target_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists task_claims (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  claimant_address text not null references profiles(wallet_address) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verification_data jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by text references profiles(wallet_address),
  created_at timestamptz not null default now(),
  unique (task_id, claimant_address)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_address text not null references profiles(wallet_address) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewer_address text references profiles(wallet_address),
  resolution_note text,
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

-- The app uses a server-side service role; clients receive no database key.
-- Keep RLS enabled so future direct client access cannot expose community data.
alter table profiles enable row level security;
alter table auth_nonces enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table post_reactions enable row level security;
alter table follows enable row level security;
alter table tasks enable row level security;
alter table task_claims enable row level security;
alter table reports enable row level security;
