export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  accent: number;
  icon: string;
  stats: string;
  locked?: boolean;
  unlockText?: string;
}

export const RIGO_UNLOCK_WINS = 20;
export const CHARACTER_WINS_KEY = 'bbp_wins';
export const SELECTED_CHARACTER_KEY = 'bbp_selected_character';

export const getWinCount = (): number => Number(localStorage.getItem(CHARACTER_WINS_KEY) ?? '0');
export const isRigoUnlocked = (): boolean => getWinCount() >= RIGO_UNLOCK_WINS;

export const CHARACTER_ROSTER: CharacterDefinition[] = [
  {
    id: 'rigo',
    name: 'Rigo',
    description: 'El legendario de la arena. Poder brutal, pero difícil de conseguir.',
    accent: 0xf04b3e,
    icon: 'R',
    stats: '★★★★★ PODER',
    locked: true,
    unlockText: `Gana ${RIGO_UNLOCK_WINS} partidas`,
  },
  {
    id: 'axel',
    name: 'Axel',
    description: 'Velocidad y reflejos. Ideal para esquivar explosiones.',
    accent: 0x4aa8ff,
    icon: 'A',
    stats: '★★★★★ VELOCIDAD',
  },
  {
    id: 'bruno',
    name: 'Bruno',
    description: 'El experto en explosivos. Más bombas desde el comienzo.',
    accent: 0xf29f3d,
    icon: 'B',
    stats: '★★★★★ BOMBAS',
  },
  {
    id: 'kai',
    name: 'Kai',
    description: 'Control y precisión. Su estilo premia jugar con cabeza.',
    accent: 0x63c7e8,
    icon: 'K',
    stats: '★★★★☆ CONTROL',
  },
  {
    id: 'dante',
    name: 'Dante',
    description: 'Agresivo y misterioso. Diseñado para jugar al límite.',
    accent: 0x7657d9,
    icon: 'D',
    stats: '★★★★☆ ATAQUE',
  },
  {
    id: 'milo',
    name: 'Milo',
    description: 'Resistente y equilibrado. Una opción segura para aprender.',
    accent: 0x48d19b,
    icon: 'M',
    stats: '★★★★☆ DEFENSA',
  },
];
