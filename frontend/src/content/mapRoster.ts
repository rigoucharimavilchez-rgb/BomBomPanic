export interface MapDefinition {
  id: string;
  name: string;
  theme: string;
  description: string;
  accent: number;
  difficulty: string;
}

export const MAP_ROSTER: MapDefinition[] = [
  { id: 'green-garden', name: 'Green Garden', theme: '🌱', description: 'La arena ideal para empezar.', accent: 0x66bd4a, difficulty: 'Fácil' },
  { id: 'toxic-factory', name: 'Toxic Factory', theme: '☢', description: 'Pasillos industriales y cruces peligrosos.', accent: 0x7fc83f, difficulty: 'Media' },
  { id: 'frozen-panic', name: 'Frozen Panic', theme: '❄', description: 'Una arena fría para combates rápidos.', accent: 0x5cc9e8, difficulty: 'Media' },
  { id: 'mutant-volcano', name: 'Mutant Volcano', theme: '🌋', description: 'Mucho espacio y mucho peligro.', accent: 0xed6a3a, difficulty: 'Media' },
  { id: 'haunted-lab', name: 'Haunted Lab', theme: '👻', description: 'Corredores perfectos para emboscadas.', accent: 0x8764c7, difficulty: 'Difícil' },
  { id: 'chaos-arena', name: 'Chaos Arena', theme: '💥', description: 'La arena para quienes buscan caos.', accent: 0xf0a62b, difficulty: 'Difícil' },
];

export const SELECTED_MAP_KEY = 'bbp_selected_map';
