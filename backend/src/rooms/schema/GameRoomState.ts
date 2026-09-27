import { MapSchema, Schema, type } from '@colyseus/schema';
import { faker } from '@faker-js/faker';

import * as Constants from '../../constants/constants';
import GameQueue from '../../utils/gameQueue';
import { PixelToTile } from '../../utils/map';
import { generateGameResult } from '../GameResultHandler';
import Blast from './Blast';
import Block from './Block';
import { Bomb } from './Bomb';
import Enemy from './Enemy';
import GameResult from './GameResult';
import GameState from './GameState';
import Item from './Item';
import Map from './Map';
import Player from './Player';
import Timer from './Timer';

const CHARACTER_PREFIX = /^\[\[char:([a-z0-9_-]+)\]\]/i;

export default class GameRoomState extends Schema {
  @type(GameState)
  gameState: GameState = new GameState();

  @type(Timer)
  readonly timer = new Timer();

  @type(GameResult)
  gameResult!: GameResult;

  playerIdxsAvail: boolean[] = new Array(Constants.MAX_PLAYER).fill(true);
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Bomb }) bombs = new MapSchema<Bomb>();
  @type({ map: Blast }) blasts = new MapSchema<Blast>();
  @type({ map: Item }) items = new MapSchema<Item>();
  @type({ map: Block }) blocks = new MapSchema<Block>();

  private readonly bombToCreateQueue: GameQueue<Bomb> = new GameQueue<Bomb>();
  private readonly bombToExplodeQueue: GameQueue<Bomb> = new GameQueue<Bomb>();
  private readonly blockToDestroyQueue: GameQueue<Block> = new GameQueue<Block>();
  private readonly itemToDestroyQueue: GameQueue<Item> = new GameQueue<Item>();

  readonly enemies: Enemy[] = [];

  @type(Map) gameMap = new Map();

  getPlayer(sessionId: string): Player | undefined {
    return this.players.get(sessionId);
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayersCount() {
    return this.players.size;
  }

  getAvailablePlayers(): Player[] {
    return Array.from(this.players.values()).filter((player) => !player.isDead());
  }

  getAlivePlayers() {
    return this.getPlayers().filter((player) => !player.isDead());
  }

  setTimer() {
    this.timer.set(Date.now());
  }

  setGameResult() {
    const r = generateGameResult(this);
    if (r !== undefined) {
      this.gameResult = r;
      this.gameState.setFinished();
    }
  }

  createPlayer(sessionId: string, rawPlayerName: string, characterId?: string): Player | undefined {
    const idx = this.getPlayerIdx();
    if (idx === -1) return;

    // CharacterSelect prefixes the name so the existing room API can carry the selection
    // without changing the Colyseus room protocol. The prefix never reaches the visible name.
    const match = rawPlayerName.match(CHARACTER_PREFIX);
    const embeddedCharacter = match?.[1]?.toLowerCase();
    const selectedCharacter = characterId ?? embeddedCharacter;
    const playerName = rawPlayerName.replace(CHARACTER_PREFIX, '');

    const player = new Player(sessionId, idx, playerName, selectedCharacter);
    player.idx = idx;
    player.x = Constants.INITIAL_PLAYER_POSITION[idx].x;
    player.y = Constants.INITIAL_PLAYER_POSITION[idx].y;
    this.players.set(sessionId, player);
    return player;
  }

  createEnemy(sessionId: string): Enemy {
    const name = faker.name.firstName().slice(0, Constants.MAX_USER_NAME_LENGTH - 1);
    const enemy = new Enemy(sessionId, this.getPlayersCount(), name);
    const idx = this.getPlayersCount();
    enemy.idx = idx;
    enemy.x = Constants.INITIAL_PLAYER_POSITION[idx].x;
    enemy.y = Constants.INITIAL_PLAYER_POSITION[idx].y;
    this.players.set(sessionId, enemy);
    return enemy;
  }

  deleteBomb(bomb: Bomb) {
    this.bombs.delete(bomb.id);
  }

  getBombToCreateQueue(): GameQueue<Bomb> {
    return this.bombToCreateQueue;
  }

  getBombToExplodeQueue(): GameQueue<Bomb> {
    return this.bombToExplodeQueue;
  }

  getBlockToDestroyQueue(): GameQueue<Block> {
    return this.blockToDestroyQueue;
  }

  getItemToDestroyQueue(): GameQueue<Item> {
    return this.itemToDestroyQueue;
  }

  createItem(x: number, y: number, itemType: Constants.ITEM_TYPES) {
    const item = new Item(x, y, itemType);
    this.items.set(item.id, item);
    return item;
  }

  deleteItem(item: Item) {
    this.items.delete(item.id);
  }

  getPlayerIdx() {
    for (let i = 0; i < this.playerIdxsAvail.length; i++) {
      if (this.playerIdxsAvail[i]) {
        this.playerIdxsAvail[i] = false;
        return i;
      }
    }

    return -1;
  }

  hasBomb(bombMap: number[][]): number[][] {
    const result = Array(bombMap.length)
      .fill(undefined)
      .map(() => Array(bombMap[0].length).fill(undefined));

    for (const key of this.bombs.keys()) {
      const bomb = this.bombs.get(key);
      if (bomb === undefined) continue;
      const { x, y } = PixelToTile(bomb.x, bomb.y);
      result[y][x] = bomb;
    }

    return result;
  }
}
