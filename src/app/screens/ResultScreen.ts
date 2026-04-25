import { Container } from "pixi.js";

import { engine } from "../getEngine";
import { ResultPanel } from "../ui/ResultPanel";
import { GameScreen } from "./GameScreen";

/** Screen shown when the game is finished */
export class ResultScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private resultPanel: ResultPanel;

  constructor() {
    super();

    this.resultPanel = new ResultPanel(() => this.onRestartPressed());
    this.addChild(this.resultPanel);
  }

  public prepare() {
    // Read the score that was stored by GameScreen
    const gameWindow = window as unknown as { __gameScore?: number };
    const score = gameWindow.__gameScore || 0;
    this.resultPanel.setScore(score);
  }

  public resize(width: number, height: number) {
    this.resultPanel.resize(width, height);
  }

  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });
  }

  private onRestartPressed(): void {
    void engine().navigation.showScreen(GameScreen);
  }
}
