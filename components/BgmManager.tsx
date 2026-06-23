"use client";

import { useEffect, useRef, useState } from "react";
import type { GameState } from "@/hooks/useGameEngine";
import { isBossFloor } from "@/lib/data";

// 게임 상태 → 재생할 트랙(public/bgm/*.mp3) 매핑.
const TRACKS = {
  title: "/bgm/title.mp3",
  battleWild: "/bgm/battle-wild.mp3",
  battleBoss: "/bgm/battle-boss.mp3",
  victoryWild: "/bgm/victory-wild.mp3",
  victoryBoss: "/bgm/victory-boss.mp3",
  shop: "/bgm/shop.mp3",
} as const;

// 현재 상태에 맞는 트랙 URL을 고른다. null = 무음.
function pickTrack(s: GameState): string | null {
  switch (s.phase) {
    case "start":
      return TRACKS.title;
    case "shop":
      return TRACKS.shop;
    case "gameover":
      return null; // 게임오버 전용 트랙 없음 → 무음
    case "battle": {
      const e = s.enemy;
      // 적 로딩 중에는 층 정보로 보스 여부를 판단해 전투곡을 미리 건다.
      if (!e) return isBossFloor(s.floor) ? TRACKS.battleBoss : TRACKS.battleWild;
      // 적 HP가 0이면 승리 시퀀스 → 승리곡.
      if (e.hp <= 0) return e.isBoss ? TRACKS.victoryBoss : TRACKS.victoryWild;
      return e.isBoss ? TRACKS.battleBoss : TRACKS.battleWild;
    }
    default:
      return null;
  }
}

// unlocked: 시작 게이트(NameGate)에서 닉네임을 입력해 시작한 뒤 true가 된다.
// 자동재생 정책상 그 전에는 재생을 시도하지 않는다.
export default function BgmManager({
  state,
  unlocked,
}: {
  state: GameState;
  unlocked: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  const desired = pickTrack(state);

  // 오디오 엘리먼트 1개 생성 후 재사용.
  useEffect(() => {
    const a = new Audio();
    a.loop = true;
    a.volume = 0.35;
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, []);

  // 원하는 트랙/음소거/잠금 상태가 바뀌면 재생을 갱신.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !unlocked) return;

    if (muted || desired === null) {
      a.pause();
      return;
    }

    const abs = new URL(desired, window.location.href).href;
    if (a.src !== abs) {
      a.src = desired; // 다른 곡일 때만 교체 → 같은 곡은 끊김 없이 유지
    }
    void a.play().catch(() => {
      /* 자동재생 거부 등은 조용히 무시 */
    });
  }, [desired, muted, unlocked]);

  return (
    <button
      type="button"
      onClick={() => setMuted((m) => !m)}
      aria-label={muted ? "음악 켜기" : "음악 끄기"}
      className="fixed top-3 right-3 z-50 w-10 h-10 rounded-full bg-black/55 text-white text-lg leading-none flex items-center justify-center shadow-md backdrop-blur-sm active:scale-95 transition"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
