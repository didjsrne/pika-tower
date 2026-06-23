"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  MOVE_DATA,
  TYPE_CHART,
  ITEM_MAP,
  ITEMS,
  type ItemId,
  type EnemyState,
  type PlayerState,
  buildEnemyStats,
  battleReward,
  expToNext,
  expFromEnemy,
  pickEnemyId,
  isBossFloor,
  frontSprite,
} from "@/lib/data";
import { fetchPokemon } from "@/lib/pokeapi";

export type Phase = "start" | "battle" | "shop" | "gameover";
export type BattleMenu = "main" | "fight" | "bag";
export type InputAction = "up" | "down" | "left" | "right" | "a" | "b";
// 리더보드 점수 등록 상태
export type SubmitState = "idle" | "saving" | "saved" | "error";

export interface GameState {
  phase: Phase;
  floor: number;
  money: number;
  best: number;
  nickname: string; // 플레이어 닉네임 (시작 전 입력)
  player: PlayerState;
  enemy: EnemyState | null;
  message: string;
  isAnimating: boolean;
  loading: boolean;
  battleMenu: BattleMenu;
  cursor: number; // 현재 메뉴 내 커서 인덱스
  shopCursor: number;
  shakeEnemy: boolean;
  shakePlayer: boolean;
  banner: string | null; // 보스 등장 / 레벨업 등 강조 배너
  submitState: SubmitState; // 게임오버 시 리더보드 등록 진행 상태
  lastEntryId: number | null; // 방금 등록된 내 기록 id (리더보드 강조용)
}

const MAIN_MENU = ["싸운다", "가방", "정보", "도망"];

function freshPlayer(): PlayerState {
  return { lv: 5, maxHp: 60, hp: 60, atk: 15, exp: 0, bag: {}, held: [] };
}

// 레벨업 1회의 스탯 상승.
function applyLevelUp(p: PlayerState) {
  p.lv += 1;
  p.maxHp += 20;
  p.hp += 20;
  p.atk += 6;
}

// 경험치를 더하고, 임계치를 넘는 만큼 레벨업시킨다. 오른 레벨 수를 반환.
function grantExp(p: PlayerState, amount: number): number {
  p.exp += amount;
  let levels = 0;
  while (p.exp >= expToNext(p.lv)) {
    p.exp -= expToNext(p.lv);
    applyLevelUp(p);
    levels += 1;
  }
  return levels;
}

function initialState(best: number, nickname = ""): GameState {
  return {
    phase: "start",
    floor: 1,
    money: 0,
    best,
    nickname,
    player: freshPlayer(),
    enemy: null,
    message: "모험이 시작됩니다!",
    isAnimating: false,
    loading: false,
    battleMenu: "main",
    cursor: 0,
    shopCursor: 0,
    shakeEnemy: false,
    shakePlayer: false,
    banner: null,
    submitState: "idle",
    lastEntryId: null,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useGameEngine(enabled: boolean = true) {
  const ref = useRef<GameState>(initialState(0));
  const [, force] = useReducer((x) => x + 1, 0);
  const render = useCallback(() => force(), []);

  // 시작 게이트에서 받은 닉네임을 게임 상태에 반영.
  const setNickname = useCallback(
    (name: string) => {
      ref.current.nickname = name;
      render();
    },
    [render],
  );

  // best 점수 로드
  useEffect(() => {
    const saved = Number(
      typeof window !== "undefined" ? window.localStorage.getItem("pika-best") : 0,
    );
    if (saved > 0) {
      ref.current.best = saved;
      render();
    }
  }, [render]);

  const log = useCallback(
    (msg: string) => {
      ref.current.message = msg;
      render();
    },
    [render],
  );

  // ----- 보유 지닌물건 -----
  const hasHeld = (id: ItemId) => ref.current.player.held.includes(id);

  // ----- 적 생성 -----
  const spawnEnemy = useCallback(async () => {
    const s = ref.current;
    const floor = s.floor;
    s.loading = true;
    s.enemy = null;
    log("데이터 로딩 중...");

    const id = pickEnemyId(floor, Math.random);
    const info = await fetchPokemon(id);
    const stats = buildEnemyStats(floor);
    const boss = isBossFloor(floor);

    s.enemy = {
      id,
      name: info.name,
      lv: stats.lv,
      maxHp: stats.maxHp,
      hp: stats.maxHp,
      atk: stats.atk,
      types: info.types,
      status: null,
      sprite: frontSprite(id),
      isBoss: boss,
    };
    s.loading = false;
    s.battleMenu = "main";
    s.cursor = 0;
    s.banner = boss ? `보스 출현! ${s.enemy.name}` : null;
    log(
      boss
        ? `층의 수호자, ${s.enemy.name}이(가) 가로막는다!`
        : `야생의 ${s.enemy.name}이(가) 나타났다!`,
    );
  }, [log]);

  const startGame = useCallback(async () => {
    const s = ref.current;
    s.phase = "battle";
    s.floor = 1;
    render();
    await spawnEnemy();
  }, [render, spawnEnemy]);

  // ----- 타입 상성 배수 -----
  const typeMultiplier = (moveType: string, enemyTypes: string[]) => {
    const chart = TYPE_CHART[moveType];
    if (!chart) return 1;
    let m = 1;
    enemyTypes.forEach((t) => {
      if (chart[t] !== undefined) m *= chart[t];
    });
    return m;
  };

  // ----- 리더보드 점수 등록 (게임오버 시 1회) -----
  const submitScore = useCallback(async () => {
    const s = ref.current;
    const nickname = s.nickname.trim();
    // 닉네임이 없으면 (이론상 없음) 등록 스킵
    if (!nickname) {
      s.submitState = "idle";
      return;
    }
    s.submitState = "saving";
    render();
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          floor: s.floor,
          level: s.player.lv,
        }),
      });
      // 503 = 아직 Supabase 미연동. 사용자에게 실패로 보이지 않도록 조용히 무시.
      if (res.status === 503) {
        s.submitState = "idle";
        render();
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        s.submitState = "saved";
        s.lastEntryId = data.entry?.id ?? null;
      } else {
        s.submitState = "error";
      }
    } catch {
      s.submitState = "error";
    }
    render();
  }, [render]);

  // ----- 게임 오버 -----
  const gameOver = useCallback(() => {
    const s = ref.current;
    s.phase = "gameover";
    if (s.floor > s.best) {
      s.best = s.floor;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("pika-best", String(s.floor));
      }
    }
    render();
    // 점수는 비동기로 등록 (UI는 즉시 게임오버로 전환)
    void submitScore();
  }, [render, submitScore]);

  // ----- 적 턴 -----
  const enemyTurn = useCallback(async () => {
    const s = ref.current;
    const enemy = s.enemy!;
    if (enemy.status === "paralyzed" && Math.random() < 0.25) {
      log(`${enemy.name}은(는) 마비되어 움직일 수 없다!`);
      await sleep(1000);
      return;
    }

    log(`${enemy.name}의 공격!`);
    s.shakePlayer = true;
    render();
    await sleep(250);
    s.shakePlayer = false;
    render();
    await sleep(400);

    const dmg = Math.floor((enemy.atk * 40) / 55 + 2);
    s.player.hp = Math.max(0, s.player.hp - dmg);
    render();
    await sleep(900);

    if (s.player.hp <= 0) {
      log("피카츄가 쓰러졌다...");
      await sleep(1200);
      gameOver();
      return;
    }

    // 먹다남은음식: 매 턴 회복
    if (hasHeld("leftovers") && s.player.hp < s.player.maxHp) {
      const heal = Math.ceil(s.player.maxHp * 0.06);
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + heal);
      log("먹다남은음식으로 체력을 조금 회복했다.");
      render();
      await sleep(800);
    }
  }, [gameOver, log]);

  // ----- 승리 / 상점 -----
  const showShop = useCallback(() => {
    const s = ref.current;
    s.phase = "shop";
    s.shopCursor = 0;
    render();
  }, [render]);

  const winBattle = useCallback(async () => {
    const s = ref.current;
    const enemy = s.enemy!;
    let reward = battleReward(s.floor);
    if (hasHeld("amuletCoin")) reward = Math.floor(reward * 1.5);
    s.money += reward;
    log(`${enemy.name}을(를) 쓰러뜨렸다!  $${reward} 획득!`);
    render();
    await sleep(1500);

    const exp = expFromEnemy(enemy.lv, s.floor, enemy.isBoss);
    const levels = grantExp(s.player, exp);
    log(`피카츄는 경험치 ${exp}를 얻었다!`);
    render();
    await sleep(1300);
    if (levels > 0) {
      log(`레벨 업! 피카츄는 Lv${s.player.lv}가 되었다!`);
      render();
      await sleep(1500);
    }
    showShop();
  }, [log, render, showShop]);

  // ----- 기술 사용 -----
  const useMove = useCallback(
    async (index: number) => {
      const s = ref.current;
      if (s.phase !== "battle" || s.isAnimating || !s.enemy || s.loading) return;
      s.isAnimating = true;
      s.battleMenu = "main";
      s.cursor = 0;
      s.banner = null;

      const move = MOVE_DATA[index];
      const enemy = s.enemy;
      log(`피카츄의 ${move.name}!`);
      render();
      await sleep(650);

      s.shakeEnemy = true;
      render();
      await sleep(250);
      s.shakeEnemy = false;
      render();

      let mult = typeMultiplier(move.type, enemy.types);
      let dmg = (s.player.atk * move.power) / 50 + 2;
      dmg *= mult;
      if (move.type === "electric" && hasHeld("lightBall")) dmg *= 2;
      if (hasHeld("choiceSpecs")) dmg *= 1.3;
      const finalDmg = Math.floor(dmg);
      enemy.hp = Math.max(0, enemy.hp - finalDmg);
      render();

      if (mult > 1) log("효과가 굉장했다!");
      else if (mult === 0) log("효과가 없는 듯 하다...");
      else if (mult < 1) log("효과가 별로인 듯하다...");
      await sleep(800);

      // 볼부비부비(Nuzzle): 명중하면 반드시 마비(100%). 단, 전기 무효(땅 타입 등)면 효과 없음.
      if (
        move.effect === "paralyze" &&
        mult > 0 &&
        !enemy.status &&
        enemy.hp > 0
      ) {
        enemy.status = "paralyzed";
        log(`${enemy.name}은(는) 마비되었다!`);
        render();
        await sleep(900);
      }

      if (enemy.hp <= 0) {
        await winBattle();
      } else {
        await enemyTurn();
      }
      s.isAnimating = false;
      render();
    },
    [enemyTurn, log, render, winBattle],
  );

  // ----- 전투 중 아이템 사용 (턴 소모) -----
  const useItemInBattle = useCallback(
    async (id: ItemId) => {
      const s = ref.current;
      if (s.isAnimating || !s.enemy) return;
      const count = s.player.bag[id] ?? 0;
      if (count <= 0) return;
      s.isAnimating = true;
      s.player.bag[id] = count - 1;
      s.battleMenu = "main";
      s.cursor = 0;

      if (id === "potion") {
        s.player.hp = Math.min(s.player.maxHp, s.player.hp + 50);
        log("상처약을 사용했다. HP 50 회복!");
      } else if (id === "superPotion") {
        s.player.hp = s.player.maxHp;
        log("고급상처약을 사용했다. HP 완전 회복!");
      }
      render();
      await sleep(1100);

      if (s.enemy && s.enemy.hp > 0 && s.player.hp > 0) {
        await enemyTurn();
      }
      s.isAnimating = false;
      render();
    },
    [enemyTurn, log, render],
  );

  // ----- 상점 구매 -----
  const buyItem = useCallback(
    (id: ItemId) => {
      const s = ref.current;
      const def = ITEM_MAP[id];
      if (s.money < def.price) {
        log("자금이 부족하다!");
        return;
      }
      if (def.kind === "held" && hasHeld(id)) {
        log("이미 지니고 있다!");
        return;
      }
      s.money -= def.price;
      if (def.kind === "consumable") {
        s.player.bag[id] = (s.player.bag[id] ?? 0) + 1;
        log(`${def.name}을(를) 구입했다!`);
      } else if (def.kind === "held") {
        s.player.held.push(id);
        log(`${def.name}을(를) 구입했다!`);
      } else if (def.kind === "instant") {
        // 구매 즉시 발동
        if (id === "rareCandy") {
          grantExp(s.player, expToNext(s.player.lv));
          log(`이상한사탕! 피카츄는 Lv${s.player.lv}가 되었다!`);
        }
      }
      render();
    },
    [log, render],
  );

  const nextFloor = useCallback(async () => {
    const s = ref.current;
    s.floor += 1;
    s.phase = "battle";
    render();
    await spawnEnemy();
  }, [render, spawnEnemy]);

  // ====== 입력 처리 ======
  const moveCursorGrid = (cursor: number, dir: InputAction, len: number) => {
    // 2x2 그리드 (0,1 / 2,3) 기준 이동. len이 4 미만이면 단순 좌우/상하.
    const cols = 2;
    let c = cursor;
    if (dir === "left") c = cursor % cols === 0 ? cursor : cursor - 1;
    else if (dir === "right") c = cursor % cols === cols - 1 ? cursor : cursor + 1;
    else if (dir === "up") c = cursor - cols >= 0 ? cursor - cols : cursor;
    else if (dir === "down") c = cursor + cols < len ? cursor + cols : cursor;
    return c;
  };

  const bagEntries = () => {
    const bag = ref.current.player.bag;
    return ITEMS.filter((it) => it.kind === "consumable" && (bag[it.id] ?? 0) > 0);
  };

  // 상점 목록 = 아이템 전체 + 마지막 "다음 층" 항목
  const shopLen = ITEMS.length + 1;

  const input = useCallback(
    (action: InputAction) => {
      const s = ref.current;
      if (s.loading) return;

      // --- 시작 화면 ---
      if (s.phase === "start") {
        if (action === "a") startGame();
        return;
      }

      // --- 게임 오버 ---
      if (s.phase === "gameover") {
        // 점수 등록 중에는 재시작을 막아 중복 입력으로 인한 꼬임을 방지.
        if (action === "a" && s.submitState !== "saving") {
          ref.current = initialState(s.best, s.nickname);
          render();
        }
        return;
      }

      // --- 상점 ---
      if (s.phase === "shop") {
        if (action === "up") {
          s.shopCursor = (s.shopCursor - 1 + shopLen) % shopLen;
          render();
        } else if (action === "down") {
          s.shopCursor = (s.shopCursor + 1) % shopLen;
          render();
        } else if (action === "a") {
          if (s.shopCursor === ITEMS.length) {
            nextFloor();
          } else {
            buyItem(ITEMS[s.shopCursor].id);
          }
        } else if (action === "b") {
          // B로 빠르게 다음 층 이동
          s.shopCursor = ITEMS.length;
          render();
        }
        return;
      }

      // --- 전투 ---
      if (s.phase === "battle") {
        if (s.isAnimating || !s.enemy) return;

        if (s.battleMenu === "main") {
          if (["up", "down", "left", "right"].includes(action)) {
            s.cursor = moveCursorGrid(s.cursor, action, MAIN_MENU.length);
            render();
          } else if (action === "a") {
            if (s.cursor === 0) {
              s.battleMenu = "fight";
              s.cursor = 0;
              render();
            } else if (s.cursor === 1) {
              if (bagEntries().length === 0) {
                log("가방이 비어 있다!");
              } else {
                s.battleMenu = "bag";
                s.cursor = 0;
                render();
              }
            } else if (s.cursor === 2) {
              const p = s.player;
              const heldNames =
                p.held.length > 0
                  ? p.held.map((h) => ITEM_MAP[h].name).join(", ")
                  : "없음";
              log(
                `Lv${p.lv}  HP ${Math.ceil(p.hp)}/${p.maxHp}  공격 ${p.atk}\nEXP ${p.exp}/${expToNext(p.lv)}  지닌물건: ${heldNames}`,
              );
            } else if (s.cursor === 3) {
              log("타워에서는 도망칠 수 없다!");
            }
          }
          return;
        }

        if (s.battleMenu === "fight") {
          if (["up", "down", "left", "right"].includes(action)) {
            s.cursor = moveCursorGrid(s.cursor, action, MOVE_DATA.length);
            render();
          } else if (action === "a") {
            useMove(s.cursor);
          } else if (action === "b") {
            s.battleMenu = "main";
            s.cursor = 0;
            render();
          }
          return;
        }

        if (s.battleMenu === "bag") {
          const entries = bagEntries();
          if (action === "up") {
            s.cursor = (s.cursor - 1 + entries.length) % entries.length;
            render();
          } else if (action === "down") {
            s.cursor = (s.cursor + 1) % entries.length;
            render();
          } else if (action === "a") {
            const entry = entries[s.cursor];
            if (entry) useItemInBattle(entry.id);
          } else if (action === "b") {
            s.battleMenu = "main";
            s.cursor = 0;
            render();
          }
          return;
        }
      }
    },
    [buyItem, log, nextFloor, render, startGame, useItemInBattle, useMove],
  );

  // 키보드 바인딩 (시작 게이트가 닫히기 전 enabled=false 동안엔 바인딩하지 않아
  // 닉네임 입력 키가 게임 입력으로 새지 않게 한다.)
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      let act: InputAction | null = null;
      switch (e.key) {
        case "ArrowUp":
          act = "up";
          break;
        case "ArrowDown":
          act = "down";
          break;
        case "ArrowLeft":
          act = "left";
          break;
        case "ArrowRight":
          act = "right";
          break;
        case "a":
        case "A":
        case "Enter":
          act = "a";
          break;
        case "b":
        case "B":
        case "Escape":
        case "Backspace":
          act = "b";
          break;
      }
      if (act) {
        e.preventDefault();
        input(act);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, enabled]);

  return { state: ref.current, input, bagEntries, setNickname };
}
