"use client";

import { useCallback, useEffect, useState } from "react";

interface LeaderEntry {
  id: number;
  nickname: string;
  floor: number;
  level: number;
  created_at: string;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ok"; entries: LeaderEntry[] }
  | { kind: "not-configured" }
  | { kind: "error" };

const medal = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;

// 리더보드 모달. open 될 때마다 최신 랭킹을 다시 불러온다.
// highlightId: 방금 등록한 내 기록을 강조 표시한다.
export default function LeaderBoard({
  open,
  onClose,
  highlightId = null,
}: {
  open: boolean;
  onClose: () => void;
  highlightId?: number | null;
}) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/leaderboard?limit=100", {
        cache: "no-store",
      });
      if (res.status === 503) {
        setState({ kind: "not-configured" });
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && Array.isArray(data.entries)) {
        setState({ kind: "ok", entries: data.entries });
      } else {
        setState({ kind: "error" });
      }
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] max-h-[80vh] flex flex-col bg-[#f8f8f8] text-[#0f380f] rounded-xl border-4 border-[#0f380f] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f380f] text-[#9bbc0f]">
          <h2 className="text-lg font-black tracking-wide">🏆 리더보드</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full bg-white/15 text-white text-lg leading-none active:scale-95 transition"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-grow overflow-y-auto">
          {state.kind === "loading" && (
            <p className="text-center py-10 font-bold opacity-70">
              불러오는 중...
            </p>
          )}

          {state.kind === "not-configured" && (
            <div className="text-center py-10 px-6 font-bold opacity-80 leading-relaxed text-sm">
              리더보드가 아직 연결되지 않았어요.
              <br />
              Supabase 연동 후 이용할 수 있습니다.
            </div>
          )}

          {state.kind === "error" && (
            <div className="text-center py-10 px-6">
              <p className="font-bold opacity-80 mb-3">불러오지 못했어요.</p>
              <button
                type="button"
                onClick={load}
                className="px-4 py-2 rounded-lg bg-[#0f380f] text-[#9bbc0f] font-black text-sm active:scale-95 transition"
              >
                다시 시도
              </button>
            </div>
          )}

          {state.kind === "ok" && state.entries.length === 0 && (
            <p className="text-center py-10 font-bold opacity-70">
              아직 기록이 없어요. 첫 주인공이 되어보세요!
            </p>
          )}

          {state.kind === "ok" && state.entries.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[#0f380f]/60 border-b-2 border-[#0f380f]/20">
                  <th className="py-2 pl-4 text-left w-12">#</th>
                  <th className="py-2 text-left">닉네임</th>
                  <th className="py-2 text-right">층</th>
                  <th className="py-2 pr-4 text-right">Lv</th>
                </tr>
              </thead>
              <tbody>
                {state.entries.map((e, i) => {
                  const mine = highlightId !== null && e.id === highlightId;
                  return (
                    <tr
                      key={e.id}
                      className={`border-b border-[#0f380f]/10 ${
                        mine ? "bg-yellow-300/60 font-black" : ""
                      }`}
                    >
                      <td className="py-2 pl-4 text-left tabular-nums">
                        {medal(i + 1)}
                      </td>
                      <td className="py-2 font-bold truncate max-w-[140px]">
                        {e.nickname}
                        {mine && (
                          <span className="ml-1 text-[10px] text-[#8b1d44]">
                            (나)
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums">{e.floor}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {e.level}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
