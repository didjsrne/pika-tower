"use client";

import type { ReactNode } from "react";
import type { InputAction } from "@/hooks/useGameEngine";

function DPad({ onInput }: { onInput: (a: InputAction) => void }) {
  const press = (a: InputAction) => (e: React.MouseEvent) => {
    e.preventDefault();
    onInput(a);
  };
  const S = 96; // 전체 크기
  const A = 32; // 팔 두께
  return (
    <div className="relative" style={{ width: S, height: S }}>
      {/* 십자 형태 바 */}
      <div className="dpad-btn" style={{ left: A, top: 0, width: A, height: S, borderRadius: 7 }} />
      <div className="dpad-btn" style={{ left: 0, top: A, width: S, height: A, borderRadius: 7 }} />
      {/* 클릭 영역 */}
      <button aria-label="위" onClick={press("up")} className="dpad-btn" style={{ left: A, top: 0, width: A, height: A, borderRadius: 7 }} />
      <button aria-label="아래" onClick={press("down")} className="dpad-btn" style={{ left: A, top: S - A, width: A, height: A, borderRadius: 7 }} />
      <button aria-label="왼쪽" onClick={press("left")} className="dpad-btn" style={{ left: 0, top: A, width: A, height: A, borderRadius: 7 }} />
      <button aria-label="오른쪽" onClick={press("right")} className="dpad-btn" style={{ left: S - A, top: A, width: A, height: A, borderRadius: 7 }} />
      {/* 가운데 음각 */}
      <div className="absolute bg-black/40" style={{ left: A + 4, top: A + 4, width: A - 8, height: A - 8, borderRadius: "50%" }} />
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-600 rounded-full" style={{ width: 46, height: 13, boxShadow: "1px 2px 0 rgba(0,0,0,0.25)" }} />
      <p className="text-[10px] text-[#3b3b7a] font-black mt-1.5 tracking-wide">{label}</p>
    </div>
  );
}

export default function GameBoy({
  onInput,
  children,
}: {
  onInput: (a: InputAction) => void;
  children: ReactNode;
}) {
  const press = (a: InputAction) => (e: React.MouseEvent) => {
    e.preventDefault();
    onInput(a);
  };
  return (
    <div className="gb-body w-full max-w-[580px]">
      {/* ---- 화면 베젤 ---- */}
      <div className="gb-screen-frame">
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500/80" />
          <span className="text-[8px] text-gray-400 font-bold tracking-[0.15em]">
            DOT MATRIX WITH STEREO SOUND
          </span>
        </div>
        {/* 화면 높이는 aspect-ratio로만 결정되고, 내용은 absolute 레이어로 띄워
            어떤 화면/메뉴에서도 게임보이 크기가 변하지 않게 한다. */}
        <div className="gb-screen">
          <div className="absolute inset-0 p-3 flex flex-col overflow-hidden">{children}</div>
        </div>
      </div>

      {/* ---- 브랜드 각인 ---- */}
      <div className="flex items-end justify-center gap-1.5 mb-7 select-none">
        <span className="text-[#1b1b6f] font-black italic text-[15px] leading-none">Nintendo</span>
        <span className="text-[#1b1b6f] font-black text-[22px] leading-none tracking-tight">GAME BOY</span>
        <span className="text-[#1b1b6f] text-[9px] leading-none mb-2">™</span>
      </div>

      {/* ---- 컨트롤 데크 ---- */}
      <div className="relative px-1">
        <div className="flex justify-between items-start">
          <DPad onInput={onInput} />

          {/* A · B (대각 배치, A가 우상단) */}
          <div className="flex gap-6 pt-3" style={{ transform: "rotate(-25deg)" }}>
            <div className="flex flex-col items-center">
              <button onClick={press("b")} className="btn-circle" aria-label="B 취소" />
              <p className="text-[13px] text-[#3b3b7a] font-black mt-2">B</p>
            </div>
            <div className="flex flex-col items-center">
              <button onClick={press("a")} className="btn-circle" aria-label="A 선택" />
              <p className="text-[13px] text-[#3b3b7a] font-black mt-2">A</p>
            </div>
          </div>
        </div>

        {/* SELECT · START (가운데 아래, 대각) */}
        <div className="flex justify-center gap-7 mt-9" style={{ transform: "rotate(-25deg)" }}>
          <Pill label="SELECT" />
          <Pill label="START" />
        </div>
      </div>

      {/* ---- 스피커 그릴 ---- */}
      <div
        className="ml-auto mt-8 mr-2"
        style={{
          width: 90,
          height: 46,
          transform: "rotate(-25deg)",
          background:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.18) 0 3px, transparent 3px 9px)",
          borderRadius: 4,
        }}
      />

      <p className="text-center text-[10px] text-gray-700 font-bold mt-2">
        방향키 이동 · <span className="text-gb-dark">A</span> 선택 ·{" "}
        <span className="text-gb-dark">B</span> 취소
      </p>
    </div>
  );
}
