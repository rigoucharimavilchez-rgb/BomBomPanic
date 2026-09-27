/*
色の定義
*/

export const DEBUG_ADMIN_PASSWORD = 'admin';

export const PAGE_COLOR = 0x18181b;
export const BLACK = 0x000000;
export const WHITE = 0xffffff;
export const DARK_GRAY = 0x374151;
export const GRAY = 0x6b7280;
export const LIGHT_GRAY = 0xcbd5e1;
export const BLUE = 0x0000ff;
export const RED = 0xff0000;
export const GREEN = 0xa3e635;
export const LIGHT_RED = 0xf87171;

export const FPS = 60; // 1 秒間のフレーム数
export const FRAME_RATE = 1000 / FPS; // 1 frame にかかる時間(ms)

export const OBJECT_CREATION_DELAY = 100;
export const OBJECT_REMOVAL_DELAY = 100;
export const CHECK_GAME_RESULT_INTERVAL = 500;
export const SERVER_LISTEN_PORT = 2567;
export const GAME_PUBLIC_ROOM_KEY = 'game';
export const GAME_CUSTOM_ROOM_KEY = 'custom';
export const GAME_LOBBY_KEY = 'lobby';

export const NOTIFICATION_TYPE = {
  GAME_PROGRESS: 1,
  PLAYER_INFO: 2,
  PLAYER_GAME_STATE: 3,
  PLAYER_IS_READY: 4,
  GAME_START_INFO: 10,
  PLAYER_MOVE: 1000,
  PLAYER_BOMB: 1001,
  DEBUG_PLAYER_WIN: 9000,
  DEBUG_DRAW: 9001,
  DEBUG_PLAYER_STATUS_MAX: 9002,
  DEBUG_ALL_PLAYER_STATUS_MAX: 9003,
  DEBUG_DELETE_ALL_BLOCK: 9004,
  DEBUG_FREEZE_ALL_CPU: 9005,
  DEBUG_UNFREEZE_ALL_CPU: 9006,
};

export type NOTIFICATION_TYPES = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

export const GAME_STATE = {
  WAITING: 1,
  PLAYING: 2,
  FINISHED: 3,
} as const;

export type GAME_STATE_TYPE = typeof GAME_STATE[keyof typeof GAME_STATE];

export const GAME_RESULT = {
  NONE: 0,
  WIN: 1,
  DRAW: 2,
};

export type GAME_RESULT_TYPE = typeof GAME_RESULT[keyof typeof GAME_RESULT];

export const PLAYER_GAME_STATE = {
  WAITING: 1,
  READY: 2,
  PLAYING: 3,
  FINISHED: 4,
};

export type PLAYER_GAME_STATE_TYPE = typeof PLAYER_GAME_STATE[keyof typeof PLAYER_GAME_STATE];

// インゲーム内で発生する、壁が落下するイベントが発生する時間(ms)
export const INGAME_EVENT_DROP_WALLS_TIME = 30000;

export const DIRECTION = {
  UP: 1,
  DOWN: 2,
  RIGHT: 3,
  LEFT: 4,
} as const;

export type DIRECTION_TYPE = typeof DIRECTION[keyof typeof DIRECTION];

export const MAX_PLAYER = 4;
export const DEBUG_DEFAULT_ENEMY_COUNT = 2;

/*
マップの定義
*/
export const DEFAULT_TIP_SIZE = 64;
export const TILE_ROWS = 13;
export const TILE_COLS = 15;
export const TILE_WIDTH = DEFAULT_TIP_SIZE;
export const TILE_HEIGHT = DEFAULT_TIP_SIZE;
export const MAX_BLOCKS = 100;

export const GROUND_TYPES = {
  top: 'top',
  left: 'left',
  right: 'right',
  bottom: 'bottom',
  top_left: 'top_left',
  top_right: 'top_right',
  bottom_left: 'bottom_left',
  bottom_right: 'bottom_right',
};

export const MAP_ASSETS = {
  grass_1: 'grass_1',
  grass_2: 'grass_2',
  rock_1: 'rock_1',
  rock_2: 'rock_2',
  plants: 'plants',
};

export const TILE_WALL = { INNER_CHAMFER: 30 };
export const TILE_BLOCK_IDX = 1;
export const PLAYER_WIDTH = DEFAULT_TIP_SIZE;
export const PLAYER_HEIGHT = DEFAULT_TIP_SIZE;

// character スプライト key
export const CHARACTERS = ['cat', 'wolf', 'bunny', 'pig'];

// Personajes jugables. El spriteKey permite reutilizar los sprites existentes
// mientras el sistema de personajes queda preparado para recibir sprites nuevos.
export const CHARACTER_PROFILES = {
  rigo: { spriteKey: 'cat', speed: 3.5, bombStrength: 3, maxBombCount: 2, hp: 2 },
  axel: { spriteKey: 'wolf', speed: 3.5, bombStrength: 2, maxBombCount: 1, hp: 1 },
  bruno: { spriteKey: 'bunny', speed: 2.5, bombStrength: 2, maxBombCount: 2, hp: 1 },
  kai: { spriteKey: 'pig', speed: 2.8, bombStrength: 2, maxBombCount: 1, hp: 1 },
  dante: { spriteKey: 'cat', speed: 3.0, bombStrength: 3, maxBombCount: 1, hp: 1 },
  milo: { spriteKey: 'wolf', speed: 2.6, bombStrength: 2, maxBombCount: 1, hp: 2 },
} as const;

export type CHARACTER_ID = keyof typeof CHARACTER_PROFILES;

/*
敵の定義
*/
export const ENEMY_EVALUATION_STEP = {
  BEGINNING: 'BEGINNING',
  MIDDLE: 'MIDDLE',
  END: 'END',
};

export type ENEMY_EVALUATION_STEPS =
  typeof ENEMY_EVALUATION_STEP[keyof typeof ENEMY_EVALUATION_STEP];

export const ENEMY_EVALUATION_RATIO_PER_STEP = {
  [ENEMY_EVALUATION_STEP.BEGINNING]: {
    ENEMY_EVALUATION_RATIO_FAR_FROM_OTHER_PLAYER: 0.4,
    ENEMY_EVALUATION_RATIO_BOMB: 0.4,
    ENEMY_EVALUATION_RATIO_GOOD_BOMB_PLACE: 0.2,
  },
  [ENEMY_EVALUATION_STEP.MIDDLE]: {
    ENEMY_EVALUATION_RATIO_FAR_FROM_OTHER_PLAYER: 0.5,
    ENEMY_EVALUATION_RATIO_BOMB: 0.4,
    ENEMY_EVALUATION_RATIO_GOOD_BOMB_PLACE: 0.1,
  },
  [ENEMY_EVALUATION_STEP.END]: {
    ENEMY_EVALUATION_RATIO_FAR_FROM_OTHER_PLAYER: 0.2,
    ENEMY_EVALUATION_RATIO_BOMB: 0.8,
  },
};

export const ENEMY_EVALUATION_RATIO_LABEL = {
  ENEMY_EVALUATION_RATIO_FAR_FROM_OTHER_PLAYER: 'ENEMY_EVALUATION_RATIO_FAR_FROM_OTHER_PLAYER',
  ENEMY_EVALUATION_RATIO_NEAREST: 'ENEMY_EVALUATION_RATIO_NEAREST',
  ENEMY_EVALUATION_RATIO_ITEM: 'ENEMY_EVALUATION_RATIO_ITEM',
  ENEMY_EVALUATION_RATIO_BOMB: 'ENEMY_EVALUATION_RATIO_BOMB',
  ENEMY_EVALUATION_RATIO_GOOD_BOMB_PLACE: 'ENEMY_EVALUATION_RATIO_GOOD_BOMB_PLACE',
} as const;

export type ENEMY_EVALUATION_RATIO_LABELS =
  typeof ENEMY_EVALUATION_RATIO_LABEL[keyof typeof ENEMY_EVALUATION_RATIO_LABEL];

/*
画面の定義
*/
export const HEADER_HEIGHT = 64;
export const HEIGHT = TILE_HEIGHT * TILE_ROWS + HEADER_HEIGHT;
export const MOBILE_HEIGHT = HEIGHT + 300;
export const WIDTH = TILE_WIDTH * TILE_COLS;
export const HEADER_COLOR_CODE = BLACK;
export const HEADER_TIMER_TEXT_COLOR_CODE = WHITE;
export const HEADER_WIDTH = WIDTH;

/*
プレイヤーの状態の定義
*/
export const DEFAULT_PLAYER_NAME = 'noname';
export const INITIAL_PLAYER_HP = 1;
export const MAX_PLAYER_HP = 3;
export const INITIAL_SETTABLE_BOMB_COUNT = 1;
export const MAX_SETTABLE_BOMB_COUNT = 8;
export const INITIAL_BOMB_STRENGTH = 2;
export const MAX_BOMB_STRENGTH = 12;
export const INITIAL_PLAYER_SPEED = 2.5;
export const MAX_PLAYER_SPEED = 5;
export const PLAYER_INVINCIBLE_TIME = 3000;
export const INITIAL_PLAYER_POSITION = [
  { x: PLAYER_WIDTH + PLAYER_WIDTH / 2, y: PLAYER_HEIGHT + PLAYER_HEIGHT / 2 + HEADER_HEIGHT },
  {
    x: PLAYER_WIDTH * (TILE_COLS - 2) + PLAYER_WIDTH / 2,
    y: PLAYER_HEIGHT + PLAYER_HEIGHT / 2 + HEADER_HEIGHT,
  },
  { x: PLAYER_WIDTH + PLAYER_WIDTH / 2, y: PLAYER_HEIGHT * (TILE_ROWS - 2) + PLAYER_HEIGHT / 2 + HEADER_HEIGHT },
  {
    x: PLAYER_WIDTH * (TILE_COLS - 2) + PLAYER_WIDTH / 2,
    y: PLAYER_HEIGHT * (TILE_ROWS - 2) + PLAYER_HEIGHT / 2 + HEADER_HEIGHT,
  },
];

export const OBJECT_LABEL = {
  PLAYER: 'player',
  BOMB: 'bomb',
  BLOCK: 'block',
  WALL: 'wall',
  ITEM: 'item',
  BLAST: 'blast',
  ENEMY: 'enemy',
} as const;
export type OBJECT_LABELS = typeof OBJECT_LABEL[keyof typeof OBJECT_LABEL];

export const COLLISION_CATEGORY = {
  DEFAULT: 0x0001,
  PLAYER: 0x0002,
  BOMB: 0x0004,
  WALL: 0x0008,
  BLOCK: 0x0010,
  ITEM: 0x0020,
  BLAST: 0x0040,
} as const;

export const PLAYER_TOLERANCE_DISTANCE = 10;

export const BOMB_TYPE = {
  NORMAL: 1,
  PENETRATION: 2,
} as const;
export type BOMB_TYPES = typeof BOMB_TYPE[keyof typeof BOMB_TYPE];

export const ITEM_TYPE = {
  BOMB: 1,
  FIRE: 2,
  SPEED: 3,
  HEART: 4,
  PENETRATION: 5,
} as const;
export type ITEM_TYPES = typeof ITEM_TYPE[keyof typeof ITEM_TYPE];
