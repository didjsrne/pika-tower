"use client";

import GameBoy from "@/components/GameBoy";
import Screen from "@/components/Screen";
import BgmManager from "@/components/BgmManager";
import { useGameEngine } from "@/hooks/useGameEngine";

export default function Home() {
  const { state, input, bagEntries } = useGameEngine();
  return (
    <main className="w-full flex justify-center">
      <GameBoy onInput={input}>
        <Screen s={state} bagEntries={bagEntries()} />
      </GameBoy>
      <BgmManager state={state} />
    </main>
  );
}
