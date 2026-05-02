import { Container } from "pixi.js";

import { engine } from "../getEngine";
import { StartPanel } from "../ui/StartPanel";
import { CreditsScreen } from "./CreditsScreen";
import { GameScreen } from "./GameScreen";
import { MilestonesScreen } from "./MilestonesScreen";

/** Screen shown at game start */
export class StartScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private startPanel: StartPanel;

  constructor() {
    super();

    this.startPanel = new StartPanel(
      () => this.onStartPressed(),
      () => this.onMilestonesPressed(),
      () => this.onCreditsPressed(),
    );
    this.addChild(this.startPanel);
  }

  public resize(width: number, height: number) {
    this.startPanel.resize(width, height);
  }

  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });
  }

  private onStartPressed(): void {
    void engine().navigation.showScreen(GameScreen);
  }

  private onMilestonesPressed(): void {
    void engine().navigation.showScreen(MilestonesScreen);
  }

  private onCreditsPressed(): void {
    void engine().navigation.showScreen(CreditsScreen);
  }
}
