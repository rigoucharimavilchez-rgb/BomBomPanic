import { Schema, type } from '@colyseus/schema';

import * as Constants from '../../constants/constants';
import { PixelToTile } from '../../utils/map';
import { validateAndFixUserName } from '../../utils/validation';
import { IS_BACKEND_DEBUG } from '../../index';

type CharacterProfile = {
  spriteKey: string;
  speed: number;
  bombStrength: number;
  maxBombCount: number;
  hp: number;
};

const CHARACTER_PROFILES: Record<string, CharacterProfile> = {
  // Rigo is deliberately stronger, but the frontend keeps him locked until 20 wins.
  rigo: { spriteKey: 'cat', speed: 3.5, bombStrength: 3, maxBombCount: 2, hp: 2 },
  axel: { spriteKey: 'wolf', speed: 3.5, bombStrength: 2, maxBombCount: 1, hp: 1 },
  bruno: { spriteKey: 'bunny', speed: 2.5, bombStrength: 2, maxBombCount: 2, hp: 1 },
  kai: { spriteKey: 'pig', speed: 2.8, bombStrength: 2, maxBombCount: 1, hp: 1 },
  dante: { spriteKey: 'cat', speed: 3.0, bombStrength: 3, maxBombCount: 1, hp: 1 },
  milo: { spriteKey: 'wolf', speed: 2.6, bombStrength: 2, maxBombCount: 1, hp: 2 },
};

const DEFAULT_PROFILE: CharacterProfile = {
  spriteKey: Constants.CHARACTERS[0],
  speed: Constants.INITIAL_PLAYER_SPEED,
  bombStrength: Constants.INITIAL_BOMB_STRENGTH,
  maxBombCount: Constants.INITIAL_SETTABLE_BOMB_COUNT,
  hp: Constants.INITIAL_PLAYER_HP,
};

export default class Player extends Schema {
  @type('string')
  sessionId: string;

  @type('number')
  gameState: Constants.PLAYER_GAME_STATE_TYPE = Constants.PLAYER_GAME_STATE.WAITING;

  @type('string')
  character: string;

  // プレイヤーの番号
  @type('number')
  idx: number;

  @type('string')
  name: string;

  @type('number')
  x: number;

  @type('number')
  y: number;

  @type('number')
  vx: number = 0;

  @type('number')
  vy: number = 0;

  @type('number')
  frameKey = 0;

  @type('number')
  hp: number;

  @type('number')
  speed: number = Constants.INITIAL_PLAYER_SPEED;

  @type('number')
  bombType: Constants.BOMB_TYPES;

  @type('number')
  bombStrength: number;

  @type('number')
  currentSetBombCount: number;

  @type('number')
  maxBombCount: number;

  getItemMap: Map<Constants.ITEM_TYPES, number>;

  @type('number')
  lastDamagedAt: number;

  @type('number')
  diedAt: number;

  @type('boolean')
  isCPU = false;

  inputQueue: any[] = [];

  constructor(sessionId: string, idx: number, name: string = '', characterId?: string) {
    super();
    this.sessionId = sessionId;
    this.idx = idx;

    const profile = characterId !== undefined ? CHARACTER_PROFILES[characterId] : undefined;
    const activeProfile = profile ?? DEFAULT_PROFILE;

    this.character = activeProfile.spriteKey;
    this.name = validateAndFixUserName(name);
    this.hp = activeProfile.hp;
    this.speed = activeProfile.speed;
    this.bombType = Constants.BOMB_TYPE.NORMAL;
    this.bombStrength = activeProfile.bombStrength;
    this.currentSetBombCount = 0;
    this.maxBombCount = activeProfile.maxBombCount;
    this.getItemMap = new Map<Constants.ITEM_TYPES, number>();
    this.lastDamagedAt = 0;
    this.diedAt = Infinity;
    this.x = Constants.INITIAL_PLAYER_POSITION[idx].x;
    this.y = Constants.INITIAL_PLAYER_POSITION[idx].y;
  }

  damaged(damage: number) {
    if (this.isInvincible()) return;

    this.hp - damage < 0 ? (this.hp = 0) : (this.hp -= damage);
    if (this.isDead()) this.diedAt = Date.now();

    this.updateLastDamagedAt();
  }

  isInvincible(): boolean {
    return this.lastDamagedAt + Constants.PLAYER_INVINCIBLE_TIME > Date.now();
  }

  updateLastDamagedAt() {
    this.lastDamagedAt = Date.now();
  }

  healed(recover: number) {
    this.hp + recover > Constants.MAX_PLAYER_HP
      ? (this.hp = Constants.MAX_PLAYER_HP)
      : (this.hp += recover);
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  setBombType(t: Constants.BOMB_TYPES) {
    this.bombType = t;
  }

  getBombType(): Constants.BOMB_TYPES {
    return this.bombType;
  }

  getBombStrength(): number {
    return this.bombStrength;
  }

  setBombStrength(bombStrength: number) {
    this.bombStrength =
      bombStrength > Constants.MAX_BOMB_STRENGTH ? Constants.MAX_BOMB_STRENGTH : bombStrength;
  }

  getSpeed(): number {
    return this.speed;
  }

  setSpeed(speed: number) {
    this.speed = speed > Constants.MAX_PLAYER_SPEED ? Constants.MAX_PLAYER_SPEED : speed;
  }

  canSetBomb(): boolean {
    return this.maxBombCount - this.currentSetBombCount > 0;
  }

  isSetBomb(): boolean {
    return this.currentSetBombCount > 0;
  }

  increaseSetBombCount() {
    if (this.canSetBomb()) this.currentSetBombCount++;
  }

  decreaseSetBombCount() {
    this.currentSetBombCount--;
    if (this.currentSetBombCount < 0) this.currentSetBombCount = 0;
  }

  increaseMaxBombCount(count = 1) {
    if (this.maxBombCount + count > Constants.MAX_SETTABLE_BOMB_COUNT) {
      this.maxBombCount = Constants.MAX_SETTABLE_BOMB_COUNT;
    } else {
      this.maxBombCount += count;
    }
  }

  setGameState(gameState: Constants.PLAYER_GAME_STATE_TYPE) {
    this.gameState = gameState;
  }

  isWaiting() {
    return this.gameState === Constants.PLAYER_GAME_STATE.WAITING;
  }

  isReady() {
    return this.gameState === Constants.PLAYER_GAME_STATE.READY;
  }

  setPlayerName(playerName: string) {
    this.name = playerName;
  }

  incrementItem(itemType: Constants.ITEM_TYPES) {
    const count = this.getItemMap.get(itemType);

    if (count === undefined) {
      this.getItemMap.set(itemType, 1);
    } else {
      this.getItemMap.set(itemType, count + 1);
    }
  }

  getItemMapTotalCount(): number {
    let count = 0;
    this.getItemMap.forEach((value) => {
      count += value;
    });
    return count;
  }

  getTilePosition(): { x: number; y: number } {
    return PixelToTile(this.x, this.y);
  }

  debugSetPlayerStatusMax() {
    if (!IS_BACKEND_DEBUG) return;
    this.hp = Constants.MAX_PLAYER_HP;
    this.speed = Constants.MAX_PLAYER_SPEED;
    this.maxBombCount = Constants.MAX_SETTABLE_BOMB_COUNT;
    this.bombStrength = Constants.MAX_BOMB_STRENGTH;
  }
}
