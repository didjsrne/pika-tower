// ====== 리더보드 (Supabase / PostgREST) 서버 전용 헬퍼 ======
// 서버(라우트 핸들러)에서만 사용한다. 키는 클라이언트로 노출되지 않는다.
//
// Vercel Supabase 통합 / Supabase 대시보드가 제공하는 환경변수를 폭넓게 받아준다.
// service_role 키가 있으면 우선 사용(RLS 우회), 없으면 anon 키 + RLS 정책으로 동작한다.
// (라우트 핸들러에서만 import 한다. 키가 클라이언트 번들에 들어가지 않도록 주의.)

export interface LeaderEntry {
  id: number;
  nickname: string;
  floor: number;
  level: number;
  created_at: string;
}

export interface NewScore {
  nickname: string;
  floor: number;
  level: number;
}

const TABLE = "leaderboard";

function getConfig(): { url: string; key: string } | null {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.POSTGRES_URL_NON_POOLING; // 마지막은 거의 안 쓰이지만 안전망
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.startsWith("postgres")) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

// 닉네임 정규화: 제어문자(코드 32 미만 + DEL 127) 제거 → 앞뒤 공백 정리 → 1~12자.
export function sanitizeNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = Array.from(raw)
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c >= 32 && c !== 127;
    })
    .join("")
    .trim();
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, 12);
}

function toPositiveInt(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i >= 1 ? i : null;
}

export function validateScore(body: unknown): NewScore | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const nickname = sanitizeNickname(b.nickname);
  const floor = toPositiveInt(b.floor);
  const level = toPositiveInt(b.level);
  if (!nickname || floor === null || level === null) return null;
  return { nickname, floor, level };
}

// 상위 랭킹 조회 (층 ↓, 레벨 ↓, 먼저 달성 순)
export async function fetchTop(limit = 100): Promise<LeaderEntry[]> {
  const cfg = getConfig();
  if (!cfg) throw new Error("not-configured");
  const params = new URLSearchParams({
    select: "id,nickname,floor,level,created_at",
    order: "floor.desc,level.desc,created_at.asc",
    limit: String(Math.min(Math.max(limit, 1), 200)),
  });
  const res = await fetch(`${cfg.url}/rest/v1/${TABLE}?${params}`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as LeaderEntry[];
}

// 점수 등록 후 삽입된 행 반환
export async function insertScore(score: NewScore): Promise<LeaderEntry> {
  const cfg = getConfig();
  if (!cfg) throw new Error("not-configured");
  const res = await fetch(`${cfg.url}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([score]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as LeaderEntry[];
  return rows[0];
}
