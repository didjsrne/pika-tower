"use client";

import type { GameState } from "@/hooks/useGameEngine";
import { MOVE_DATA, ITEMS, PIKACHU_FRONT, PIKACHU_BACK, expToNext } from "@/lib/data";

const MAIN_MENU = ["싸운다", "가방", "정보", "도망"];

function hpColor(ratio: number) {
  if (ratio > 0.5) return "#5d8110";
  if (ratio > 0.2) return "#c9a227";
  return "#b03030";
}

function HpBar({ hp, maxHp, align = "left" }: { hp: number; maxHp: number; align?: "left" | "right" }) {
  const ratio = Math.max(0, hp / maxHp);
  return (
    <div className={`hp-bar-bg w-full ${align === "right" ? "ml-auto" : ""}`} style={{ maxWidth: 150 }}>
      <div className="hp-bar-fill" style={{ width: `${ratio * 100}%`, backgroundColor: hpColor(ratio) }} />
    </div>
  );
}

function TypeBadges({ types }: { types: string[] }) {
  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {types.map((t) => (
        <span key={t} className="text-[10px] bg-black/15 px-2 py-0.5 rounded uppercase font-black leading-none">
          {t}
        </span>
      ))}
    </div>
  );
}

/* ---------------- 시작 화면 ---------------- */
function StartView({ best, nickname }: { best: number; nickname: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h1 className="title-logo mb-2">피카타워</h1>
      <p className="text-[14px] text-black font-extrabold mb-4">무한 등정 로그라이크</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PIKACHU_FRONT} alt="피카츄" className="w-32 h-32 mb-3 drop-shadow-lg pixelated" />
      {nickname && <p className="text-[14px] text-black font-black mb-1">플레이어: {nickname}</p>}
      {best > 0 && <p className="text-[13px] text-black font-bold mb-2">최고 기록: {best}층</p>}
      <p className="text-[14px] animate-bounce text-black font-bold">A 버튼을 눌러 시작!</p>
    </div>
  );
}

/* ---------------- 하단 메뉴 (고정 높이) ---------------- */
const BOTTOM_H = "h-[92px]";

function BottomBox({ s, bagEntries }: { s: GameState; bagEntries: typeof ITEMS }) {
  // 애니메이션/로딩 중에는 메시지만 표시
  if (s.isAnimating || s.loading) {
    return (
      <div className={`gb-box p-3 text-[14px] ${BOTTOM_H} overflow-hidden flex items-center justify-center text-center whitespace-pre-line leading-snug`}>
        {s.message}
      </div>
    );
  }

  if (s.battleMenu === "main") {
    return (
      <div className={`gb-box p-3 ${BOTTOM_H} overflow-hidden flex gap-3 text-[14px]`}>
        <div className="flex-1 flex items-center whitespace-pre-line leading-snug overflow-hidden">{s.message}</div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 self-center shrink-0">
          {MAIN_MENU.map((label, i) => (
            <span key={label} className={`menu-item font-black ${s.cursor === i ? "selected" : ""}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (s.battleMenu === "fight") {
    const mv = MOVE_DATA[s.cursor];
    return (
      <div className={`gb-box p-3 ${BOTTOM_H} overflow-hidden flex flex-col justify-center text-[14px]`}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2">
          {MOVE_DATA.map((m, i) => (
            <span key={m.name} className={`menu-item font-black truncate ${s.cursor === i ? "selected" : ""}`}>
              {m.name}
            </span>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gb-dark/30 flex justify-between text-[11px] font-bold">
          <span>위력 {mv.power} · {mv.label}</span>
          <span className="opacity-70">B: 뒤로</span>
        </div>
      </div>
    );
  }

  // bag
  return (
    <div className={`gb-box p-3 ${BOTTOM_H} overflow-hidden flex flex-col text-[14px]`}>
      {bagEntries.length === 0 ? (
        <div className="flex items-center justify-center flex-grow">가방이 비어 있다!</div>
      ) : (
        <div className="flex-grow overflow-hidden">
          {bagEntries.map((it, i) => (
            <div key={it.id} className={`menu-item font-black flex justify-between ${s.cursor === i ? "selected" : ""}`}>
              <span>{it.name}</span>
              <span className="opacity-70">x{s.player.bag[it.id] ?? 0}</span>
            </div>
          ))}
        </div>
      )}
      <div className="pt-1 border-t border-gb-dark/30 text-right text-[11px] opacity-70 font-bold shrink-0">B: 뒤로</div>
    </div>
  );
}

/* ---------------- 전투 화면 ---------------- */
function BattleView({ s, bagEntries }: { s: GameState; bagEntries: typeof ITEMS }) {
  const e = s.enemy;
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between text-[14px] mb-2 border-b-2 border-black/20 pb-1 font-black shrink-0">
        <span>{s.floor}층{e?.isBoss ? " ★BOSS" : ""}</span>
        <span>자금 ${s.money}</span>
      </div>

      {s.banner && (
        <div className="text-center text-[13px] font-black text-[#b03030] animate-blink mb-1 shrink-0">{s.banner}</div>
      )}

      <div className="flex-grow flex flex-col justify-between min-h-0 overflow-hidden py-1">
        {/* 적 */}
        <div className="flex justify-start items-start">
          <div className="w-1/2 bg-black/5 p-2 rounded">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-black truncate">{e?.name ?? "???"}</p>
              {e?.status === "paralyzed" && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gb-dark text-gb-light rounded font-black">마비</span>
              )}
            </div>
            <p className="text-[12px] mt-0.5">Lv {e?.lv ?? "?"}</p>
            {e && <HpBar hp={e.hp} maxHp={e.maxHp} />}
            {e && <TypeBadges types={e.types} />}
          </div>
          {e && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={e.sprite}
              alt={e.name}
              className={`w-32 h-32 ml-auto object-contain pixelated ${s.shakeEnemy ? "animate-shake" : ""}`}
            />
          )}
        </div>

        {/* 플레이어 */}
        <div className="flex justify-end items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PIKACHU_BACK}
            alt="피카츄"
            className={`w-36 h-36 mr-auto object-contain pixelated ${s.shakePlayer ? "animate-shake" : ""}`}
          />
          <div className="w-1/2 text-right bg-black/5 p-2 rounded">
            <p className="text-[15px] font-black">피카츄</p>
            <p className="text-[12px] mt-0.5">Lv {s.player.lv}</p>
            <HpBar hp={s.player.hp} maxHp={s.player.maxHp} align="right" />
            <p className="text-[12px] mt-1">HP {Math.ceil(s.player.hp)}/{s.player.maxHp}</p>
            <div className="hp-bar-bg w-full ml-auto mt-1" style={{ maxWidth: 150, height: 4 }}>
              <div className="hp-bar-fill" style={{ width: `${(s.player.exp / expToNext(s.player.lv)) * 100}%`, backgroundColor: "#3b6cca" }} />
            </div>
            <p className="text-[10px] mt-0.5 opacity-80">EXP {s.player.exp}/{expToNext(s.player.lv)}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 shrink-0">
        <BottomBox s={s} bagEntries={bagEntries} />
      </div>
    </div>
  );
}

/* ---------------- 상점 화면 ---------------- */
function ShopView({ s }: { s: GameState }) {
  return (
    <div className="h-full flex flex-col text-[13px] overflow-hidden">
      <div className="flex justify-between items-center border-b-2 border-gb-dark pb-1 shrink-0">
        <p className="text-[16px] font-black">포켓몬 센터 상점</p>
        <p className="text-[14px] font-black">${s.money}</p>
      </div>

      <div className="h-[20px] shrink-0 text-[12px] font-bold truncate text-gb-mid flex items-center">
        {s.message}
      </div>

      <div className="flex-grow overflow-hidden min-h-0 space-y-0.5">
        {ITEMS.map((it, i) => {
          const owned = it.kind === "held" && s.player.held.includes(it.id);
          const cnt = it.kind === "consumable" ? s.player.bag[it.id] ?? 0 : 0;
          const sel = s.shopCursor === i;
          return (
            <div key={it.id} className={`menu-item flex justify-between items-center ${sel ? "selected" : ""}`}>
              <span className="font-black truncate">
                {it.name}
                {it.kind === "consumable" && cnt > 0 && <span className="opacity-60"> (보유 {cnt})</span>}
                {owned && <span className="opacity-60"> (보유중)</span>}
              </span>
              <span className={`font-bold shrink-0 ${s.money < it.price ? "opacity-40" : ""}`}>${it.price}</span>
            </div>
          );
        })}
      </div>

      {/* 선택 항목 설명 */}
      <div className="bg-black/10 rounded px-3 py-2 my-1 leading-snug shrink-0 h-[44px] flex items-center text-[12px] overflow-hidden">
        {s.shopCursor < ITEMS.length ? ITEMS[s.shopCursor].desc : "다음 층으로 올라간다. 더 강한 적이 기다린다!"}
      </div>

      <div className={`menu-item text-center text-[14px] font-black py-2 rounded bg-gb-dark/10 shrink-0 ${s.shopCursor === ITEMS.length ? "selected" : ""}`}>
        ▲ 다음 층으로 진입 ({s.floor + 1}층)
      </div>
    </div>
  );
}

/* ---------------- 게임 오버 ---------------- */
function submitText(state: GameState["submitState"]) {
  switch (state) {
    case "saving":
      return "리더보드에 기록 저장 중...";
    case "saved":
      return "🏆 리더보드에 기록되었어요!";
    case "error":
      return "기록 저장에 실패했어요 (오프라인?)";
    default:
      return "";
  }
}

function GameOverView({ s }: { s: GameState }) {
  const record = s.floor >= s.best;
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PIKACHU_FRONT} alt="피카츄" className="w-24 h-24 mb-2 pixelated" style={{ filter: "grayscale(0.7)" }} />
      <h2 className="text-[24px] font-black mb-1" style={{ color: "#8b1d44" }}>GAME OVER</h2>
      <p className="text-[14px] font-black">{s.nickname || "이름없음"}</p>
      <p className="text-[15px] font-black mb-1">{s.floor}층에서 쓰러졌다</p>
      <p className="text-[12px] font-bold mb-1 opacity-80">피카츄 Lv{s.player.lv} 도달</p>
      {record && <p className="text-[13px] font-bold text-[#3b4cca] mb-1">★ 신기록 달성!</p>}
      <p className="text-[12px] font-bold mb-2 opacity-80">최고 기록: {Math.max(s.best, s.floor)}층</p>
      <p className="text-[11px] font-bold mb-3 h-[14px] text-[#3b4cca]">{submitText(s.submitState)}</p>
      <p className="text-[14px] animate-bounce font-bold">A 버튼으로 다시 도전!</p>
    </div>
  );
}

/* ---------------- 라우터 ---------------- */
export default function Screen({ s, bagEntries }: { s: GameState; bagEntries: typeof ITEMS }) {
  if (s.phase === "start") return <StartView best={s.best} nickname={s.nickname} />;
  if (s.phase === "gameover") return <GameOverView s={s} />;
  if (s.phase === "shop") return <ShopView s={s} />;
  return <BattleView s={s} bagEntries={bagEntries} />;
}
