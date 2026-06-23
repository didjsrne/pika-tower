import { NextResponse } from "next/server";
import {
  fetchTop,
  insertScore,
  validateScore,
  isConfigured,
} from "@/lib/leaderboard";

// 항상 동적으로 실행 (정적 캐시 방지)
export const dynamic = "force-dynamic";

// GET /api/leaderboard?limit=100  → 상위 랭킹
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "not-configured" },
      { status: 503 },
    );
  }
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  try {
    const entries = await fetchTop(Number.isFinite(limit) ? limit : 100);
    return NextResponse.json({ ok: true, entries });
  } catch (e) {
    console.error("[leaderboard] GET 실패:", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

// POST /api/leaderboard  body: { nickname, floor, level } → 점수 등록
export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "not-configured" },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }

  const score = validateScore(body);
  if (!score) {
    return NextResponse.json(
      { ok: false, error: "invalid" },
      { status: 400 },
    );
  }

  try {
    const entry = await insertScore(score);
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (e) {
    console.error("[leaderboard] POST 실패:", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
