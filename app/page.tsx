"use client";

import { useState } from "react";
import GameBoy from "@/components/GameBoy";
import Screen from "@/components/Screen";
import BgmManager from "@/components/BgmManager";
import BootGate from "@/components/BootGate";
import { useGameEngine } from "@/hooks/useGameEngine";

export default function Home() {
  const { state, input, bagEntries } = useGameEngine();
  const [booted, setBooted] = useState(false);
  return (
    <main className="w-full flex justify-center">
      <GameBoy onInput={input}>
        <Screen s={state} bagEntries={bagEntries()} />
      </GameBoy>
      <BgmManager state={state} unlocked={booted} />
      {!booted && <BootGate onBoot={() => setBooted(true)} />}
    </main>
  );
}
