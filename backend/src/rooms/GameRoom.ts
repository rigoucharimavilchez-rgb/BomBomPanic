import { Client, Room } from 'colyseus';
import Matter from 'matter-js';

import { IS_BACKEND_DEBUG } from '..';
import * as Constants from '../constants/constants';
import dropWalls from '../game_engine/services/dropWallService';
import PlacementObjectInterface from '../interfaces/placement_object';
import GameQueue from '../utils/gameQueue';
import GameEngine from './GameEngine';
import Block from './schema/Block';
import { Bomb } from './schema/Bomb';
import Enemy from './schema/Enemy';
import GameRoomState from './schema/GameRoomState';
import Item from './schema/Item';

const CHARACTER_PREFIX = /^\[\[char:([a-z0-9_-]+)\]\]/i;
const MAP_PREFIX = /^\[\[map:([a-z0-9_-]+)\]\]/i;

export default class GameRoom extends Room<GameRoomState> {
  engine!: GameEngine;
  private name?: string;
  private IsFinishedDropWallsEvent: boolean = false;
  private readonly enemies = new Map<string, Enemy>();

  async onCreate(options: any) {
    const { autoDispose, playerName } = options;
    const mapMatch = typeof playerName === 'string' ? playerName.match(MAP_PREFIX) : null;
    const selectedMap = mapMatch?.[1]?.toLowerCase() ?? 'green-garden';
    this.name = typeof playerName === 'string'
      ? playerName.replace(CHARACTER_PREFIX, '').replace(MAP_PREFIX, '')
      : '';
    this.maxClients = Constants.MAX_PLAYER;
    this.autoDispose = autoDispose;
    await this.setMetadata({ name: this.name, locked: false, mapId: selectedMap });

    this.clock.start();
    this.setState(new GameRoomState(selectedMap));
    this.engine = new GameEngine(this);

    this.onMessage(
      Constants.NOTIFICATION_TYPE.PLAYER_GAME_STATE,
      (client, gameState: Constants.PLAYER_GAME_STATE_TYPE) => {
        switch (gameState) {
          case Constants.PLAYER_GAME_STATE.READY: {
            if (this.state.gameState.isPlaying()) {
              const data = { serverTimer: this.state.timer };
              client.send(Constants.NOTIFICATION_TYPE.GAME_START_INFO, data);
              return;
            }

            const myPlayer = this.state.getPlayer(client.sessionId);
            if (myPlayer === undefined) return;
            myPlayer.setGameState(gameState);
            this.broadcast(Constants.NOTIFICATION_TYPE.PLAYER_IS_READY, client.sessionId);

            let isLobbyReady = true;
            this.state.players.forEach(
              (player) => (isLobbyReady = isLobbyReady && player.isReady())
            );
            if (isLobbyReady) {
              const data = { serverTimer: this.state.timer };
              this.startGame()
                .then(() => this.broadcast(Constants.NOTIFICATION_TYPE.GAME_START_INFO, data))
                .catch((err) => console.log(err));
            }
          }
        }
      }
    );

    this.onMessage(Constants.NOTIFICATION_TYPE.PLAYER_MOVE, (client, data: any) => {
      const player = this.state.getPlayer(client.sessionId);
      if (player === undefined) return;
      if (player.isDead()) return;
      player.inputQueue.push(data);
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.PLAYER_BOMB, (client) => {
      const player = this.state.getPlayer(client.sessionId);
      if (player === undefined) return;
      this.engine.bombService.enqueueBomb(player);
    });

    this.clock.setInterval(() => this.state.setGameResult(), Constants.CHECK_GAME_RESULT_INTERVAL);

    let elapsedTime: number = 0;
    this.setSimulationInterval((deltaTime) => {
      elapsedTime += deltaTime;
      this.state.timer.updateNow();
      this.timeEventHandler();
      this.enemyHandler();

      while (elapsedTime >= Constants.FRAME_RATE) {
        this.state.timer.updateNow();
        elapsedTime -= Constants.FRAME_RATE;

        for (const [, player] of this.state.players) {
          if (this.enemies.get(player.sessionId) === undefined) {
            this.engine.playerService.updatePlayer(player);
          } else {
            this.engine.enemyService.updateEnemy(player as Enemy);
          }
        }

        this.engine.bombService.updateBombCollision();
        this.objectCreateHandler(this.state.getBombToCreateQueue(), (bomb) => this.createBombEvent(bomb));
        this.objectRemoveHandler(this.state.getBombToExplodeQueue(), (bomb) => this.removeBombEvent(bomb));
        this.objectRemoveHandler(this.state.getBlockToDestroyQueue(), (block) => this.removeBlockEvent(block));
        this.objectRemoveHandler(this.state.getItemToDestroyQueue(), (item) => this.removeItemEvent(item));
        Matter.Engine.update(this.engine.engine, deltaTime);
      }
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.DEBUG_PLAYER_WIN, (client, data: any) => {
      if (!IS_BACKEND_DEBUG) return;
      for (const [, player] of this.state.players) {
        if (player.sessionId === client.sessionId) continue;
        player.damaged(player.hp);
      }
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.DEBUG_DRAW, (client, data: any) => {
      if (!IS_BACKEND_DEBUG) return;
      for (const [, player] of this.state.players) player.damaged(player.hp);
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.DEBUG_PLAYER_STATUS_MAX, (client, data: any) => {
      if (!IS_BACKEND_DEBUG) return;
      this.state.players.get(client.sessionId)?.debugSetPlayerStatusMax();
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.DEBUG_ALL_PLAYER_STATUS_MAX, (client, data: any) => {
      if (!IS_BACKEND_DEBUG) return;
      for (const [, player] of this.state.players) player.debugSetPlayerStatusMax();
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.DEBUG_DELETE_ALL_BLOCK, (client, data: any) => {
      if (!IS_BACKEND_DEBUG) return;
      this.state.blocks.forEach((block) => {
        block.removedAt = Date.now() + Constants.OBJECT_REMOVAL_DELAY;
        this.state.getBlockToDestroyQueue().enqueue(block);
      });
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.DEBUG_FREEZE_ALL_CPU, (client, data: any) => {
      if (!IS_BACKEND_DEBUG) return;
      this.state.enemies.forEach((enemy) => enemy.debugSetFreeze());
    });

    this.onMessage(Constants.NOTIFICATION_TYPE.DEBUG_UNFREEZE_ALL_CPU, (client, data: any) => {
      if (!IS_BACKEND_DEBUG) return;
      this.state.enemies.forEach((enemy) => enemy.debugSetUnFreeze());
    });
  }

  private async startGame() {
    if (!this.state.gameState.isPlaying()) {
      await this.lock();
      await this.setMetadata({ locked: true });
      this.addEnemy();
      this.state.gameState.setPlaying();
      this.state.setTimer();
    }
  }

  private addEnemy() {
    const enemyCount = Constants.MAX_PLAYER - this.state.getPlayersCount();
    for (let i = 0; i < enemyCount; i++) {
      const enemy = this.engine.enemyService.addEnemy(`enemy-${i}`);
      this.enemies.set(`enemy-${i}`, enemy);
      this.state.enemies.push(enemy);
    }
  }

  onJoin(client: Client, options: { playerName: string }) {
    console.log(client.sessionId, 'joined!');
    this.engine.playerService.addPlayer(client.sessionId, options.playerName);
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.getPlayer(client.sessionId);
    if (player !== undefined) this.state.playerIdxsAvail[player.idx] = true;
    this.engine.playerService.deletePlayer(client.sessionId);
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }

  private createBombEvent(b: PlacementObjectInterface) {
    const bomb = b as Bomb;
    const isPlaced = this.engine.playerService.placeBomb(bomb);
    if (isPlaced) this.state.getBombToExplodeQueue().enqueue(bomb);
    else this.engine.bombService.deleteBomb(bomb);
  }

  private removeBombEvent(b: PlacementObjectInterface) {
    this.engine.bombService.explode(b as Bomb);
  }

  private removeBlockEvent(b: PlacementObjectInterface) {
    this.engine.mapService.destroyBlock(b as Block);
  }

  private removeItemEvent(b: PlacementObjectInterface) {
    this.engine.itemService.removeItem(b as Item);
  }

  private objectCreateHandler(queue: GameQueue<PlacementObjectInterface>, callback: (data: PlacementObjectInterface) => void) {
    while (!queue.isEmpty()) {
      const data = queue.read();
      if (data === undefined || !data.isCreatedTime()) break;
      callback(data);
      queue.dequeue();
    }
  }

  private objectRemoveHandler(queue: GameQueue<PlacementObjectInterface>, callback: (data: PlacementObjectInterface) => void) {
    while (!queue.isEmpty()) {
      const data = queue.read();
      if (data === undefined || !data.isRemovedTime()) break;
      callback(data);
      queue.dequeue();
    }
  }

  private timeEventHandler() {
    if (!this.state.gameState.isPlaying()) return;
    if (this.state.timer.getRemainTime() <= Constants.INGAME_EVENT_DROP_WALLS_TIME) {
      if (!this.IsFinishedDropWallsEvent) dropWalls(this.engine);
      this.IsFinishedDropWallsEvent = true;
    }
  }

  private enemyHandler() {
    if (!this.state.gameState.isPlaying()) return;
    if (!this.state.timer.isOpeningFinished()) return;
    this.engine.enemyService.calcAdjustablePosition();
  }
}
