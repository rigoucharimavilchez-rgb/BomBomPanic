import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle';
import Label from 'phaser3-rex-plugins/templates/ui/label/Label';
import * as Constants from '../../../backend/src/constants/constants';
import { IAvailableRoom } from '../scenes/Lobby';

// BomBom Panic — Cartoon UI theme.
// Visual-only layer: room/network/gameplay behavior remains unchanged.
const CARTOON = {
  ink: 0x25324a,
  cream: 0xfffbeb,
  white: 0xffffff,
  yellow: 0xffd83d,
  yellowShadow: 0xd39a20,
  green: 0x68d34b,
  greenShadow: 0x3d9d36,
  blue: 0x57b9f5,
  blueSoft: 0xdff5ff,
  orange: 0xff914d,
  red: 0xff7070,
  pink: 0xffa4c7,
  lavender: 0xc9b8ff,
  graySoft: 0xeaf0f5,
  gray: 0x9aa8b8,
};

const roundedPanel = (scene: Phaser.Scene, color = CARTOON.cream, radius = 28) =>
  scene.rexUI.add
    .roundRectangle(0, 0, 10, 10, radius, color)
    .setStrokeStyle(6, CARTOON.ink);

const setButtonShadow = (button: any, color: number) => {
  const background = button.getElement?.('background');
  if (background?.setStrokeStyle) {
    background.setStrokeStyle(5, CARTOON.ink);
  }
  if (background?.setShadow) {
    background.setShadow(0, 6, color, 0.35, 2, 2);
  }
};

export const createButton = (scene: Phaser.Scene, text: string, color: number) => {
  const button = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add
      .roundRectangle(0, 0, 10, 10, 18, color)
      .setStrokeStyle(5, CARTOON.ink),
    text: scene.add.text(0, 0, text.toUpperCase(), {
      fontFamily: 'PressStart2P',
      fontSize: '15px',
      color: '#25324a',
      stroke: '#ffffff',
      strokeThickness: 1,
    }),
    align: 'center',
    space: {
      top: 18,
      bottom: 18,
      left: 28,
      right: 28,
    },
  });

  setButtonShadow(button, CARTOON.yellowShadow);

  button.on('pointerover', function () {
    button.setScale(1.04);
  });

  button.on('pointerout', function () {
    button.setScale(1);
  });

  button.on('pointerdown', function () {
    button.setScale(0.98);
  });

  button.on('pointerup', function () {
    button.setScale(1.04);
  });

  return button;
};

export const createButtons = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  buttons: Phaser.GameObjects.GameObject[]
) => {
  return scene.rexUI.add.buttons({ x, y, orientation: 'y', buttons, space: { item: 14 } }).layout();
};

export const createDialog = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  onClick: () => void,
  onClose: () => void
) => {
  const dialog = scene.rexUI.add
    .dialog({
      x,
      y,
      width: 920,
      height: 710,
      background: roundedPanel(scene, CARTOON.cream, 30),
      title: scene.rexUI.add.label({
        background: scene.rexUI.add
          .roundRectangle(0, 0, 10, 10, 22, CARTOON.blue)
          .setStrokeStyle(5, CARTOON.ink),
        text: scene.add.text(0, 0, 'WAITING FOR PLAYERS!', {
          fontSize: '17px',
          fontFamily: 'PressStart2P',
          color: '#ffffff',
          stroke: '#25324a',
          strokeThickness: 4,
        }),
        align: 'center',
        space: {
          top: 24,
          bottom: 24,
          left: 24,
          right: 24,
        },
      }),
      content: createDialogContent(scene),
      expand: {
        content: false,
      },
      actions: [
        createButton(scene, 'READY!', CARTOON.yellow),
        createButton(scene, 'EXIT', CARTOON.red),
      ],
      space: {
        title: 16,
        content: 16,
        left: 18,
        right: 18,
        top: 18,
        bottom: 18,
        action: 26,
      },
    })
    .popUp(100)
    .setDepth(200)
    .layout();

  dialog.on('button.click', function (button: Label, _: any, index: number) {
    switch (index) {
      case 0:
        button.setText('WAITING...');
        (button.getElement('background') as RoundRectangle).setFillStyle(CARTOON.green);
        button.layout();
        onClick();
        break;
      case 1:
        onClose();
        break;
    }
  });

  return dialog;
};

const createDialogContent = (scene: Phaser.Scene) => {
  const grid = scene.rexUI.add
    .gridSizer({
      x: 0,
      y: 0,
      column: 4,
      row: 1,
      width: 200,
      height: 250,
      columnProportions: 1,
      rowProportions: 1,
      space: {
        top: 10,
        bottom: 10,
        column: 18,
        row: 18,
      },
    })
    .layout();

  for (const character of Constants.CHARACTERS) {
    grid.add(createPlayerCard(scene, character));
  }

  return grid;
};

export const createPlayerCard = (scene: Phaser.Scene, character: string) => {
  const cardColors = [CARTOON.blueSoft, 0xfff0c4, 0xe7dcff, 0xdff6d6];
  const cardColor = cardColors[Constants.CHARACTERS.indexOf(character) % cardColors.length];

  const card = scene.rexUI.add
    .label({
      orientation: 1,
      background: scene.rexUI.add
        .roundRectangle(0, 0, 2, 2, 24, cardColor)
        .setStrokeStyle(6, CARTOON.ink),
      icon: scene.rexUI.add.container(0, 0, 150, 150, [
        scene.rexUI.add
          .roundRectangle(0, 0, 150, 150, 24, CARTOON.white)
          .setStrokeStyle(4, CARTOON.ink),
        scene.add
          .text(0, -60, 'NOT READY', {
            fontSize: '10px',
            color: '#25324a',
            fontFamily: 'PressStart2P',
            backgroundColor: '#ff7070',
            padding: { left: 8, right: 8, top: 6, bottom: 6 },
          })
          .setOrigin(0.5),
        scene.add.circle(52, 55, 9, CARTOON.yellow).setStrokeStyle(3, CARTOON.ink),
        scene.add.sprite(0, 10, character).setScale(1.6, 1.3).play(`${character}_idle_down`, true),
      ]),
      text: scene.add
        .text(0, 0, '', {
          fontSize: '15px',
          fontFamily: 'PressStart2P',
          color: '#25324a',
          align: 'center',
        })
        .setOrigin(0.5),
      expandTextWidth: false,
      expandTextHeight: false,
      space: { left: 14, right: 14, top: 14, bottom: 14, icon: 10 },
    })
    .layout();

  const children = card.getChildren();
  const background = card.getElement('background');
  children.forEach((child: any) => {
    if (child === background) {
      child.setFillStyle(cardColor);
    } else {
      card.setChildVisible(child, false);
    }
  });

  return card;
};

export const flipPlayerCard = (
  scene: Phaser.Scene,
  playerCard: Label,
  currFace: 'back' | 'front'
) => {
  const flip = scene.rexUI.add.flip(playerCard, {
    duration: 150,
    face: currFace,
    front: function (gameObject: any) {
      const children = gameObject.getChildren();
      const background = gameObject.getElement('background');
      for (let i = 0, cnt = children.length; i < cnt; i++) {
        const child = children[i];
        if (child === background) {
          child.setFillStyle(CARTOON.cream);
        } else {
          gameObject.setChildVisible(child, true);
        }
      }
    },
    back: function (gameObject: any) {
      const children = gameObject.getChildren();
      const background = gameObject.getElement('background');
      for (let i = 0, cnt = children.length; i < cnt; i++) {
        const child = children[i];
        if (child === background) {
          child.setFillStyle(CARTOON.graySoft);
        } else {
          gameObject.setChildVisible(child, false);
        }
      }
    },
  });

  flip.flip();
};

export const createGridTable = (scene: Phaser.Scene, availableRooms: IAvailableRoom[]) => {
  const gridTable = scene.rexUI.add
    .gridTable({
      x: Constants.WIDTH / 2,
      y: Constants.HEIGHT / 5 + 300,
      width: 400,
      height: 400,
      scrollMode: 0,
      background: roundedPanel(scene, CARTOON.white, 26),
      table: {
        cellWidth: undefined,
        cellHeight: 80,
        columns: 1,
        mask: {
          padding: 20,
        },
        reuseCellContainer: true,
      },
      slider: {
        track: scene.rexUI.add.roundRectangle(0, 0, 20, 10, 10, CARTOON.blue),
        thumb: scene.rexUI.add.roundRectangle(0, 0, 24, 40, 12, CARTOON.yellow).setStrokeStyle(4, CARTOON.ink),
      },
      space: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
        table: 10,
        header: 10,
        footer: 10,
      },
      createCellContainerCallback: function (cell, cellContainer: any) {
        const scene = cell.scene;
        const width = cell.width;
        const height = cell.height;
        const item = cell.item as IAvailableRoom;

        if (cellContainer === null) {
          cellContainer = scene.rexUI.add.label({
            width,
            height,
            orientation: 0,
            background: scene.rexUI.add
              .roundRectangle(0, 0, 10, 10, 18, CARTOON.blueSoft)
              .setStrokeStyle(4, CARTOON.ink),
            icon: scene.rexUI.add
              .roundRectangle(0, 0, 42, 42, 21, CARTOON.yellow)
              .setStrokeStyle(3, CARTOON.ink),
            text: scene.add.text(0, 0, '', {
              fontSize: '12px',
              fontFamily: 'PressStart2P',
              color: '#25324a',
              align: 'center',
            }),
            space: {
              icon: 16,
              left: 15,
              right: 12,
            },
          });
        }

        cellContainer.setAlpha(1);
        cellContainer.setMinSize(width, height);
        const text =
          item.id === 'default' ? item.name : `${item.name}\n\n${item.clients}/${item.maxClients}`;
        cellContainer.getElement('text').setText(text);
        const icon = cellContainer.getElement('icon');
        icon.setFillStyle(item.clients >= item.maxClients ? CARTOON.red : CARTOON.green);
        return cellContainer;
      },
      items: availableRooms,
    })
    .layout();

  return gridTable;
};
