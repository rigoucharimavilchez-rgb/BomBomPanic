import Phaser from 'phaser';
import * as Config from '../config/config';
import * as Constants from '../../../backend/src/constants/constants';
import Network from '../services/Network';
import { MAP_ROSTER, MapDefinition, SELECTED_MAP_KEY } from '../content/mapRoster';
import { SELECTED_CHARACTER_KEY } from '../content/characterRoster';

export default class MapSelect extends Phaser.Scene {
  private network!: Network;
  private playerName = '';
  private bgm?: Phaser.Sound.BaseSound;
  private selected = 0;
  private fromLobby = false;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() { super(Config.SCENE_NAME_MAP_SELECT); }

  create(data: { network: Network; playerName: string; bgm?: Phaser.Sound.BaseSound; fromLobby?: boolean }) {
    this.network = data.network;
    this.playerName = data.playerName;
    this.bgm = data.bgm;
    this.fromLobby = data.fromLobby === true;
    this.cards = [];

    this.drawBackground();
    this.add.text(Constants.WIDTH / 2, 42, 'CHOOSE YOUR ARENA', { fontFamily: 'PressStart2P', fontSize: '18px', color: '#25324a', stroke: '#ffffff', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(Constants.WIDTH / 2, 76, 'MAPAS', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '18px', color: '#49627d' }).setOrigin(0.5);

    const saved = localStorage.getItem(SELECTED_MAP_KEY);
    const savedIndex = MAP_ROSTER.findIndex((map) => map.id === saved);
    if (savedIndex >= 0) this.selected = savedIndex;
    MAP_ROSTER.forEach((map, index) => this.createCard(map, index));
    this.createBottomBar();
    this.refreshSelection();
  }

  private drawBackground() {
    this.add.rectangle(Constants.WIDTH / 2, Constants.HEIGHT / 2, Constants.WIDTH, Constants.HEIGHT, 0x9edff3);
    this.add.circle(110, 95, 75, 0xffffff, 0.38);
    this.add.circle(Constants.WIDTH - 90, 120, 95, 0xffffff, 0.32);
    this.add.rectangle(Constants.WIDTH / 2, Constants.HEIGHT - 75, Constants.WIDTH, 150, 0x75c95a);
  }

  private createCard(map: MapDefinition, index: number) {
    const columns = 3, cardW = 190, cardH = 155, gapX = 25, gapY = 18;
    const startX = Constants.WIDTH / 2 - (columns * cardW + (columns - 1) * gapX) / 2 + cardW / 2;
    const x = startX + (index % columns) * (cardW + gapX), y = 135 + Math.floor(index / columns) * (cardH + gapY);
    const container = this.add.container(x, y);
    container.setSize(cardW, cardH);
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    container.add(this.add.rectangle(4, 6, cardW, cardH, 0x52647a, 0.25).setOrigin(0.5));
    const panel = this.add.rectangle(0, 0, cardW, cardH, 0xfffbef).setOrigin(0.5); panel.setStrokeStyle(4, map.accent, 1); container.add(panel);
    const badge = this.add.circle(0, -35, 32, map.accent); badge.setStrokeStyle(4, 0xffffff, 1); container.add(badge);
    container.add(this.add.text(0, -35, String(index + 1), { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5));
    container.add(this.add.text(0, 12, map.name.toUpperCase(), { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '16px', color: '#25324a' }).setOrigin(0.5));
    container.add(this.add.text(0, 40, `${map.difficulty} • ${map.theme}`, { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '12px', color: '#49627d' }).setOrigin(0.5));
    container.add(this.add.text(0, 64, map.description, { fontFamily: 'Arial', fontSize: '10px', color: '#5c6b7c', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5));

    container.on('pointerdown', () => {
      this.selected = index;
      localStorage.setItem(SELECTED_MAP_KEY, map.id);
      this.refreshSelection();
    });
    this.cards.push(container);
  }

  private refreshSelection() { this.cards.forEach((card, index) => card.setScale(index === this.selected ? 1.06 : 1)); }

  private createBottomBar() {
    const y = Constants.HEIGHT - 40;
    const back = this.add.text(90, y, '← PERSONAJES', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '17px', color: '#25324a', backgroundColor: '#ffffff', padding: { left: 16, right: 16, top: 10, bottom: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(Config.SCENE_NAME_CHARACTER_SELECT, { network: this.network, playerName: this.playerName, bgm: this.bgm, fromLobby: this.fromLobby }));

    const play = this.add.text(Constants.WIDTH - 90, y, 'IR AL LOBBY →', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '17px', color: '#ffffff', backgroundColor: '#55b84f', padding: { left: 16, right: 16, top: 10, bottom: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    play.on('pointerdown', () => {
      const map = MAP_ROSTER[this.selected];
      localStorage.setItem(SELECTED_MAP_KEY, map.id);
      if (localStorage.getItem(SELECTED_CHARACTER_KEY) === null) localStorage.setItem(SELECTED_CHARACTER_KEY, 'axel');
      this.scene.start(Config.SCENE_NAME_LOBBY, { network: this.network, playerName: this.playerName, bgm: this.bgm });
    });
  }
}
