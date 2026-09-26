import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle';
import Label from 'phaser3-rex-plugins/templates/ui/label/Label';
import * as Constants from '../../../backend/src/constants/constants';
import { IAvailableRoom } from '../scenes/Lobby';

const CARTOON = {
  ink: 0x25324a, cream: 0xfffbeb, white: 0xffffff, yellow: 0xffd83d, yellowShadow: 0xd39a20,
  green: 0x68d34b, greenShadow: 0x3d9d36, blue: 0x57b9f5, blueSoft: 0xdff5ff,
  orange: 0xff914d, red: 0xff7070, pink: 0xffa4c7, lavender: 0xc9b8ff,
  graySoft: 0xeaf0f5, gray: 0x9aa8b8,
};

const styledRoundRect = (scene: Phaser.Scene, radius: number, color: number, stroke = 0) => {
  const shape: any = scene.rexUI.add.roundRectangle(0, 0, 10, 10, radius, color);
  if (stroke && shape?.setStrokeStyle) shape.setStrokeStyle(stroke, CARTOON.ink);
  return shape;
};

const roundedPanel = (scene: Phaser.Scene, color = CARTOON.cream, radius = 28) => {
  const panel: any = styledRoundRect(scene, radius, color, 7);
  if (panel?.setShadow) panel.setShadow(0, 8, CARTOON.ink, 0.22, 2, 2);
  return panel;
};

const setButtonShadow = (button: any, color: number) => {
  const background = button.getElement?.('background');
  if (background?.setStrokeStyle) background.setStrokeStyle(5, CARTOON.ink);
  if (background?.setShadow) background.setShadow(0, 7, color, 0.42, 2, 2);
};

export const createButton = (scene: Phaser.Scene, text: string, color: number) => {
  const background: any = styledRoundRect(scene, 20, color, 5);
  const button = scene.rexUI.add.label({
    orientation: 'x', background,
    text: scene.add.text(0, 0, text.toUpperCase(), {
      fontFamily: 'PressStart2P', fontSize: '15px', color: '#25324a', stroke: '#ffffff', strokeThickness: 2,
    }),
    align: 'center', space: { top: 19, bottom: 19, left: 30, right: 30 },
  });
  setButtonShadow(button, color === CARTOON.red ? 0xb84b4b : CARTOON.yellowShadow);
  button.on('pointerover', () => button.setScale(1.045));
  button.on('pointerout', () => button.setScale(1));
  button.on('pointerdown', () => button.setScale(0.98));
  button.on('pointerup', () => button.setScale(1.045));
  return button;
};

export const createButtons = (scene: Phaser.Scene, x: number, y: number, buttons: Phaser.GameObjects.GameObject[]) =>
  scene.rexUI.add.buttons({ x, y, orientation: 'y', buttons, space: { item: 16 } }).layout();

export const createDialog = (scene: Phaser.Scene, x: number, y: number, onClick: () => void, onClose: () => void) => {
  const titleBackground: any = styledRoundRect(scene, 24, CARTOON.blue, 5);
  const dialog = scene.rexUI.add.dialog({
    x, y, width: 920, height: 710, background: roundedPanel(scene, CARTOON.cream, 34),
    title: scene.rexUI.add.label({
      background: titleBackground,
      text: scene.add.text(0, 0, 'WAITING FOR PLAYERS!', { fontSize: '17px', fontFamily: 'PressStart2P', color: '#ffffff', stroke: '#25324a', strokeThickness: 4 }),
      align: 'center', space: { top: 25, bottom: 25, left: 26, right: 26 },
    }),
    content: createDialogContent(scene), expand: { content: false },
    actions: [createButton(scene, 'READY!', CARTOON.yellow), createButton(scene, 'EXIT', CARTOON.red)],
    space: { title: 18, content: 18, left: 22, right: 22, top: 20, bottom: 20, action: 28 },
  }).popUp(100).setDepth(200).layout();

  dialog.on('button.click', function (button: Label, _: any, index: number) {
    if (index === 0) {
      button.setText('WAITING...');
      (button.getElement('background') as RoundRectangle).setFillStyle(CARTOON.green);
      button.layout(); onClick();
    } else if (index === 1) onClose();
  });
  return dialog;
};

const createDialogContent = (scene: Phaser.Scene) => {
  const grid = scene.rexUI.add.gridSizer({ x: 0, y: 0, column: 4, row: 1, width: 200, height: 250, columnProportions: 1, rowProportions: 1, space: { top: 10, bottom: 10, column: 20, row: 20 } }).layout();
  for (const character of Constants.CHARACTERS) grid.add(createPlayerCard(scene, character));
  return grid;
};

export const createPlayerCard = (scene: Phaser.Scene, character: string) => {
  const cardColors = [CARTOON.blueSoft, 0xfff0c4, 0xe7dcff, 0xdff6d6];
  const cardColor = cardColors[Constants.CHARACTERS.indexOf(character) % cardColors.length];
  const cardBackground: any = styledRoundRect(scene, 28, cardColor, 6);
  if (cardBackground?.setShadow) cardBackground.setShadow(0, 7, CARTOON.ink, 0.18, 2, 2);
  const iconBackground: any = styledRoundRect(scene, 26, CARTOON.white, 4);
  const status = scene.add.text(0, -60, 'NOT READY', { fontSize: '10px', color: '#25324a', fontFamily: 'PressStart2P', backgroundColor: '#ff7070', padding: { left: 9, right: 9, top: 6, bottom: 6 } }).setOrigin(0.5);
  const marker = scene.add.circle(52, 55, 9, CARTOON.yellow).setStrokeStyle(3, CARTOON.ink);
  const avatar = scene.add.sprite(0, 10, character).setScale(1.6, 1.3).play(`${character}_idle_down`, true);
  const card = scene.rexUI.add.label({
    orientation: 1, background: cardBackground,
    icon: scene.rexUI.add.container(0, 0, 150, 150, [iconBackground, status, marker, avatar]),
    text: scene.add.text(0, 0, '', { fontSize: '15px', fontFamily: 'PressStart2P', color: '#25324a', align: 'center' }).setOrigin(0.5),
    expandTextWidth: false, expandTextHeight: false, space: { left: 14, right: 14, top: 14, bottom: 14, icon: 10 },
  }).layout();
  const children = card.getChildren(); const background = card.getElement('background');
  children.forEach((child: any) => child === background ? child.setFillStyle(cardColor) : card.setChildVisible(child, false));
  return card;
};

export const flipPlayerCard = (scene: Phaser.Scene, playerCard: Label, currFace: 'back' | 'front') => {
  const flip = scene.rexUI.add.flip(playerCard, { duration: 150, face: currFace,
    front: function (gameObject: any) { const children = gameObject.getChildren(); const background = gameObject.getElement('background'); for (const child of children) child === background ? background.setFillStyle(CARTOON.cream) : gameObject.setChildVisible(child, true); },
    back: function (gameObject: any) { const children = gameObject.getChildren(); const background = gameObject.getElement('background'); for (const child of children) child === background ? background.setFillStyle(CARTOON.graySoft) : gameObject.setChildVisible(child, false); },
  });
  flip.flip();
};

export const createGridTable = (scene: Phaser.Scene, availableRooms: IAvailableRoom[]) => {
  const thumb: any = styledRoundRect(scene, 12, CARTOON.yellow, 4);
  const gridTable = scene.rexUI.add.gridTable({
    x: Constants.WIDTH / 2, y: Constants.HEIGHT / 5 + 300, width: 400, height: 400, scrollMode: 0,
    background: roundedPanel(scene, CARTOON.white, 28),
    table: { cellWidth: undefined, cellHeight: 80, columns: 1, mask: { padding: 20 }, reuseCellContainer: true },
    slider: { track: styledRoundRect(scene, 10, CARTOON.blue), thumb },
    space: { left: 20, right: 20, top: 20, bottom: 20, table: 10, header: 10, footer: 10 },
    createCellContainerCallback: function (cell, cellContainer: any) {
      const scene = cell.scene; const width = cell.width; const height = cell.height; const item = cell.item as IAvailableRoom;
      if (cellContainer === null) {
        const cellBackground: any = styledRoundRect(scene, 20, CARTOON.blueSoft, 4);
        const cellIcon: any = styledRoundRect(scene, 21, CARTOON.yellow, 3);
        cellContainer = scene.rexUI.add.label({ width, height, orientation: 0, background: cellBackground, icon: cellIcon, text: scene.add.text(0, 0, '', { fontSize: '12px', fontFamily: 'PressStart2P', color: '#25324a', align: 'center' }), space: { icon: 16, left: 15, right: 12 } });
      }
      cellContainer.setAlpha(1); cellContainer.setMinSize(width, height);
      cellContainer.getElement('text').setText(item.id === 'default' ? item.name : `${item.name}\n\n${item.clients}/${item.maxClients}`);
      cellContainer.getElement('icon').setFillStyle(item.clients >= item.maxClients ? CARTOON.red : CARTOON.green);
      return cellContainer;
    },
    items: availableRooms,
  }).layout();
  return gridTable;
};
