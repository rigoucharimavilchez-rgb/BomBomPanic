import '../services/SoundVolume';

import Phaser from 'phaser';

import * as Constants from '../../../backend/src/constants/constants';
import ServerTimer from '../../../backend/src/rooms/schema/Timer';
import MyPlayer from '../characters/MyPlayer';
import * as Config from '../config/config';
import { Event, gameEvents } from '../events/GameEvents';
import Network from '../services/Network';
import { getGameScene } from '../utils/globalGame';
import { isPlay } from '../utils/sound';
import convertSecondsToMMSS from '../utils/timer';

export default class GameHeader extends Phaser.Scene {
  private readonly width: number;
  private readonly height: number;

  private serverTimer?: ServerTimer;
  private textTimer!: Phaser.GameObjects.Text;
  private remainTime: number = 0;
  private player!: MyPlayer;
  private textHp!: Phaser.GameObjects.Text;
  private textBombCount!: Phaser.GameObjects.Text;
  private textBombStrength!: Phaser.GameObjects.Text;
  private textSpeed!: Phaser.GameObjects.Text;
  private network!: Network;
  private imgBomb!: Phaser.GameObjects.Image;
  private startTimer!: boolean;

  constructor() {
    super(Config.SCENE_NAME_GAME_HEADER);
    this.height = Constants.HEADER_HEIGHT;
    this.width = Constants.HEADER_WIDTH;
  }

  init() {
    this.cameras.main.setSize(this.width, this.height);
    this.cameras.main.setBackgroundColor(0x8fc5f5);
    this.player = getGameScene().getCurrentPlayer();
    this.startTimer = false;

    // BomBom Panic HUD: bright, rounded and playful, while keeping the
    // existing gameplay values and update logic untouched.
    const background = this.add.graphics().setDepth(-20);
    background.fillStyle(0x8fc5f5, 1);
    background.fillRect(0, 0, this.width, this.height);

    // Soft lower edge that visually connects the HUD with the arena.
    const edge = this.add.graphics().setDepth(-19);
    edge.fillStyle(0x6fa8e3, 0.9);
    edge.fillRoundedRect(0, 54, this.width, 10, 5);

    this.createCard(8, 132, 0x5c88c7);
    this.createCard(146, 132, 0xf47c72);
    this.createCard(284, 142, 0xffc857);
    this.createCard(432, 142, 0x79c96b);
    this.createCard(580, 142, 0x67b7e8);

    this.textTimer = this.createText(
      16,
      7,
      convertSecondsToMMSS(Constants.TIME_LIMIT_SEC - Constants.GAME_PREPARING_TIME - 1),
      21
    );
    this.textHp = this.createText(156, 7, `HP: ${this.player.getHP()}`, 21);
    this.textBombCount = this.createText(340, 10, `×${this.player.getItemCountOfBombCount()}`, 20);
    this.textBombStrength = this.createText(488, 10, `×${this.player.getItemCountOfBombStrength()}`, 20);
    this.textSpeed = this.createText(636, 10, `×${this.player.getItemCountOfSpeed()}`, 20);

    this.imgBomb = this.add
      .image(294, 10, Constants.ITEM_TYPE.BOMB_POSSESSION_UP)
      .setScale(0.5)
      .setOrigin(0, 0)
      .setDepth(2000);

    this.add
      .image(442, 10, Constants.ITEM_TYPE.BOMB_STRENGTH)
      .setScale(0.5)
      .setOrigin(0, 0)
      .setDepth(2000);

    this.add
      .image(590, 10, Constants.ITEM_TYPE.PLAYER_SPEED)
      .setScale(0.5)
      .setOrigin(0, 0)
      .setDepth(2000);

    // Small labels make the HUD immediately readable without adding clutter.
    this.createLabel(18, 8, 'TIME');
    this.createLabel(158, 8, 'HP');

    this.add.volumeIcon(this, this.width - 72, -5, isPlay());
  }

  private createCard(x: number, width: number, color: number) {
    const shadow = this.add.graphics().setDepth(-6);
    shadow.fillStyle(0x4b6480, 0.28);
    shadow.fillRoundedRect(x + 2, 5, width, 50, 10);

    const card = this.add.graphics().setDepth(-5);
    card.fillStyle(color, 0.98);
    card.fillRoundedRect(x, 2, width, 50, 10);
    card.lineStyle(3, 0xffffff, 0.95);
    card.strokeRoundedRect(x, 2, width, 50, 10);
  }

  private createLabel(x: number, y: number, text: string) {
    return this.add
      .text(x, y, text, {
        fontSize: '9px',
        stroke: '#ffffff',
        strokeThickness: 2,
      })
      .setFontFamily('PressStart2P')
      .setColor('#ffffff')
      .setAlpha(0.9)
      .setDepth(2001);
  }

  create(data: { network: Network; serverTimer: ServerTimer }) {
    const { network, serverTimer } = data;
    if (network == null) return;
    this.network = data.network;
    this.serverTimer = serverTimer;

    gameEvents.on(Event.GAME_PREPARING_COMPLETED, () => (this.startTimer = true));
  }

  update() {
    if (this.serverTimer === undefined) return;
    if (this.startTimer) {
      this.updateTextTimer(this.serverTimer.finishedAt - this.network.now());
    }
    if (this.player.getBombType() === Constants.BOMB_TYPE.PENETRATION) {
      this.imgBomb.setTexture(Constants.ITEM_TYPE.PENETRATION_BOMB);
    }

    this.textHp.setText(`HP: ${this.player.getHP()}`);
    this.textBombCount.setText(`×${this.player.getItemCountOfBombCount()}`);
    this.textBombStrength.setText(`×${this.player.getItemCountOfBombStrength()}`);
    this.textSpeed.setText(`×${this.player.getItemCountOfSpeed()}`);
  }

  updateTextTimer(timeLimit: number) {
    this.remainTime = timeLimit / 1000;
    this.textTimer.setText(convertSecondsToMMSS(this.remainTime));
  }

  createText(x: number, y: number, text: string, fontSize = 24): Phaser.GameObjects.Text {
    const paddingHeight = Math.max(0, (this.height - fontSize) / 2 - 3);
    return this.add
      .text(x, y, text, {
        fontSize: `${fontSize}px`,
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setFontFamily('PressStart2P')
      .setColor('#243b63')
      .setPadding(4, paddingHeight, 4, paddingHeight)
      .setDepth(2000);
  }
}
