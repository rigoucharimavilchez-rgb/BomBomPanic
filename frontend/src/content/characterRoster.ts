export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  accent: number;
  icon: string;
}

export const CHARACTER_ROSTER: CharacterDefinition[] = [
  { id: 'bomber', name: 'Bomber', description: 'El clásico de BomBom Panic.', accent: 0xffc83b, icon: 'B' },
  { id: 'robo', name: 'Robo', description: 'Tecnología, metal y actitud.', accent: 0x4aa8ff, icon: 'R' },
  { id: 'mutant', name: 'Mutant', description: 'Una criatura salida del caos.', accent: 0x8bd450, icon: 'M' },
  { id: 'ninja', name: 'Ninja', description: 'Silencioso, rápido y misterioso.', accent: 0x7657d9, icon: 'N' },
  { id: 'ghost', name: 'Ghost', description: 'El espíritu más travieso de la arena.', accent: 0xbfa7ff, icon: 'G' },
  { id: 'toxic', name: 'Toxic', description: 'Puro caos experimental.', accent: 0x48d19b, icon: 'T' },
];

export const SELECTED_CHARACTER_KEY = 'bbp_selected_character';
