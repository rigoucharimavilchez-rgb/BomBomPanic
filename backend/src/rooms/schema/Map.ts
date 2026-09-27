import { ArraySchema, Schema, type } from '@colyseus/schema';

import * as Constants from '../../constants/constants';

const MAP_IDS = ['green-garden', 'toxic-factory', 'frozen-panic', 'mutant-volcano', 'haunted-lab', 'chaos-arena'] as const;
type MapId = (typeof MAP_IDS)[number];

export default class Map extends Schema {
  @type('number')
  rows: number;

  @type('number')
  cols: number;

  @type(['number'])
  blockArr: number[];

  @type('string')
  id: string;

  constructor(mapId: string = 'green-garden') {
    super();
    this.rows = Constants.TILE_ROWS;
    this.cols = Constants.TILE_COLS;
    this.id = MAP_IDS.includes(mapId as MapId) ? mapId : 'green-garden';
    this.blockArr = this.generateBlockArr(this.id);
  }

  private generateBlockArr(mapId: string) {
    const arr = new Array<number>(this.rows * this.cols).fill(-1);
    const yMin = 1;
    const yMax = this.rows - 2;
    const xMin = 1;
    const xMax = this.cols - 2;

    const isSpawnSafe = (x: number, y: number) =>
      (x <= 2 && y <= 2) ||
      (x >= xMax - 1 && y <= 2) ||
      (x <= 2 && y >= yMax - 1) ||
      (x >= xMax - 1 && y >= yMax - 1);

    const hash = (value: number) => {
      let n = value | 0;
      n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
      n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
      return (n ^ (n >>> 16)) >>> 0;
    };

    const seed = Array.from(mapId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const candidates: Array<{ x: number; y: number; score: number }> = [];

    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        if (x % 2 === 0 && y % 2 === 0) continue;
        if (isSpawnSafe(x, y)) continue;

        const score = hash(seed + x * 97 + y * 193);
        const corridor = (x + y) % 4 === 0;
        const cross = x % 4 === 1 || y % 4 === 1;

        let keep = true;
        switch (mapId) {
          case 'frozen-panic': keep = score % 100 < 62; break;
          case 'mutant-volcano': keep = score % 100 < 88; break;
          case 'haunted-lab': keep = score % 100 < (corridor ? 28 : 82); break;
          case 'chaos-arena': keep = score % 100 < (cross ? 72 : 94); break;
          case 'toxic-factory': keep = score % 100 < (corridor ? 46 : 92); break;
          default: keep = score % 100 < 78;
        }

        if (keep) candidates.push({ x, y, score });
      }
    }

    candidates.sort((a, b) => a.score - b.score);
    const limits: Record<string, number> = {
      'green-garden': 72,
      'toxic-factory': 86,
      'frozen-panic': 58,
      'mutant-volcano': 96,
      'haunted-lab': 76,
      'chaos-arena': 100,
    };

    const maxBlocks = Math.min(Constants.MAX_BLOCKS, limits[mapId] ?? 72);
    for (let i = 0; i < maxBlocks && i < candidates.length; i++) {
      const { x, y } = candidates[i];
      arr[x + this.cols * y] = Constants.TILE_BLOCK_IDX;
    }

    return new ArraySchema<number>(...arr);
  }
}
