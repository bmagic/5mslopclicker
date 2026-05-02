import { Container, Sprite, Text, Texture } from "pixi.js";

import { storage } from "../../engine/utils/storage";
import { Button } from "./Button";
import { Label } from "./Label";
import { RoundedBox } from "./RoundedBox";

const HIGHSCORE_KEY = "slopclicker-highscore";

/**
 * Overlay shown before the run starts.
 */
export class StartPanel extends Container {
  private bg: Sprite;
  private panel: Container;
  private panelBase: RoundedBox;
  private title: Label;
  private highscoreLabel: Label;
  private startButton: Button;
  private milestonesButton: Button;
  private creditsLink: Text;

  constructor(
    onStart: () => void,
    onMilestones: () => void,
    onCredits: () => void,
  ) {
    super();

    this.bg = new Sprite(Texture.WHITE);
    this.bg.tint = 0x000000;
    this.bg.alpha = 0.55;
    this.bg.interactive = true;
    this.addChild(this.bg);

    this.panel = new Container();
    this.addChild(this.panel);

    this.panelBase = new RoundedBox({ width: 740, height: 360 });
    this.panel.addChild(this.panelBase);

    this.title = new Label({
      text: "5min Slop Clicker",
      style: {
        fill: 0xec1561,
        fontSize: 64,
      },
    });
    this.title.y = -90;
    this.panel.addChild(this.title);

    const best = storage.getNumber(HIGHSCORE_KEY) ?? 0;
    this.highscoreLabel = new Label({
      text:
        best > 0
          ? `\ud83c\udfc6 Record : ${best.toLocaleString("fr-FR")} slops`
          : "",
      style: {
        fill: 0xffcc00,
        fontSize: 28,
        fontFamily: "monospace",
      },
    });
    this.highscoreLabel.y = -20;
    this.panel.addChild(this.highscoreLabel);

    this.startButton = new Button({
      text: "Démarrer",
      width: 260,
      height: 110,
    });
    this.startButton.y = 60;
    this.startButton.onPress.connect(onStart);
    this.panel.addChild(this.startButton);

    this.milestonesButton = new Button({
      text: "Objectifs",
      width: 220,
      height: 70,
      fontSize: 22,
    });
    this.milestonesButton.y = 140;
    this.milestonesButton.onPress.connect(onMilestones);
    this.panel.addChild(this.milestonesButton);

    this.creditsLink = new Text({
      text: "Crédits",
      style: {
        fontSize: 16,
        fill: 0x999999,
        fontFamily: "monospace",
      },
      anchor: { x: 0.5, y: 0 },
    });
    this.creditsLink.eventMode = "static";
    this.creditsLink.cursor = "pointer";
    this.creditsLink.on("pointertap", onCredits);
    this.addChild(this.creditsLink);
  }

  public resize(width: number, height: number): void {
    this.bg.width = width;
    this.bg.height = height;
    this.panel.x = width * 0.5;
    this.panel.y = height * 0.5;
    this.creditsLink.x = width * 0.5;
    this.creditsLink.y = height - 30;
  }
}
