# 피카타워 (Pika Tower) 🔋

게임보이(DMG) 감성의 **무한 등정 포켓몬 로그라이크**. Next.js + Tailwind로 만들었고, 포켓몬 데이터/스프라이트는 [PokeAPI](https://pokeapi.co)에서 실시간으로 가져옵니다.

## 플레이

- **목표**: 피카츄로 타워를 무한히 올라가기. 층마다 적이 강해지고 **10·20·30…층마다 보스**(전설/의사전설)가 등장합니다.
- **조작**: 방향키 이동 · **A** 선택 · **B** 취소 (화면 안 게임보이 메뉴 / 화면 속 D-패드·A·B 버튼도 동작)
- **전투**: `싸운다`에서 기술 선택. 전기·물·비행 타입 상성이 적용됩니다.
- **성장**: 적을 쓰러뜨리면 경험치를 얻어 레벨업. **이상한사탕**은 진행도와 무관하게 1레벨분 경험치를 한 번에 지급합니다.
- **상점**: 승리 후 자금으로 아이템 구매
  - 소비: 상처약 / 고급상처약 / 이상한사탕
  - 지닌물건(패시브): 전기구슬(전기기술 2배) · 부적금화(자금 1.5배) · 구애안경(모든 기술 1.3배) · 먹다남은음식(매 턴 회복)

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
```

## 구조

```
app/         layout.tsx, page.tsx, globals.css
components/  GameBoy.tsx (본체·버튼), Screen.tsx (모든 화면)
hooks/       useGameEngine.ts (상태·전투·입력)
lib/         data.ts (타입표·기술·적/보스풀·아이템·스케일링), pokeapi.ts
```

밸런스는 `lib/data.ts`의 `buildEnemyStats` / `battleReward` / `expToNext` / `expFromEnemy`만 조정하면 됩니다.
