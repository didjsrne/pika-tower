// PokeAPI에서 포켓몬의 타입/이름을 가져온다. (스프라이트는 raw github 경로를 직접 사용)

export interface PokeInfo {
  types: string[];
  name: string;
}

const cache = new Map<number, PokeInfo>();

export async function fetchPokemon(id: number): Promise<PokeInfo> {
  const cached = cache.get(id);
  if (cached) return cached;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const info: PokeInfo = {
      types: data.types.map((t: { type: { name: string } }) => t.type.name),
      name: (data.name as string).toUpperCase(),
    };
    cache.set(id, info);
    return info;
  } catch {
    return { types: ["normal"], name: "UNKNOWN" };
  }
}
