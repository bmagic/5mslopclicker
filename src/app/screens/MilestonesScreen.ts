import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";

import { engine } from "../getEngine";
import { Button } from "../ui/Button";
import {
  MILESTONE_TITLES,
  MILESTONE_VALUES,
  formatMilestoneValue,
  getUnlockedMilestones,
} from "../utils/milestones";
import { StartScreen } from "./StartScreen";

const COLS = 5;
const CARD_GAP = 16;

/**
 * Screen listing all milestones — unlocked ones show their card,
 * locked ones show a placeholder with the value to reach.
 */
export class MilestonesScreen extends Container {
  public static assetBundles = ["main"];

  private grid: Container;
  private gridMask: Graphics;
  private backButton: Button;
  private title: Text;
  private cardW = 0;
  private cardH = 0;
  private scrollY = 0;
  private maxScrollY = 0;
  private gridTop = 100;
  private gridAvailH = 0;

  constructor() {
    super();

    this.title = new Text({
      text: "Milestones",
      style: {
        fontSize: 48,
        fill: 0xffffff,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      anchor: { x: 0.5, y: 0 },
    });
    this.addChild(this.title);

    this.grid = new Container();
    this.addChild(this.grid);

    // Mask so cards don't overflow into title/button areas
    this.gridMask = new Graphics();
    this.grid.mask = this.gridMask;
    this.addChild(this.gridMask);

    // Scroll with mouse wheel
    this.eventMode = "static";
    this.on("wheel", (e: WheelEvent) => {
      this.scrollY = Math.max(
        0,
        Math.min(this.maxScrollY, this.scrollY + e.deltaY),
      );
      this.grid.y = this.gridTop - this.scrollY;
    });

    this.backButton = new Button({
      text: "Retour",
      width: 200,
      height: 70,
      fontSize: 22,
    });
    this.backButton.onPress.connect(() => {
      void engine().navigation.showScreen(StartScreen);
    });
    this.addChild(this.backButton);

    this.buildGrid();
  }

  private buildGrid(): void {
    const unlocked = getUnlockedMilestones();

    for (let i = 0; i < MILESTONE_VALUES.length; i++) {
      const isUnlocked = unlocked.has(i);
      const card = isUnlocked
        ? this.createUnlockedCard(i)
        : this.createLockedCard(i);
      this.grid.addChild(card);
    }
  }

  private createUnlockedCard(index: number): Container {
    const w = this.cardW || 180;
    const h = this.cardH || 250;
    const card = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.roundRect(4, 4, w, h, 10);
    shadow.fill({ color: 0x000000, alpha: 0.4 });
    card.addChild(shadow);

    // Image background
    const n = index + 1;
    const texAlias = `main/milestones/milestone-${n}.jpg`;
    const texture = Assets.get(texAlias);
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.width = w;
      sprite.height = h;
      const clipMask = new Graphics();
      clipMask.roundRect(0, 0, w, h, 16);
      clipMask.fill(0xffffff);
      card.addChild(clipMask);
      sprite.mask = clipMask;
      card.addChild(sprite);
    } else {
      const fallback = new Graphics();
      fallback.roundRect(0, 0, w, h, 16);
      fallback.fill(0x1a1a2e);
      card.addChild(fallback);
    }

    // Title overlay (coins arrondis en bas pour ne pas cacher l'arrondi de l'image)
    const titleBg = new Graphics();
    titleBg.roundRect(0, h - 50, w, 50, 16);
    titleBg.fill({ color: 0x000000, alpha: 0.65 });
    card.addChild(titleBg);

    // Frame (contour jaune, agrandi de 3px tout autour)
    const frame = new Graphics();
    frame.roundRect(-3, -3, w + 6, h + 6, 16);
    frame.stroke({ color: 0xffcc00, width: 4 });
    card.addChild(frame);

    const title = MILESTONE_TITLES[index % MILESTONE_TITLES.length];
    const titleText = new Text({
      text: title,
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      anchor: 0.5,
    });
    titleText.x = w * 0.5;
    titleText.y = h - 25;
    card.addChild(titleText);

    // Value label at top
    const valText = new Text({
      text: `${formatMilestoneValue(MILESTONE_VALUES[index])} slops`,
      style: {
        fontSize: 14,
        fill: 0xffcc00,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      anchor: 0.5,
    });
    valText.x = w * 0.5;
    valText.y = 16;
    card.addChild(valText);

    return card;
  }

  private createLockedCard(index: number): Container {
    const w = this.cardW || 180;
    const h = this.cardH || 250;
    const card = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.roundRect(4, 4, w, h, 10);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    card.addChild(shadow);

    // Dark background
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill(0x1a1a2e);
    card.addChild(bg);

    // Border
    const border = new Graphics();
    border.roundRect(0, 0, w, h, 8);
    border.stroke({ color: 0x444466, width: 2 });
    card.addChild(border);

    // Lock icon
    const lock = new Text({
      text: "🔒",
      style: {
        fontSize: 40,
        fill: 0x666688,
        fontFamily: "Arial",
      },
      anchor: 0.5,
    });
    lock.x = w * 0.5;
    lock.y = h * 0.4;
    card.addChild(lock);

    // Value to reach
    const valText = new Text({
      text: `${formatMilestoneValue(MILESTONE_VALUES[index])} slops`,
      style: {
        fontSize: 18,
        fill: 0x888899,
        fontFamily: "monospace",
      },
      anchor: 0.5,
    });
    valText.x = w * 0.5;
    valText.y = h * 0.65;
    card.addChild(valText);

    // "???" title
    const titleText = new Text({
      text: "???",
      style: {
        fontSize: 16,
        fill: 0x555577,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      anchor: 0.5,
    });
    titleText.x = w * 0.5;
    titleText.y = h - 25;
    card.addChild(titleText);

    return card;
  }

  public resize(width: number, height: number): void {
    this.title.x = width * 0.5;
    this.title.y = 30;

    // Make this screen interactive for wheel events
    this.hitArea = {
      x: 0,
      y: 0,
      width,
      height,
      contains: (x: number, y: number) =>
        x >= 0 && x <= width && y >= 0 && y <= height,
    };

    // Compute card sizes based on available space
    this.gridTop = 100;
    const gridBottom = height - 100;
    const availW = width - 60;
    this.gridAvailH = gridBottom - this.gridTop;

    this.cardW = Math.min(180, (availW - (COLS - 1) * CARD_GAP) / COLS);
    this.cardH = this.cardW * 1.4;

    const rows = Math.ceil(MILESTONE_VALUES.length / COLS);
    const totalGridW = COLS * this.cardW + (COLS - 1) * CARD_GAP;
    const totalGridH = rows * this.cardH + (rows - 1) * CARD_GAP;

    // Scrolling bounds
    this.maxScrollY = Math.max(0, totalGridH - this.gridAvailH + 70);
    this.scrollY = Math.min(this.scrollY, this.maxScrollY);

    // Mask for the grid area
    this.gridMask.clear();
    this.gridMask.rect(0, this.gridTop, width, this.gridAvailH);
    this.gridMask.fill(0xffffff);

    // Center the grid horizontally
    const startX = (width - totalGridW) / 2;

    // Rebuild cards with correct size
    this.grid.removeChildren();
    this.buildGrid();

    // Position cards
    for (let i = 0; i < this.grid.children.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const child = this.grid.children[i];
      child.x = startX + col * (this.cardW + CARD_GAP);
      child.y = row * (this.cardH + CARD_GAP) + 5;
    }

    this.grid.y = this.gridTop - this.scrollY;

    this.backButton.x = width * 0.5;
    this.backButton.y = height - 50;
  }

  public async show(): Promise<void> {}
}
