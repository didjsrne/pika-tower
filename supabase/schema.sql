-- 피카타워 리더보드 테이블
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.leaderboard (
  id          bigint generated always as identity primary key,
  nickname    text        not null check (char_length(nickname) between 1 and 12),
  floor       int         not null check (floor >= 1),
  level       int         not null check (level >= 1),
  created_at  timestamptz not null default now()
);

-- 랭킹 정렬용 인덱스 (층 내림차순 → 레벨 내림차순 → 먼저 달성한 순)
create index if not exists leaderboard_rank_idx
  on public.leaderboard (floor desc, level desc, created_at asc);

-- RLS: anon 키만으로 읽기/쓰기가 동작하도록 정책을 연다.
-- (service_role 키를 쓰면 RLS를 우회하므로 이 정책 없이도 동작한다.)
alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard public read" on public.leaderboard;
create policy "leaderboard public read"
  on public.leaderboard for select
  using (true);

drop policy if exists "leaderboard public insert" on public.leaderboard;
create policy "leaderboard public insert"
  on public.leaderboard for insert
  with check (
    char_length(nickname) between 1 and 12
    and floor >= 1
    and level >= 1
  );
