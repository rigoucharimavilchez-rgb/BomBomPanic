import Phaser from 'phaser';

import * as Constants from '../../../backend/src/constants/constants';
import * as Config from '../config/config';
import Bomb from '../items/Bomb';
import { getDepth } from '../items/util';
import { getGameScene } from '../utils/globalGame';

export default class Player extends Phaser.Physics.Matter.Sprite {
  name: string;
  character: string;
  private hp: number;
  private speed: number;
  private bombType: Constants.BOMB_TYPES;
  private bombStrength: number;
  private maxBombCount: number;
  private readonly sessionId: string;
  private readonly hit_se;
  nameLabel!: Phaser.GameObjects.Container;
  nameText!: Phaser.GameObjects.Text;
  private nameBadge!: Phaser.GameObjects.Graphics;
  private nameTriangle!: Phaser.GameObjects.Triangle;
  lastDirection: 'right' | 'left' | 'up' | 'down' = 'down';
  dmgAnimPlaying = false;

  constructor(
    sessionId: string,
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
    name?: string,
    options?: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    super(world, x, y, texture, frame, options);
    this.name = name === undefined ? Constants.DEFAULT_PLAYER_NAME : name;
    this.character = texture;
    this.hp = Constants.INITIAL_PLAYER_HP;
    this.sessionId = sessionId;
    this.speed = Constants.INITIAL_PLAYER_SPEED;
    this.bombType = Constants.BOMB_TYPE.NORMAL;
    this.bombStrength = Constants.INITIAL_BOMB_STRENGTH;
    this.maxBombCount = Constants.INITIAL_SETTABLE_BOMB_COUNT;

    this.setScale(1.3, 1);
    this.setRectangle(Constants.PLAYER_WIDTH, Constants.PLAYER_HEIGHT, {
      chamfer: 10,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      restitution: 0,
    });
    this.setFixedRotation();

    const body = this.body as MatterJS.BodyType;
    body.label = Constants.OBJECT_LABEL.PLAYER;

    this.setDepth(getDepth(body.label as Constants.OBJECT_LABELS));
    this.hit_se = this.scene.sound.add('hitPlayer', {
      volume: Config.SOUND_VOLUME,
    });
  }

  addNameLabel(triangleColor: number) {
    const game = getGameScene();
    const nameText = game.add
      .text(0, -35, this.name, {
        fontSize: '16px',
        fontFamily: 'PressStart2P',
        color: '#ffffff',
        stroke: '#25324a',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Friendly sticker-like name badge.
    const badgeWidth = Math.max(84, nameText.width + 26);
    const badge = game.add.graphics();
    badge.fillStyle(0x57b9f5, 0.98);
    badge.fillRoundedRect(-badgeWidth / 2, -51, badgeWidth, 32, 11);
    badge.lineStyle(3, 0xffffff, 1);
    badge.strokeRoundedRect(-badgeWidth / 2, -51, badgeWidth, 32, 11);

    const triangle = game.add.triangle(0, -18, -6, -5, 16, -5, 5, 5, triangleColor);
    triangle.setStrokeStyle(2, 0xffffff, 0.95);

    this.nameText = nameText;
    this.nameBadge = badge;
    this.nameTriangle = triangle;
    this.nameLabel = game.add
      .container(this.x, this.y, [badge, nameText, triangle])
      .setDepth(1000);
  }

  getHP(): number {
    return this.hp;
  }

  setHP(hp: number): boolean {
    if (this.hp === hp) return true;

    if (this.hp > hp) {
      this.damaged(this.hp - hp);
      return false;
    } else {
      this.healed(hp - this.hp);
      return true;
    }
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  private damaged(damage: number) {
    this.hit_se.play();
    this.hp -= damage;
    this.animationShakeScreen();
    this.dmgAnimPlaying = true;
    this.play(`${this.character}_damage_${this.lastDirection}`).on('animationcomplete', () => {
      this.dmgAnimPlaying = false;
      this.animationFlash(Constants.PLAYER_INVINCIBLE_TIME);
    });
  }

  private healed(healedHp: number) {
    this.hp += healedHp;
  }

  canSetBomb(): boolean {
    if (this.isDead()) return false;

    const { x, y } = Bomb.getSettablePosition(this.x, this.y);
    const game = getGameScene();
    const bodies = game.matter.intersectPoint(x, y);
    for (let i = 0; i < bodies.length; i++) {
      const bodyType = bodies[i] as MatterJS.BodyType;
      if (bodyType.label === Constants.OBJECT_LABEL.BOMB) return false;
    }
    return true;
  }

  getSessionId() { return this.sessionId; }
  getBombType(): Constants.BOMB_TYPES { return this.bombType; }
  setBombType(bombType: Constants.BOMB_TYPES): boolean {
    if (this.bombType === bombType) return false;
    this.bombType = bombType;
    return true;
  }
  getBombStrength(): number { return this.bombStrength; }
  getSpeed(): number { return this.speed; }
  setSpeed(speed: number): boolean {
    if (this.speed === speed) return false;
    this.speed = speed;
    return true;
  }
  setBombStrength(bombStrength: number): boolean {
    if (this.bombStrength === bombStrength) return false;
    this.bombStrength = bombStrength;
    return true;
  }
  setMaxBombCount(maxBombCount: number): boolean {
    if (maxBombCount === this.maxBombCount) return false;
    this.maxBombCount = maxBombCount;
    return true;
  }
  setPlayerColor(color: number) { this.tint = color; }

  died() {
    this.stop();
    this.setToSleep();
    this.setVelocity(0, 0);
    this.setSensor(true);
    this.play(`${this.character}_death_${this.lastDirection}`);
  }

  isEqualSessionId(sessionId: string): boolean { return this.sessionId === sessionId; }

  getItemCountOfBombCount(): number {
    return (this.maxBombCount - Constants.INITIAL_SETTABLE_BOMB_COUNT) / Constants.ITEM_INCREASE_RATE.BOMB_POSSESSION_UP;
  }
  getItemCountOfBombStrength(): number {
    return (this.bombStrength - Constants.INITIAL_BOMB_STRENGTH) / Constants.ITEM_INCREASE_RATE.BOMB_STRENGTH;
  }
  getItemCountOfSpeed(): number {
    return (this.speed - Constants.INITIAL_PLAYER_SPEED) / Constants.ITEM_INCREASE_RATE.PLAYER_SPEED;
  }

  private animationFlash(duration: number) {
    const juice = getGameScene().getJuice();
    const timer = setInterval(() => {
      juice.flash(this);
      if (this.isDead()) clearInterval(timer);
    }, 100);
    setTimeout(() => clearInterval(timer), duration);
  }

  private animationShakeScreen(duration: number = 300) {
    this.scene.cameras.main.shake(duration, 0.01);
  }

  setPlayerName(userName: string) {
    if (this.name === userName) return;
    this.name = userName;
    this.nameText.setText(userName);

    const badgeWidth = Math.max(84, this.nameText.width + 26);
    this.nameBadge.clear();
    this.nameBadge.fillStyle(0x57b9f5, 0.98);
    this.nameBadge.fillRoundedRect(-badgeWidth / 2, -51, badgeWidth, 32, 11);
    this.nameBadge.lineStyle(3, 0xffffff, 1);
    this.nameBadge.strokeRoundedRect(-badgeWidth / 2, -51, badgeWidth, 32, 11);
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'player',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    sessionId: string,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
    name?: string,
    options?: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    const sprite = new Player(sessionId, this.scene.matter.world, x, y, texture, frame, name, options);
    this.updateList.add(sprite);
    return sprite;
  }
);
