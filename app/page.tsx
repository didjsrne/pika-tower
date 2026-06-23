"use client";

import { useEffect, useRef, useState } from "react";
import GameBoy from "@/components/GameBoy";
import Screen from "@/components/Screen";
import BgmManager from "@/components/BgmManager";
import NameGate from "@/components/NameGate";
import LeaderBoard from "@/components/LeaderBoard";
import { useGameEngine } from "@/hooks/useGameEngine";

export default function Home() {
  const [booted, setBooted] = useState(false);
  // 게임 키 입력은 시작 게이트(닉네임 입력)가 닫힌 뒤에만 활성화한다.
  const { state, input, bagEntries, setNickname } = useGameEngine(booted);
  const [lbOpen, setLbOpen] = useState(false);

  // 게임오버로 점수 등록이 끝나면 리더보드를 한 번 자동으로 띄운다.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (state.phase !== "gameover") {
      autoOpened.current = false;
      return;
    }
    if (state.submitState === "saved" && !autoOpened.current) {
      autoOpened.current = true;
      setLbOpen(true);
    }
  }, [state.phase, state.submitState]);

  return (
    <main className="w-full flex justify-center">
      <GameBoy
        onInput={input}
        footer={
          <button
            type="button"
            onClick={() => setLbOpen(true)}
            className="px-4 py-2 rounded-full bg-[#0f380f] text-[#9bbc0f] text-sm font-black active:scale-95 transition shadow"
          >
            🏆 리더보드
          </button>
        }
      >
        <Screen s={state} bagEntries={bagEntries()} />
      </GameBoy>

      <BgmManager state={state} unlocked={booted} />

      {!booted && (
        <NameGate
          onStart={(name) => {
            setNickname(name);
            setBooted(true);
          }}
        />
      )}

      <LeaderBoard
        open={lbOpen}
        onClose={() => setLbOpen(false)}
        highlightId={state.lastEntryId}
      />
    </main>
  );
}
