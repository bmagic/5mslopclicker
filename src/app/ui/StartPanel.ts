import { Container, Sprite, Texture } from "pixi.js";

import { Button } from "./Button";
import { Label } from "./Label";
import { RoundedBox } from "./RoundedBox";

/**
 * Overlay shown before the run starts.
 */
export class StartPanel extends Container {
  private bg: Sprite;
  private panel: Container;
  private panelBase: RoundedBox;
  private title: Label;
  private startButton: Button;

  constructor(onStart: () => void) {
    super();

    this.bg = new Sprite(Texture.WHITE);
    this.bg.tint = 0x000000;
    this.bg.alpha = 0.55;
    this.bg.interactive = true;
    this.addChild(this.bg);

    this.panel = new Container();
    this.addChild(this.panel);

    this.panelBase = new RoundedBox({ width: 640, height: 360 });
    this.panel.addChild(this.panelBase);

    this.title = new Label({
      text: "Start game",
      style: {
        fill: 0xec1561,
        fontSize: 64,
      },
    });
    this.title.y = -70;
    this.panel.addChild(this.title);

    this.startButton = new Button({
      text: "Start",
      width: 260,
      height: 110,
    });
    this.startButton.y = 80;
    this.startButton.onPress.connect(onStart);
    this.panel.addChild(this.startButton);
  }

  public resize(width: number, height: number): void {
    this.bg.width = width;
    this.bg.height = height;
    this.panel.x = width * 0.5;
    this.panel.y = height * 0.5;
  }
}
