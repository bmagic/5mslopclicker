import { Container, Sprite, Texture } from "pixi.js";

import { Button } from "./Button";
import { Label } from "./Label";
import { RoundedBox } from "./RoundedBox";

/**
 * Overlay shown when the timer reaches zero.
 */
export class ResultPanel extends Container {
  private bg: Sprite;
  private panel: Container;
  private panelBase: RoundedBox;
  private title: Label;
  private scoreLabel: Label;
  private restartButton: Button;

  constructor(onRestart: () => void) {
    super();

    this.bg = new Sprite(Texture.WHITE);
    this.bg.tint = 0x000000;
    this.bg.alpha = 0.65;
    this.bg.interactive = true;
    this.addChild(this.bg);

    this.panel = new Container();
    this.addChild(this.panel);

    this.panelBase = new RoundedBox({ width: 700, height: 420 });
    this.panel.addChild(this.panelBase);

    this.title = new Label({
      text: "Resultat",
      style: {
        fill: 0xec1561,
        fontSize: 58,
      },
    });
    this.title.y = -120;
    this.panel.addChild(this.title);

    this.scoreLabel = new Label({
      text: "0 slop",
      style: {
        fill: 0x4a4a4a,
        fontSize: 82,
      },
    });
    this.scoreLabel.y = -10;
    this.panel.addChild(this.scoreLabel);

    this.restartButton = new Button({
      text: "Relancer",
      width: 300,
      height: 110,
    });
    this.restartButton.y = 120;
    this.restartButton.onPress.connect(onRestart);
    this.panel.addChild(this.restartButton);
  }

  public setScore(score: number): void {
    this.scoreLabel.text = `${score} slop${score <= 1 ? "" : "s"}`;
  }

  public resize(width: number, height: number): void {
    this.bg.width = width;
    this.bg.height = height;
    this.panel.x = width * 0.5;
    this.panel.y = height * 0.5;
  }
}
