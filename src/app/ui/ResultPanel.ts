import { Container, Sprite, Texture } from "pixi.js";

import { storage } from "../../engine/utils/storage";
import { Button } from "./Button";
import { Label } from "./Label";
import { RoundedBox } from "./RoundedBox";

const HIGHSCORE_KEY = "slopclicker-highscore";

/**
 * Overlay shown when the timer reaches zero.
 */
export class ResultPanel extends Container {
  private bg: Sprite;
  private panel: Container;
  private panelBase: RoundedBox;
  private title: Label;
  private scoreLabel: Label;
  private highscoreLabel: Label;
  private newRecordLabel: Label;
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

    this.panelBase = new RoundedBox({ width: 800, height: 520 });
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
        fontSize: 64,
        fontFamily: "monospace",
      },
    });
    this.scoreLabel.y = -30;
    this.panel.addChild(this.scoreLabel);

    this.newRecordLabel = new Label({
      text: "\u2b50 NOUVEAU RECORD ! \u2b50",
      style: {
        fill: 0xffcc00,
        fontSize: 32,
        fontFamily: "Arial",
      },
    });
    this.newRecordLabel.y = 30;
    this.newRecordLabel.visible = false;
    this.panel.addChild(this.newRecordLabel);

    this.highscoreLabel = new Label({
      text: "",
      style: {
        fill: 0x888888,
        fontSize: 28,
        fontFamily: "monospace",
      },
    });
    this.highscoreLabel.y = 70;
    this.panel.addChild(this.highscoreLabel);

    this.restartButton = new Button({
      text: "Recommencer",
      width: 300,
      height: 110,
    });
    this.restartButton.y = 160;
    this.restartButton.onPress.connect(onRestart);
    this.panel.addChild(this.restartButton);
  }

  public setScore(score: number): void {
    const formatted = score.toLocaleString("fr-FR");
    this.scoreLabel.text = `${formatted} slop${score <= 1 ? "" : "s"}`;

    const prevBest = storage.getNumber(HIGHSCORE_KEY) ?? 0;
    const isNewRecord = score > prevBest;

    if (isNewRecord) {
      storage.setNumber(HIGHSCORE_KEY, score);
    }

    this.newRecordLabel.visible = isNewRecord;
    const best = Math.max(score, prevBest);
    this.highscoreLabel.text = `Meilleur : ${best.toLocaleString("fr-FR")} slops`;
  }

  public resize(width: number, height: number): void {
    this.bg.width = width;
    this.bg.height = height;
    this.panel.x = width * 0.5;
    this.panel.y = height * 0.5;
  }
}
