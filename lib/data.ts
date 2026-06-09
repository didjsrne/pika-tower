// ====== 게임 정적 데이터 & 타입 정의 ======

export type ItemId =
  | "potion"
  | "superPotion"
  | "rareCandy"
  | "lightBall"
  | "amuletCoin"
  | "choiceSpecs"
  | "leftovers";

export interface MoveDef {
  name: string;
  power: number;
  type: string; // 공격 타입 (영문, PokeAPI 기준)
  label: string; // 화면 표기용 한글 타입
  effect?: "paralyze";
  desc: string;
}

export interface ItemDef {
  id: ItemId;
  name: string;
  price: number;
  desc: string;
  // consumable: 가방에 넣어 전투 중 사용 / held: 지닌물건 패시브 / instant: 구매 즉시 발동
  kind: "consumable" | "held" | "instant";
}

export interface PlayerState {
  lv: number;
  maxHp: number;
  hp: number;
  atk: number;
  exp: number; // 현재 레벨에서 모은 경험치
  bag: Record<string, number>; // 소비 아이템 보유 수량
  held: ItemId[]; // 지닌물건 (패시브, 중복 보유 가능)
}

export interface EnemyState {
  id: number;
  name: string;
  lv: number;
  maxHp: number;
  hp: number;
  atk: number;
  types: string[];
  status: "paralyzed" | null;
  sprite: string;
  isBoss: boolean;
}

// ---- 타입 상성표 (플레이어가 쓰는 공격 타입만 정의) ----
// 정의되지 않은 방어 타입은 배수 1.
export const TYPE_CHART: Record<string, Record<string, number>> = {
  electric: { water: 2, flying: 2, ground: 0, grass: 0.5, electric: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
};

// ---- 피카츄의 기술 ----
export const MOVE_DATA: MoveDef[] = [
  { name: "10만볼트", power: 90, type: "electric", label: "전기", desc: "강력한 전기. 물·비행에 효과 굉장." },
  { name: "둥실둥실풀", power: 85, type: "flying", label: "비행", desc: "공중에서 내리꽂는 비행 기술." },
  { name: "참방참방서핑", power: 85, type: "water", label: "물", desc: "파도를 타고 돌진하는 물 기술." },
  { name: "볼부비부비", power: 25, type: "electric", label: "마비", effect: "paralyze", desc: "위력은 낮지만 상대를 마비시킨다." },
];

// ---- 상점 아이템 ----
export const ITEMS: ItemDef[] = [
  { id: "potion", name: "상처약", price: 120, kind: "consumable", desc: "HP를 50 회복한다." },
  { id: "superPotion", name: "고급상처약", price: 320, kind: "consumable", desc: "HP를 가득 회복한다." },
  { id: "rareCandy", name: "이상한사탕", price: 260, kind: "instant", desc: "사면 즉시 레벨이 1 오른다 (HP+20, 공격+6)." },
  { id: "lightBall", name: "전기구슬", price: 520, kind: "held", desc: "지니면 전기 기술 위력 2배." },
  { id: "amuletCoin", name: "부적금화", price: 420, kind: "held", desc: "지니면 획득 자금 1.5배." },
  { id: "choiceSpecs", name: "구애안경", price: 640, kind: "held", desc: "지니면 모든 기술 위력 1.3배." },
  { id: "leftovers", name: "먹다남은음식", price: 460, kind: "held", desc: "매 턴 최대 HP의 6% 회복." },
];

export const ITEM_MAP: Record<ItemId, ItemDef> = ITEMS.reduce(
  (acc, it) => {
    acc[it.id] = it;
    return acc;
  },
  {} as Record<ItemId, ItemDef>,
);

// ---- 적 포켓몬 풀 ----
// 일반 층: 약~중간 포켓몬
const NORMAL_POOL = [
  10, 13, 16, 19, 21, 23, 27, 29, 32, 41, 43, 46, 48, 50, 52, 54, 56, 60, 63, 66,
  69, 72, 74, 77, 79, 81, 84, 86, 90, 92, 96, 98, 100, 102, 104, 116, 118, 120,
  129, 133,
];

// 보스 층(10,20,30…): 전설/의사전설/거물. 한 바퀴 돌면 처음부터 다시(난이도만 상승).
const BOSS_POOL = [
  95, 130, 131, 143, 142, 149, 144, 145, 146, 150, 151, 248, 249, 250, 257, 282,
  373, 376, 384, 445, 448, 483, 484, 487, 643, 644, 646, 716, 717, 718,
];

export function isBossFloor(floor: number): boolean {
  return floor % 10 === 0;
}

// 해당 층에 등장할 포켓몬 도감 번호를 고른다.
export function pickEnemyId(floor: number, rng: () => number): number {
  if (isBossFloor(floor)) {
    const idx = (floor / 10 - 1) % BOSS_POOL.length;
    return BOSS_POOL[idx];
  }
  return NORMAL_POOL[Math.floor(rng() * NORMAL_POOL.length)];
}

// 층이 깊어질수록(보스 풀을 한 바퀴 돌수록) 곱해지는 추가 난이도 배수.
export function difficultyTier(floor: number): number {
  const cycle = Math.floor((floor - 1) / (BOSS_POOL.length * 10));
  return 1 + cycle * 0.6;
}

// ---- 적 스탯 스케일링 ----
export function buildEnemyStats(floor: number) {
  const boss = isBossFloor(floor);
  const tier = difficultyTier(floor);
  const lv = Math.round((4 + floor + (boss ? 6 : 0)) * 1);
  const baseHp = (45 + floor * 12) * tier * (boss ? 1.9 : 1);
  const baseAtk = (8 + floor * 1.4) * tier * (boss ? 1.45 : 1);
  return {
    lv,
    maxHp: Math.round(baseHp),
    atk: Math.round(baseAtk),
  };
}

// 전투 승리 보상 (부적금화 보정 전).
export function battleReward(floor: number): number {
  const boss = isBossFloor(floor);
  return Math.round((120 + floor * 25) * difficultyTier(floor) * (boss ? 2.6 : 1));
}

// 다음 레벨까지 필요한 경험치 (레벨이 오를수록 증가).
export function expToNext(level: number): number {
  return Math.round(8 + level * 4);
}

// 적을 쓰러뜨렸을 때 얻는 경험치.
export function expFromEnemy(enemyLv: number, floor: number, boss: boolean): number {
  return Math.round((enemyLv * 1.8 + floor) * (boss ? 2.2 : 1));
}

export const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function frontSprite(id: number): string {
  return `${SPRITE_BASE}/${id}.png`;
}
export function backSprite(id: number): string {
  return `${SPRITE_BASE}/back/${id}.png`;
}

export const PIKACHU_FRONT = frontSprite(25);
export const PIKACHU_BACK = backSprite(25);
