-- Cartograph: Initial Schema
-- Run this in the Supabase SQL editor after creating your project

create extension if not exists "uuid-ossp";

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table articles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  body text not null,
  summary text,
  created_at timestamptz default now()
);

create table tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  color text not null default '#6366f1',
  unique(user_id, name)
);

create table article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references articles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  body text not null,
  created_at timestamptz default now()
);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

alter table articles enable row level security;
alter table tags enable row level security;
alter table article_tags enable row level security;
alter table comments enable row level security;

-- Articles: users own their rows
create policy "articles: select own" on articles for select using (auth.uid() = user_id);
create policy "articles: insert own" on articles for insert with check (auth.uid() = user_id);
create policy "articles: update own" on articles for update using (auth.uid() = user_id);
create policy "articles: delete own" on articles for delete using (auth.uid() = user_id);

-- Tags: users own their rows
create policy "tags: select own" on tags for select using (auth.uid() = user_id);
create policy "tags: insert own" on tags for insert with check (auth.uid() = user_id);
create policy "tags: update own" on tags for update using (auth.uid() = user_id);
create policy "tags: delete own" on tags for delete using (auth.uid() = user_id);

-- Article-tags: scoped via owning article
create policy "article_tags: select own" on article_tags for select using (
  exists (select 1 from articles where id = article_id and user_id = auth.uid())
);
create policy "article_tags: insert own" on article_tags for insert with check (
  exists (select 1 from articles where id = article_id and user_id = auth.uid())
);
create policy "article_tags: delete own" on article_tags for delete using (
  exists (select 1 from articles where id = article_id and user_id = auth.uid())
);

-- Comments: users own their rows
create policy "comments: select own" on comments for select using (auth.uid() = user_id);
create policy "comments: insert own" on comments for insert with check (auth.uid() = user_id);
create policy "comments: delete own" on comments for delete using (auth.uid() = user_id);
