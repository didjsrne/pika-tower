"use client";

import { useState } from "react";

// 시작 게이트: 닉네임을 입력받는다.
// 이 입력(폼 제출/탭)이 첫 사용자 제스처가 되어 오디오 잠금도 함께 해제된다.
// 게임 엔진의 키보드 바인딩은 booted 전까지 비활성(enabled=false)이라
// 여기서 타이핑하는 키가 게임 입력으로 새지 않는다.
export default function NameGate({
  onStart,
}: {
  onStart: (nickname: string) => void;
}) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const valid = trimmed.length >= 1;

  const submit = () => {
    if (!valid) return;
    onStart(trimmed.slice(0, 12));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-sm text-white select-none px-6 text-center">
      <div className="text-5xl">⚡</div>
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">피카타워</h1>
        <p className="text-xs opacity-70">무한 등정 로그라이크</p>
      </div>

      <form
        className="flex flex-col items-center gap-3 w-full max-w-[260px]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="text-sm font-bold" htmlFor="nickname">
          닉네임을 입력하세요
        </label>
        <input
          id="nickname"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          placeholder="최대 12자"
          className="w-full px-4 py-3 rounded-lg bg-white/95 text-black text-center text-lg font-black outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={!valid}
          className="w-full px-4 py-3 rounded-lg bg-yellow-400 text-black font-black text-lg active:scale-95 transition disabled:opacity-40 disabled:active:scale-100"
        >
          시작하기
        </button>
      </form>

      <p className="text-[11px] opacity-60 leading-relaxed">
        사운드와 함께 플레이됩니다 · 기록은 리더보드에 저장돼요
      </p>
    </div>
  );
}
