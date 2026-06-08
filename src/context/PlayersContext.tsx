import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getPlayers } from '../firebase/db';
import { PLANTILLA, ALL_PLAYERS } from '../data/players';
import type { Player, PlayerCategory } from '../types';

interface PlayersCtx {
  allPlayers: Player[];
  plantilla: Record<PlayerCategory, Player[]>;
  seeded: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PlayersCtx | null>(null);

function groupByCategory(players: Player[]): Record<PlayerCategory, Player[]> {
  return {
    porteros:        players.filter(p => p.cat === 'porteros').sort((a, b) => a.d - b.d),
    defensas:        players.filter(p => p.cat === 'defensas').sort((a, b) => a.d - b.d),
    centrocampistas: players.filter(p => p.cat === 'centrocampistas').sort((a, b) => a.d - b.d),
    delanteros:      players.filter(p => p.cat === 'delanteros').sort((a, b) => a.d - b.d),
  };
}

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [allPlayers, setAllPlayers] = useState<Player[]>(ALL_PLAYERS);
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const players = await getPlayers();
      if (players.length > 0) {
        setAllPlayers(players);
        setSeeded(true);
      } else {
        setAllPlayers(ALL_PLAYERS);
        setSeeded(false);
      }
    } catch {
      setAllPlayers(ALL_PLAYERS);
      setSeeded(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Ctx.Provider value={{ allPlayers, plantilla: groupByCategory(allPlayers), seeded, loading, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayers() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayers must be inside PlayersProvider');
  return ctx;
}

export { PLANTILLA as DEFAULT_PLANTILLA, ALL_PLAYERS as DEFAULT_ALL_PLAYERS };
