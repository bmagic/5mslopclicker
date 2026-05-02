import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";

import { MILESTONE_TITLES } from "../utils/milestones";

/** Milestone card with background image and title overlay */
export class MilestoneCard extends Container {
  constructor(milestoneIndex: number, cardWidth: number, cardHeight: number) {
    super();

    const n = milestoneIndex + 1;
    const title = MILESTONE_TITLES[milestoneIndex % MILESTONE_TITLES.length];

    // Card shadow
    const shadow = new Graphics();
    shadow.roundRect(6, 6, cardWidth, cardHeight, 12);
    shadow.fill({ color: 0x000000, alpha: 0.5 });
    this.addChild(shadow);

    // Card border/frame
    const frame = new Graphics();
    frame.roundRect(-4, -4, cardWidth + 8, cardHeight + 8, 14);
    frame.fill(0x222222);
    this.addChild(frame);

    // Image background
    const texAlias = `main/milestones/milestone-${n}.jpg`;
    const texture = Assets.get(texAlias);
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.width = cardWidth;
      sprite.height = cardHeight;
      // Rounded clipping mask
      const clipMask = new Graphics();
      clipMask.roundRect(0, 0, cardWidth, cardHeight, 10);
      clipMask.fill(0xffffff);
      this.addChild(clipMask);
      sprite.mask = clipMask;
      this.addChild(sprite);
    } else {
      // Fallback: solid dark rect
      const fallback = new Graphics();
      fallback.roundRect(0, 0, cardWidth, cardHeight, 10);
      fallback.fill(0x1a1a2e);
      this.addChild(fallback);
    }

    // Title overlay at bottom
    const titleBg = new Graphics();
    titleBg.roundRect(0, cardHeight - 60, cardWidth, 60, 0);
    titleBg.fill({ color: 0x000000, alpha: 0.6 });
    this.addChild(titleBg);

    const titleText = new Text({
      text: title,
      style: {
        fontSize: 22,
        fill: 0xffffff,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      anchor: 0.5,
    });
    titleText.x = cardWidth * 0.5;
    titleText.y = cardHeight - 30;
    this.addChild(titleText);

    // Pivot at center for rotation
    this.pivot.set(cardWidth / 2, cardHeight / 2);
  }
}
