export type CharacterId =
  | 'bomber'
  | 'robo'
  | 'mutant'
  | 'ninja'
  | 'ghost'
  | 'toxic';

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  shortDescription: string;
  theme: string;
  accent: number;
  locked: boolean;
}

/**
 * First official BomBom Panic roster.
 * These are cosmetic identities for now: gameplay stats remain shared.
 */
export const BOMBER_PANIC_CHARACTERS: CharacterDefinition[] = [
  {
    id: 'bomber',
    name: 'Bomber',
    shortDescription: 'El bomber clásico y equilibrado.',
    theme: 'classic',
    accent: 0xffc928,
    locked: false,
  },
  {
    id: 'robo',
    name: 'Robo',
    shortDescription: 'Un pequeño robot listo para el caos.',
    theme: 'tech',
    accent: 0x4db6ff,
    locked: false,
  },
  {
    id: 'mutant',
    name: 'Mutant',
    shortDescription: 'Una criatura nacida del laboratorio.',
    theme: 'mutant',
    accent: 0x8fe35a,
    locked: false,
  },
  {
    id: 'ninja',
    name: 'Ninja',
    shortDescription: 'Silencioso, rápido y preparado para el combate.',
    theme: 'shadow',
    accent: 0x8b7cff,
    locked: false,
  },
  {
    id: 'ghost',
    name: 'Ghost',
    shortDescription: 'El visitante más extraño de BomBom Panic.',
    theme: 'spooky',
    accent: 0xc7b8ff,
    locked: false,
  },
  {
    id: 'toxic',
    name: 'Toxic',
    shortDescription: 'Experimento químico fuera de control.',
    theme: 'toxic',
    accent: 0x5ee66b,
    locked: false,
  },
];

export const DEFAULT_CHARACTER_ID: CharacterId = 'bomber';
