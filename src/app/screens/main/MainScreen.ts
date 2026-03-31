import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { SettingsPopup } from "../../popups/SettingsPopup";
import { Button } from "../../ui/Button";
import { Counter } from "../../ui/Counter";
import { ResultPanel } from "../../ui/ResultPanel";
import { StartPanel } from "../../ui/StartPanel";
import { Timer } from "../../ui/Timer";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private pauseButton: FancyButton;
  private settingsButton: FancyButton;
  private addButton: FancyButton;
  private counter: Counter;
  private timer: Timer;
  private startPanel: StartPanel;
  private resultPanel: ResultPanel;
  private gameRunning = false;
  private paused = false;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    this.counter = new Counter();
    this.addChild(this.counter);

    this.timer = new Timer();
    this.addChild(this.timer);

    this.startPanel = new StartPanel(() => this.startGame());
    this.addChild(this.startPanel);

    this.resultPanel = new ResultPanel(() => this.startGame());
    this.resultPanel.visible = false;
    this.addChild(this.resultPanel);

    const buttonAnimations = {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };
    this.pauseButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.pauseButton.onPress.connect(() =>
      engine().navigation.presentPopup(PausePopup),
    );
    this.addChild(this.pauseButton);

    this.settingsButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() =>
      engine().navigation.presentPopup(SettingsPopup),
    );
    this.addChild(this.settingsButton);

    this.addButton = new Button({
      text: "Click",
      width: 300,
      height: 110,
    });
    this.addButton.onPress.connect(() => {
      if (!this.gameRunning) return;

      this.counter.increment();
    });
    this.addChild(this.addButton);

    this.addButton.visible = false;
    this.counter.visible = false;
    this.timer.visible = false;
    this.pauseButton.visible = false;
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */
  public update(time: Ticker) {
    if (this.paused) return;

    if (!this.gameRunning) return;

    this.timer.update(time);

    if (this.timer.isFinished()) {
      this.finishGame();
    }
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
  }

  /** Fully reset */
  public reset() {
    this.gameRunning = false;
    this.timer.reset();
    this.timer.stop();
    this.counter.reset();

    this.addButton.visible = false;
    this.counter.visible = false;
    this.timer.visible = false;
    this.pauseButton.visible = false;
    this.startPanel.visible = true;
    this.resultPanel.visible = false;
  }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
    this.addButton.x = centerX;
    this.addButton.y = height - 75;
    this.timer.x = width - 30;
    this.timer.y = 24;

    this.counter.x = centerX;
    this.counter.y = height * 0.15;

    this.startPanel.resize(width, height);
    this.resultPanel.resize(width, height);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    const elementsToAnimate = [
      this.pauseButton,
      this.settingsButton,
      this.addButton,
      this.counter,
      this.timer,
      this.startPanel,
      this.resultPanel,
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }

    await finalPromise;
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }

  private startGame(): void {
    this.gameRunning = true;

    this.counter.reset();
    this.timer.reset();
    this.timer.start();

    this.addButton.visible = true;
    this.counter.visible = true;
    this.timer.visible = true;
    this.pauseButton.visible = true;
    this.startPanel.visible = false;
    this.resultPanel.visible = false;
  }

  private finishGame(): void {
    this.gameRunning = false;
    this.timer.stop();

    if (engine().navigation.currentPopup) {
      void engine().navigation.dismissPopup();
    }

    this.addButton.visible = false;
    this.counter.visible = false;
    this.timer.visible = false;
    this.pauseButton.visible = false;

    this.resultPanel.setScore(this.counter.getValue());
    this.resultPanel.visible = true;
  }
}
