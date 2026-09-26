import Phaser from 'phaser';

import * as Constants from '../../../backend/src/constants/constants';
import { calcBlastRangeFromDirection } from '../../../backend/src/game_engine/services/blastService';
import * as Config from '../config/config';
import collisionHandler from '../game_engine/collision_handler/collision_handler';
import { phaserGlobalGameObject } from '../PhaserGame';
import Game from '../scenes/Game';
import { getDimensionalMap, getHighestPriorityFromBodies } from '../services/Map';
import { getGameScene } from '../utils/globalGame';
import { getDepth } from './util';

export default class Bomb extends Phaser.Physics.Matter.Sprite {
  private readonly id: string;
  private readonly stableX: number;
  private readonly stableY: number;
  private readonly stableScene: Phaser.Scene;
  private readonly bombType: Constants.BOMB_TYPES;
  private readonly bombStrength: number;
  private readonly sessionId: string;
  private readonly removedAt: number;
  private isExploded: boolean;
  private readonly blastPointSprites: Phaser.GameObjects.Image[] = [];
  private readonly se;
  private bombPulseTween?: Phaser.Tweens.Tween;

  constructor(
    id: string,
    sessionId: string,
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    bombType: Constants.BOMB_TYPES,
    bombStrength: number,
    texture: string,
    removedAt: number
  ) {
    super(world, x, y, texture);

    const body = this.body as MatterJS.BodyType;
    body.label = Constants.OBJECT_LABEL.BOMB;

    this.id = id;
    this.setDepth(getDepth(body.label as Constants.OBJECT_LABELS));
    this.sessionId = sessionId;
    this.removedAt = removedAt;
    this.stableX = x;
    this.stableY = y;
    this.bombType = bombType;
    this.bombStrength = bombStrength;
    this.isExploded = false;
    this.stableScene = this.scene;
    this.se = this.scene.sound.add('bombExplode', {
      volume: Config.SOUND_VOLUME,
    });

    // Efecto puramente visual: la bomba "respira" suavemente mientras espera.
    // No modifica posición, física ni temporizador.
    if (this.active && this.scene?.tweens) {
      this.bombPulseTween = this.scene.tweens.add({
        targets: this,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 280,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    if (Config.IS_SHOW_BLAST_POINT) this.displayBlastPoint();
  }

  static getSettablePosition(x: number, y: number): { x: number; y: number } {
    const bx = Math.floor(x / Constants.TILE_WIDTH) * Constants.TILE_WIDTH + Constants.TILE_WIDTH / 2;
    const by = Math.floor(y / Constants.TILE_HEIGHT) * Constants.TILE_HEIGHT + Constants.TILE_HEIGHT / 2;
    return { x: bx, y: by };
  }

  private addBlastSprite(
    bx: number,
    by: number,
    playKey: string,
    angle: number = 0,
    rectVertical: boolean = false,
    rectHorizontal: boolean = false,
    scale: number = 1
  ) {
    const rx = rectVertical
      ? Constants.DEFAULT_TIP_SIZE * Constants.BLAST_COLLISION_RATIO_X
      : Constants.DEFAULT_TIP_SIZE * Constants.BLAST_COLLISION_RATIO_Y;
    const ry = rectHorizontal
      ? Constants.DEFAULT_TIP_SIZE * Constants.BLAST_COLLISION_RATIO_X
      : Constants.DEFAULT_TIP_SIZE * Constants.BLAST_COLLISION_RATIO_Y;

    const blast = this.stableScene.add
      .blast(this.sessionId, bx, by, playKey, rx, ry)
      .setScale(scale * 0.88, scale * 0.88)
      .setAngle(angle)
      .play(playKey)
      .setSensor(true);

    // Entrada rápida de la explosión: pequeño "pop" cartoon sin tocar su hitbox.
    if (blast.active && this.stableScene.tweens) {
      this.stableScene.tweens.add({
        targets: blast,
        scaleX: scale,
        scaleY: scale,
        alpha: 1,
        duration: 100,
        ease: 'Back.Out',
      });
    }
  }

  private addDirectionBlast(direction: Constants.DIRECTION_TYPE, power: number) {
    if (power === 0) return;
    let angle = 0;
    let dynamicX = 0;
    let dynamicY = 0;

    if (direction === Constants.DIRECTION.RIGHT) {
      angle = 0;
      dynamicX = Constants.TILE_WIDTH;
    } else if (direction === Constants.DIRECTION.DOWN) {
      angle = 90;
      dynamicY = Constants.TILE_HEIGHT;
    } else if (direction === Constants.DIRECTION.LEFT) {
      angle = 180;
      dynamicX = -Constants.TILE_WIDTH;
    } else if (direction === Constants.DIRECTION.UP) {
      angle = 270;
      dynamicY = -Constants.TILE_HEIGHT;
    }

    const prefix = this.bombType === Constants.BOMB_TYPE.PENETRATION ? 'penetration_' : '';
    if (power > 1) {
      for (let i = 1; i < power; i++) {
        this.addBlastSprite(
          this.stableX + dynamicX * i,
          this.stableY + dynamicY * i,
          `${prefix}bomb_horizontal_blast`,
          angle,
          false,
          true
        );
      }
    }

    this.addBlastSprite(
      this.stableX + dynamicX * power,
      this.stableY + dynamicY * power,
      `${prefix}bomb_horizontal_end_blast`,
      angle,
      false,
      true
    );
  }

  private displayBlastPoint() {
    if (this.isExploded) return;

    const game = getGameScene();
    const imageName =
      this.bombType === Constants.BOMB_TYPE.PENETRATION ? 'penetration_bomb_point' : 'bomb_point';
    const addBlastPoint = (x: number, y: number) => game.add.image(x, y, imageName).setScale(0.7);

    this.blastPointSprites.push(addBlastPoint(this.stableX, this.stableY));

    const br = this.calcBlastRange();

    br.forEach((power: number, key: number) => {
      let dynamicX = 0;
      let dynamicY = 0;
      if (power === 0) return;
      if (key === Constants.DIRECTION.RIGHT) dynamicX = Constants.TILE_WIDTH;
      if (key === Constants.DIRECTION.DOWN) dynamicY = Constants.TILE_HEIGHT;
      if (key === Constants.DIRECTION.LEFT) dynamicX = -Constants.TILE_WIDTH;
      if (key === Constants.DIRECTION.UP) dynamicY = -Constants.TILE_HEIGHT;

      for (let i = 1; i <= power; i++) {
        this.blastPointSprites.push(
          addBlastPoint(this.stableX + dynamicX * i, this.stableY + dynamicY * i)
        );
      }
    });
  }

  explode() {
    if (this.isExploded) return;
    this.blastPointSprites.forEach((sprite) => sprite.destroy());

    if (this.bombPulseTween) {
      this.bombPulseTween.stop();
      this.bombPulseTween = undefined;
    }

    this.se.play();
    const prefix = this.bombType === Constants.BOMB_TYPE.PENETRATION ? 'penetration_' : '';
    this.addBlastSprite(
      this.stableX,
      this.stableY,
      `${prefix}bomb_center_blast`,
      0,
      true,
      true,
      1.2
    );

    const br = this.calcBlastRange();
    this.addDirectionBlast(Constants.DIRECTION.UP, br.get(Constants.DIRECTION.UP) ?? 1);
    this.addDirectionBlast(Constants.DIRECTION.DOWN, br.get(Constants.DIRECTION.DOWN) ?? 1);
    this.addDirectionBlast(Constants.DIRECTION.RIGHT, br.get(Constants.DIRECTION.RIGHT) ?? 1);
    this.addDirectionBlast(Constants.DIRECTION.LEFT, br.get(Constants.DIRECTION.LEFT) ?? 1);
  }

  isRemovedTime(): boolean {
    return this.getRemainTime() <= 0;
  }

  private calcBlastRange(): Map<Constants.DIRECTION_TYPE, number> {
    const scene = phaserGlobalGameObject().scene.getScene(Config.SCENE_NAME_GAME);
    const game = scene as Game;
    const map = getDimensionalMap(
      game.getRows(),
      game.getCols(),
      scene,
      getHighestPriorityFromBodies
    );

    const power = this.bombStrength;
    const x = (this.stableX - Constants.TILE_WIDTH / 2) / Constants.TILE_WIDTH;
    const y =
      (this.stableY - Constants.TILE_HEIGHT / 2 - Constants.HEADER_HEIGHT) / Constants.TILE_HEIGHT;

    const m = new Map<Constants.DIRECTION_TYPE, number>();
    m.set(Constants.DIRECTION.UP, calcBlastRangeFromDirection(map, x, y, power, Constants.DIRECTION.UP, this.bombType));
    m.set(Constants.DIRECTION.DOWN, calcBlastRangeFromDirection(map, x, y, power, Constants.DIRECTION.DOWN, this.bombType));
    m.set(Constants.DIRECTION.LEFT, calcBlastRangeFromDirection(map, x, y, power, Constants.DIRECTION.LEFT, this.bombType));
    m.set(Constants.DIRECTION.RIGHT, calcBlastRangeFromDirection(map, x, y, power, Constants.DIRECTION.RIGHT, this.bombType));
    return m;
  }

  updateCollision() {
    this.setSensor(false);

    const obj = this.setRectangle(
      Constants.TILE_WIDTH,
      Constants.TILE_HEIGHT
    ) as Phaser.Physics.Matter.Sprite;
    obj.setStatic(true);

    const body = this.body as MatterJS.BodyType;
    body.label = Constants.OBJECT_LABEL.BOMB;
    this.setDepth(getDepth(body.label as Constants.OBJECT_LABELS));
  }

  isOverlapping(mp: Phaser.Physics.Matter.MatterPhysics, target: MatterJS.BodyType) {
    return mp.overlap(this.body as MatterJS.BodyType, [target]);
  }

  afterExplosion() {
    if (this.bombPulseTween) {
      this.bombPulseTween.stop();
      this.bombPulseTween = undefined;
    }
    this.destroy();
    this.isExploded = true;
  }

  detonated(id: string) {
    setTimeout(() => {
      this.explode();
      this.afterExplosion();
    }, Constants.BOMB_DETONATION_DELAY);
  }

  getRemainTime(): number {
    if (this.removedAt === null || this.removedAt === 0) return 0;
    const now: number = getGameScene().getNetwork().now();
    return this.removedAt - now <= 0 ? 0 : this.removedAt - now;
  }

  public getIsExploded(): boolean {
    return this.isExploded;
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'bomb',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    id: string,
    sessionId: string,
    x: number,
    y: number,
    bombType: Constants.BOMB_TYPES,
    bombStrength: number,
    removedAt: number
  ) {
    const sprite = new Bomb(
      id,
      sessionId,
      this.scene.matter.world,
      x,
      y,
      bombType,
      bombStrength,
      'bomb',
      removedAt
    );

    this.displayList.add(sprite);
    this.updateList.add(sprite);

    sprite.setStatic(true);
    sprite.setSensor(true);

    sprite.play(
      {
        key: Config.BOMB_ANIMATION_KEY,
        frameRate: Config.BOMB_SPRITE_FRAME_COUNT / (sprite.getRemainTime() / 1000),
      },
      false
    );

    const timer = setInterval(() => {
      if (sprite.isRemovedTime()) {
        if (!sprite.getIsExploded()) {
          sprite.explode();
          sprite.afterExplosion();
        }
        clearInterval(timer);
      }
    }, 10);

    return sprite;
  }
);

export class Blast extends Phaser.Physics.Matter.Sprite {
  private readonly sessionId: string;
  constructor(
    world: Phaser.Physics.Matter.World,
    sessionId: string,
    x: number,
    y: number,
    texture: string,
    rectangleX: number,
    rectangleY: number
  ) {
    super(world, x, y, texture);
    this.sessionId = sessionId;
    this.setRectangle(rectangleX, rectangleY);
    this.setDepth(getDepth(Constants.OBJECT_LABEL.BLAST));
    this.setOnCollide((data: Phaser.Types.Physics.Matter.MatterCollisionData) => {
      const currBody = this.body as MatterJS.BodyType;
      data.bodyA.id === currBody.id
        ? collisionHandler(data.bodyA, data.bodyB)
        : collisionHandler(data.bodyB, data.bodyA);
    });

    const body = this.body as MatterJS.BodyType;
    body.label = Constants.OBJECT_LABEL.BLAST;
  }

  playAnim() {
    this.scene.time.addEvent({
      delay: Constants.BLAST_AVAILABLE_TIME,
      callback: () => {
        if (this.active) this.destroy();
      },
    });
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'blast',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    sessionId: string,
    x: number,
    y: number,
    texture: string,
    rectangleX: number,
    rectangleY: number
  ) {
    const sprite = new Blast(
      this.scene.matter.world,
      sessionId,
      x,
      y,
      texture,
      rectangleX,
      rectangleY
    );

    this.displayList.add(sprite);
    this.updateList.add(sprite);
    sprite.playAnim();
    return sprite;
  }
);
