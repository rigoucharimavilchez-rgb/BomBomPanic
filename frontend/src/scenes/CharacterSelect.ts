import Phaser from 'phaser';
import * as Config from '../config/config';
import * as Constants from '../../../backend/src/constants/constants';
import Network from '../services/Network';
import {
  CHARACTER_ROSTER,
  CharacterDefinition,
  getWinCount,
  isRigoUnlocked,
  SELECTED_CHARACTER_KEY,
} from '../content/characterRoster';

export default class CharacterSelect extends Phaser.Scene {
  private network!: Network;
  private playerName = '';
  private bgm?: Phaser.Sound.BaseSound;
  private selected = 1;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super(Config.SCENE_NAME_CHARACTER_SELECT);
  }

  create(data: { network: Network; playerName: string; bgm?: Phaser.Sound.BaseSound }) {
    this.network = data.network;
    this.playerName = data.playerName;
    this.bgm = data.bgm;

    this.drawBackground();
    this.add.text(Constants.WIDTH / 2, 42, 'CHOOSE YOUR BOMBER', {
      fontFamily: 'PressStart2P', fontSize: '18px', color: '#25324a',
      stroke: '#ffffff', strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(Constants.WIDTH / 2, 76, 'PERSONAJES', {
      fontFamily: 'Arial', fontStyle: 'bold', fontSize: '18px', color: '#49627d',
    }).setOrigin(0.5);

    const saved = localStorage.getItem(SELECTED_CHARACTER_KEY);
    const savedIndex = CHARACTER_ROSTER.findIndex((character) => character.id === saved);
    if (savedIndex >= 0 && !this.isLocked(CHARACTER_ROSTER[savedIndex])) this.selected = savedIndex;

    if (this.isLocked(CHARACTER_ROSTER[this.selected])) {
      this.selected = CHARACTER_ROSTER.findIndex((character) => !this.isLocked(character));
    }

    CHARACTER_ROSTER.forEach((character, index) => this.createCard(character, index));
    this.createBottomBar();
    this.refreshSelection();
  }

  private isLocked(character: CharacterDefinition) {
    return character.id === 'rigo' ? !isRigoUnlocked() : character.locked === true;
  }

  private drawBackground() {
    this.add.rectangle(Constants.WIDTH / 2, Constants.HEIGHT / 2, Constants.WIDTH, Constants.HEIGHT, 0x9edff3);
    this.add.circle(110, 95, 75, 0xffffff, 0.38);
    this.add.circle(Constants.WIDTH - 90, 120, 95, 0xffffff, 0.32);
    this.add.rectangle(Constants.WIDTH / 2, Constants.HEIGHT - 75, Constants.WIDTH, 150, 0x75c95a);
    for (let x = 0; x < Constants.WIDTH; x += 48) {
      this.add.circle(x + 16, Constants.HEIGHT - 58, 3, 0x4eaa42, 0.65);
    }

    this.add.text(Constants.WIDTH / 2, 101, `VICTORIAS: ${getWinCount()}`, {
      fontFamily: 'Arial', fontStyle: 'bold', fontSize: '12px', color: '#ffffff',
      backgroundColor: '#25324a', padding: { left: 10, right: 10, top: 5, bottom: 5 },
    }).setOrigin(0.5);
  }

  private createCard(character: CharacterDefinition, index: number) {
    const columns = 3;
    const cardW = 190;
    const cardH = 155;
    const gapX = 25;
    const gapY = 18;
    const startX = Constants.WIDTH / 2 - (columns * cardW + (columns - 1) * gapX) / 2 + cardW / 2;
    const startY = 135;
    const x = startX + (index % columns) * (cardW + gapX);
    const y = startY + Math.floor(index / columns) * (cardH + gapY);
    const locked = this.isLocked(character);

    const container = this.add.container(x, y);
    const shadow = this.add.rectangle(4, 6, cardW, cardH, 0x52647a, 0.25).setOrigin(0.5);
    container.add(shadow);
    const panel = this.add.rectangle(0, 0, cardW, cardH, locked ? 0xd9dee5 : 0xfffbef).setOrigin(0.5);
    panel.setStrokeStyle(4, character.accent, 1);
    container.add(panel);

    const icon = this.add.circle(0, -34, 30, locked ? 0x657180 : character.accent);
    icon.setStrokeStyle(4, 0xffffff, 1);
    container.add(icon);
    container.add(this.add.text(0, -34, locked ? '🔒' : character.icon, {
      fontFamily: 'Arial', fontStyle: 'bold', fontSize: locked ? '22px' : '28px', color: '#ffffff',
    }).setOrigin(0.5));

    container.add(this.add.text(0, 9, character.name.toUpperCase(), {
      fontFamily: 'Arial', fontStyle: 'bold', fontSize: '18px', color: locked ? '#687383' : '#25324a',
    }).setOrigin(0.5));
    container.add(this.add.text(0, 34, character.stats, {
      fontFamily: 'Arial', fontStyle: 'bold', fontSize: '10px', color: locked ? '#7b8794' : '#d67b20',
    }).setOrigin(0.5));
    container.add(this.add.text(0, 57, character.description, {
      fontFamily: 'Arial', fontSize: '9px', color: '#5c6b7c', align: 'center',
      wordWrap: { width: 164 },
    }).setOrigin(0.5));

    if (locked) {
      container.add(this.add.text(0, 73, character.unlockText ?? 'BLOQUEADO', {
        fontFamily: 'Arial', fontStyle: 'bold', fontSize: '9px', color: '#ffffff',
        backgroundColor: '#657180', padding: { left: 7, right: 7, top: 4, bottom: 4 },
      }).setOrigin(0.5));
    }

    container.setSize(cardW, cardH);
    container.setInteractive(new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', () => {
      if (this.isLocked(character)) return;
      this.selected = index;
      this.refreshSelection();
    });
    container.on('pointerover', () => {
      if (!this.isLocked(character) && this.selected !== index) container.setScale(1.025);
    });
    container.on('pointerout', () => container.setScale(this.selected === index && !this.isLocked(character) ? 1.04 : 1));
    this.cards.push(container);
  }

  private refreshSelection() {
    this.cards.forEach((card, index) => {
      const locked = this.isLocked(CHARACTER_ROSTER[index]);
      card.setScale(index === this.selected && !locked ? 1.04 : 1);
    });
  }

  private createBottomBar() {
    const y = Constants.HEIGHT - 40;
    const back = this.add.text(90, y, '← VOLVER', {
      fontFamily: 'Arial', fontStyle: 'bold', fontSize: '18px', color: '#25324a',
      backgroundColor: '#ffffff', padding: { left: 16, right: 16, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(Config.SCENE_NAME_TITLE, { network: this.network }));

    const next = this.add.text(Constants.WIDTH - 100, y, 'CONTINUAR →', {
      fontFamily: 'Arial', fontStyle: 'bold', fontSize: '18px', color: '#ffffff',
      backgroundColor: '#f2a62b', padding: { left: 16, right: 16, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    next.on('pointerdown', () => {
      const character = CHARACTER_ROSTER[this.selected];
      if (this.isLocked(character)) return;
      localStorage.setItem(SELECTED_CHARACTER_KEY, character.id);
      this.scene.start(Config.SCENE_NAME_MAP_SELECT, {
        network: this.network, playerName: this.playerName, bgm: this.bgm,
      });
    });
  }
}
