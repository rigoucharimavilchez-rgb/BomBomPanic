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
    this.cameras.main.setBackgroundColor(0x8fc9f8);
    this.player = getGameScene().getCurrentPlayer();
    this.startTimer = false;

    // BomBom Panic HUD: bright sky, chunky rounded cards and playful colors.
    const background = this.add.graphics().setDepth(-20);
    background.fillStyle(0x8fc9f8, 1);
    background.fillRect(0, 0, this.width, this.height);

    const edge = this.add.graphics().setDepth(-19);
    edge.fillStyle(0x5f9edb, 1);
    edge.fillRoundedRect(0, this.height - 7, this.width, 9, 4);

    this.createCard(8, 126, 0x5c88c7);
    this.createCard(142, 106, 0xf47c72);
    this.createCard(256, 142, 0xffd45b);
    this.createCard(406, 142, 0x76cf70);
    this.createCard(556, 142, 0x67b9eb);

    this.createLabel(20, 7, 'TIME');
    this.createLabel(154, 7, 'HP');

    this.textTimer = this.createText(
      18,
      19,
      convertSecondsToMMSS(Constants.TIME_LIMIT_SEC - Constants.GAME_PREPARING_TIME - 1),
      21
    );
    this.textHp = this.createText(154, 19, `${this.player.getHP()}`, 21);

    this.textBombCount = this.createItemText(316, 16, `×${this.player.getItemCountOfBombCount()}`);
    this.textBombStrength = this.createItemText(466, 16, `×${this.player.getItemCountOfBombStrength()}`);
    this.textSpeed = this.createItemText(616, 16, `×${this.player.getItemCountOfSpeed()}`);

    this.imgBomb = this.add
      .image(266, 10, Constants.ITEM_TYPE.BOMB_POSSESSION_UP)
      .setScale(0.5)
      .setOrigin(0, 0)
      .setDepth(2000);

    this.add.image(416, 10, Constants.ITEM_TYPE.BOMB_STRENGTH).setScale(0.5).setOrigin(0, 0).setDepth(2000);
    this.add.image(566, 10, Constants.ITEM_TYPE.PLAYER_SPEED).setScale(0.5).setOrigin(0, 0).setDepth(2000);

    this.add.volumeIcon(this, this.width - 42, 2, isPlay());
  }

  private createCard(x: number, width: number, color: number) {
    const shadow = this.add.graphics().setDepth(-6);
    shadow.fillStyle(0x35506d, 0.28);
    shadow.fillRoundedRect(x + 3, 6, width, 48, 12);

    const card = this.add.graphics().setDepth(-5);
    card.fillStyle(color, 1);
    card.fillRoundedRect(x, 2, width, 48, 12);
    card.lineStyle(3, 0xffffff, 1);
    card.strokeRoundedRect(x, 2, width, 48, 12);
  }

  private createLabel(x: number, y: number, text: string) {
    return this.add
      .text(x, y, text, {
        fontSize: '8px',
        stroke: '#25324a',
        strokeThickness: 2,
      })
      .setFontFamily('PressStart2P')
      .setColor('#ffffff')
      .setAlpha(1)
      .setDepth(2001);
  }

  private createItemText(x: number, y: number, text: string) {
    return this.add
      .text(x, y, text, {
        fontSize: '20px',
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setFontFamily('PressStart2P')
      .setColor('#25324a')
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

    this.textHp.setText(`${this.player.getHP()}`);
    this.textBombCount.setText(`×${this.player.getItemCountOfBombCount()}`);
    this.textBombStrength.setText(`×${this.player.getItemCountOfBombStrength()}`);
    this.textSpeed.setText(`×${this.player.getItemCountOfSpeed()}`);
  }

  updateTextTimer(timeLimit: number) {
    this.remainTime = timeLimit / 1000;
    this.textTimer.setText(convertSecondsToMMSS(this.remainTime));
  }

  createText(x: number, y: number, text: string, fontSize = 24): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontSize: `${fontSize}px`,
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setFontFamily('PressStart2P')
      .setColor('#25324a')
      .setDepth(2000);
  }
}
