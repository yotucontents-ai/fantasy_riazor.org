import type { Player, PlayerCategory } from '../types';

export const PLANTILLA: Record<PlayerCategory, Player[]> = {
  porteros: [
    { d: 1,  n: 'Germán',     cat: 'porteros' },
    { d: 13, n: 'Eric Puerto', cat: 'porteros' },
    { d: 25, n: 'Ferllo',     cat: 'porteros' },
    { d: 26, n: 'Ríos',       cat: 'porteros' },
  ],
  defensas: [
    { d: 2,  n: 'Adrià Altimira',   cat: 'defensas' },
    { d: 3,  n: 'Arnau Comas',      cat: 'defensas' },
    { d: 4,  n: 'Lucas Noubi',      cat: 'defensas' },
    { d: 5,  n: 'Dani Barcia',      cat: 'defensas' },
    { d: 12, n: 'G. Quagliata',     cat: 'defensas' },
    { d: 15, n: 'Miguel Loureiro',  cat: 'defensas' },
    { d: 18, n: 'Sergio Escudero',  cat: 'defensas' },
    { d: 23, n: 'Ximo Navarro',     cat: 'defensas' },
    { d: 27, n: 'Samu Fernández',   cat: 'defensas' },
    { d: 36, n: 'Iker Vidal',       cat: 'defensas' },
  ],
  centrocampistas: [
    { d: 6,  n: 'Charlie Patiño',      cat: 'centrocampistas' },
    { d: 8,  n: 'Diego Villares',      cat: 'centrocampistas' },
    { d: 14, n: 'Riki',               cat: 'centrocampistas' },
    { d: 16, n: 'José Gragera',        cat: 'centrocampistas' },
    { d: 20, n: 'José Ángel Jurado',   cat: 'centrocampistas' },
    { d: 21, n: 'Mario Soriano',       cat: 'centrocampistas' },
  ],
  delanteros: [
    { d: 7,  n: 'Mulattieri',      cat: 'delanteros' },
    { d: 9,  n: 'Zaka',           cat: 'delanteros' },
    { d: 10, n: 'Yeremay',        cat: 'delanteros' },
    { d: 11, n: 'David Mella',    cat: 'delanteros' },
    { d: 17, n: 'Cristian Herrera', cat: 'delanteros' },
    { d: 19, n: 'Luismi Cruz',    cat: 'delanteros' },
  ],
};

export const ALL_PLAYERS: Player[] = Object.values(PLANTILLA).flat();

export function getPlayerByDorsal(d: number): Player | undefined {
  return ALL_PLAYERS.find(p => p.d === d);
}

export const POS_LABEL: Record<string, string> = {
  POR: 'Portero',
  LD: 'Lateral Derecho',
  DC1: 'Central Derecho',
  DC2: 'Central Izquierdo',
  LI: 'Lateral Izquierdo',
  MCD: 'Med. Defensivo',
  MC1: 'Centrocampista',
  MC2: 'Centrocampista',
  MCO: 'Med. Ofensivo',
  DEL1: 'Delantero',
  DEL2: 'Delantero',
};

export const POS_TO_CAT: Record<string, PlayerCategory[]> = {
  POR: ['porteros'],
  LD: ['defensas'],
  DC1: ['defensas'],
  DC2: ['defensas'],
  LI: ['defensas'],
  MCD: ['centrocampistas'],
  MC1: ['centrocampistas'],
  MC2: ['centrocampistas'],
  MCO: ['centrocampistas'],
  DEL1: ['delanteros'],
  DEL2: ['delanteros'],
};

export const POSITIONS = ['POR', 'LD', 'DC1', 'DC2', 'LI', 'MCD', 'MC1', 'MC2', 'MCO', 'DEL1', 'DEL2'] as const;

export const CAT_TO_POSITIONS: Record<PlayerCategory, string[]> = {
  porteros: ['POR'],
  defensas: ['LD', 'DC1', 'DC2', 'LI'],
  centrocampistas: ['MCD', 'MC1', 'MC2', 'MCO'],
  delanteros: ['DEL1', 'DEL2'],
};
