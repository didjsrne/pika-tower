"use client";

import { useEffect } from "react";

// 첫 사용자 입력을 받아 오디오를 잠금해제하기 위한 시작 게이트.
// 자동재생 정책상 음악은 사용자 제스처 후에만 재생되므로, 이 한 번의 입력으로
// 타이틀 BGM을 켜고 타이틀 화면을 보여준 뒤, 실제 게임은 이후 A 입력으로 시작한다.
//
// 중요: 이 첫 입력이 게임 엔진(window keydown)까지 흘러가면 A가 곧장 게임을
// 시작시켜 버린다. 그래서 캡처 단계에서 가로채 stopImmediatePropagation 으로
// 다른 window 리스너(게임 입력)에 닿지 않게 막는다.
export default function BootGate({ onBoot }: { onBoot: () => void }) {
  useEffect(() => {
    const handler = (e: Event) => {
      if (e.type === "keydown") e.preventDefault();
      e.stopImmediatePropagation();
      onBoot();
    };
    const opts = { capture: true } as const;
    window.addEventListener("keydown", handler, opts);
    window.addEventListener("pointerdown", handler, opts);
    return () => {
      window.removeEventListener("keydown", handler, opts);
      window.removeEventListener("pointerdown", handler, opts);
    };
  }, [onBoot]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm text-white cursor-pointer select-none px-6 text-center"
      role="button"
      aria-label="탭하여 시작"
    >
      <div className="text-5xl animate-bounce">🔊</div>
      <p className="text-lg font-black tracking-wide">탭 또는 아무 키나 눌러 시작</p>
      <p className="text-xs opacity-70 leading-relaxed">
        사운드와 함께 플레이하려면 한 번의 입력이 필요해요
      </p>
    </div>
  );
}
