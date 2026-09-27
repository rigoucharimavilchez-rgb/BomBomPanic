import Phaser from 'phaser';
import * as Config from '../config/config';
import * as Constants from '../../../backend/src/constants/constants';
import Network from '../services/Network';
import { CHARACTER_ROSTER, CharacterDefinition, getWinCount, isRigoUnlocked, SELECTED_CHARACTER_KEY } from '../content/characterRoster';

export default class CharacterSelect extends Phaser.Scene {
  private network!: Network;
  private playerName = '';
  private bgm?: Phaser.Sound.BaseSound;
  private selected = 0;
  private fromLobby = false;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() { super(Config.SCENE_NAME_CHARACTER_SELECT); }

  create(data: { network: Network; playerName: string; bgm?: Phaser.Sound.BaseSound; fromLobby?: boolean }) {
    this.network = data.network;
    this.playerName = data.playerName;
    this.bgm = data.bgm;
    this.fromLobby = data.fromLobby === true;
    this.cards = [];

    this.add.rectangle(Constants.WIDTH / 2, Constants.HEIGHT / 2, Constants.WIDTH, Constants.HEIGHT, 0x9edff3);
    this.add.rectangle(Constants.WIDTH / 2, Constants.HEIGHT - 75, Constants.WIDTH, 150, 0x75c95a);
    this.add.text(Constants.WIDTH / 2, 42, 'CHOOSE YOUR BOMBER', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '22px', color: '#25324a', stroke: '#ffffff', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(Constants.WIDTH / 2, 76, `PERSONAJES  •  VICTORIAS: ${getWinCount()}`, { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '14px', color: '#49627d' }).setOrigin(0.5);

    const saved = localStorage.getItem(SELECTED_CHARACTER_KEY);
    const savedIndex = CHARACTER_ROSTER.findIndex(c => c.id === saved && !this.isLocked(c));
    if (savedIndex >= 0) this.selected = savedIndex;
    if (this.isLocked(CHARACTER_ROSTER[this.selected])) {
      const firstUnlocked = CHARACTER_ROSTER.findIndex(c => !this.isLocked(c));
      this.selected = firstUnlocked >= 0 ? firstUnlocked : 0;
    }

    CHARACTER_ROSTER.forEach((character, index) => this.createCard(character, index));
    this.createBottomBar();
    this.refreshSelection();
  }

  private isLocked(character: CharacterDefinition) {
    return character.id === 'rigo' ? !isRigoUnlocked() : character.locked === true;
  }

  private createCard(character: CharacterDefinition, index: number) {
    const columns = 3, cardW = 190, cardH = 155, gapX = 25, gapY = 18;
    const startX = Constants.WIDTH / 2 - (columns * cardW + (columns - 1) * gapX) / 2 + cardW / 2;
    const x = startX + (index % columns) * (cardW + gapX), y = 135 + Math.floor(index / columns) * (cardH + gapY);
    const locked = this.isLocked(character);
    const container = this.add.container(x, y);
    container.setSize(cardW, cardH);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: !locked }
    );

    container.add(this.add.rectangle(4, 6, cardW, cardH, 0x52647a, 0.25));
    const panel = this.add.rectangle(0, 0, cardW, cardH, locked ? 0xd9dee5 : 0xfffbef);
    panel.setStrokeStyle(4, character.accent, 1); container.add(panel);
    const icon = this.add.circle(0, -34, 30, locked ? 0x657180 : character.accent); icon.setStrokeStyle(4, 0xffffff, 1); container.add(icon);
    container.add(this.add.text(0, -34, locked ? '🔒' : character.icon, { fontFamily: 'Arial', fontSize: locked ? '22px' : '28px', color: '#ffffff' }).setOrigin(0.5));
    container.add(this.add.text(0, 9, character.name.toUpperCase(), { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '18px', color: locked ? '#687383' : '#25324a' }).setOrigin(0.5));
    container.add(this.add.text(0, 34, character.stats, { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '10px', color: locked ? '#7b8794' : '#d67b20' }).setOrigin(0.5));
    container.add(this.add.text(0, 57, character.description, { fontFamily: 'Arial', fontSize: '9px', color: '#5c6b7c', align: 'center', wordWrap: { width: 164 } }).setOrigin(0.5));
    if (locked) container.add(this.add.text(0, 73, character.unlockText ?? 'BLOQUEADO', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '9px', color: '#ffffff', backgroundColor: '#657180', padding: { left: 7, right: 7, top: 4, bottom: 4 } }).setOrigin(0.5));

    container.on('pointerdown', () => {
      if (this.isLocked(character)) return;
      this.selected = index;
      localStorage.setItem(SELECTED_CHARACTER_KEY, character.id);
      this.refreshSelection();
    });
    this.cards.push(container);
  }

  private refreshSelection() {
    this.cards.forEach((card, index) => card.setScale(index === this.selected && !this.isLocked(CHARACTER_ROSTER[index]) ? 1.06 : 1));
  }

  private createBottomBar() {
    const y = Constants.HEIGHT - 40;
    const back = this.add.text(90, y, this.fromLobby ? '← VOLVER AL LOBBY' : '← VOLVER', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '17px', color: '#25324a', backgroundColor: '#ffffff', padding: { left: 14, right: 14, top: 10, bottom: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      if (this.fromLobby) this.scene.start(Config.SCENE_NAME_LOBBY, { network: this.network, playerName: this.playerName, bgm: this.bgm });
      else this.scene.start(Config.SCENE_NAME_TITLE, { network: this.network });
    });

    const next = this.add.text(Constants.WIDTH - 100, y, 'CONTINUAR →', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '18px', color: '#ffffff', backgroundColor: '#f2a62b', padding: { left: 16, right: 16, top: 10, bottom: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    next.on('pointerdown', () => {
      const character = CHARACTER_ROSTER[this.selected];
      if (this.isLocked(character)) return;
      localStorage.setItem(SELECTED_CHARACTER_KEY, character.id);
      this.scene.start(Config.SCENE_NAME_MAP_SELECT, { network: this.network, playerName: this.playerName, bgm: this.bgm, fromLobby: this.fromLobby });
    });
  }
}
