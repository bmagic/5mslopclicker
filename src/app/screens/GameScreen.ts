import { FancyButton } from "@pixi/ui";
import type { Ticker } from "pixi.js";
import { Container, Text } from "pixi.js";

import { engine } from "../getEngine";
import { PausePopup } from "../popups/PausePopup";
import { SettingsPopup } from "../popups/SettingsPopup";
import { Button } from "../ui/Button";
import { Counter } from "../ui/Counter";
import { Timer } from "../ui/Timer";
import { ResultScreen } from "./ResultScreen";

/** Screen where the game is being played */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private settingsButton: FancyButton;
  private pauseButton: FancyButton;
  private addButton: Button;
  private buyMultiplierButton: Button;
  private buyAutoClickerButton: Button;
  private counter: Counter;
  private timer: Timer;
  private multiplier = 1;
  private multiplierText: Text;
  private readonly MULTIPLIER_COST = 10;

  private autoClickerLevel = 0;
  private autoClickerGain = 0;
  private timeSinceLastAutoClick = 0;
  private readonly AUTO_CLICKER_INTERVAL_MS = 1000;
  private autoClickerText: Text;

  constructor() {
    super();

    this.counter = new Counter();
    this.addChild(this.counter);

    this.timer = new Timer();
    this.addChild(this.timer);

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

    this.settingsButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() =>
      engine().navigation.presentPopup(SettingsPopup),
    );
    this.addChild(this.settingsButton);

    this.pauseButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.pauseButton.onPress.connect(() =>
      engine().navigation.presentPopup(PausePopup),
    );
    this.addChild(this.pauseButton);

    this.addButton = new Button({
      text: "Click",
      width: 300,
      height: 110,
    });
    this.addButton.onPress.connect(() =>
      this.counter.increment(this.multiplier),
    );
    this.addChild(this.addButton);

    this.buyMultiplierButton = new Button({
      text: `Buy x${this.multiplier + 1} (${this.MULTIPLIER_COST})`,
      width: 200,
      height: 80,
    });
    this.buyMultiplierButton.onPress.connect(() => this.buyMultiplier());
    this.addChild(this.buyMultiplierButton);

    this.multiplierText = new Text({
      text: `Multiplier: x${this.multiplier}`,
      style: {
        fontSize: 32,
        fill: 0xffcc00,
        fontFamily: "Arial",
      },
      anchor: 0.5,
    });
    this.addChild(this.multiplierText);

    this.buyAutoClickerButton = new Button({
      text: `Buy Auto (${this.getAutoClickerCost()})`,
      width: 200,
      height: 80,
    });
    this.buyAutoClickerButton.onPress.connect(() => this.buyAutoClicker());
    this.addChild(this.buyAutoClickerButton);

    this.autoClickerText = new Text({
      text: `Auto-clicker: +${this.autoClickerGain}/sec`,
      style: {
        fontSize: 28,
        fill: 0x00ff99,
        fontFamily: "Arial",
      },
      anchor: 0.5,
    });
    this.addChild(this.autoClickerText);
  }

  public update(time: Ticker) {
    this.timer.update(time);

    this.updateMultiplierButtonState();
    this.updateAutoClickerButtonState();
    this.updateAutoClicker(time.deltaMS);

    if (this.timer.isFinished()) {
      this.finishGame();
    }
  }

  public resize(width: number, height: number) {
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
    this.addButton.x = width * 0.5;
    this.addButton.y = height - 75;
    this.buyMultiplierButton.x = width * 0.25;
    this.buyMultiplierButton.y = height - 75;
    this.buyAutoClickerButton.x = width * 0.75;
    this.buyAutoClickerButton.y = height - 75;
    this.timer.x = width - 30;
    this.timer.y = 24;

    this.counter.x = width * 0.5;
    this.counter.y = height * 0.15;
    this.multiplierText.x = width * 0.5;
    this.multiplierText.y = height * 0.35;
    this.autoClickerText.x = width * 0.5;
    this.autoClickerText.y = height * 0.5;
  }

  public async show(): Promise<void> {
    this.timer.start();
  }

  public async hide() {}

  public blur() {
    // No auto-pause popup during game, optional optimization
  }

  private finishGame(): void {
    if (engine().navigation.currentPopup) {
      void engine().navigation.dismissPopup();
    }

    // Store the final score temporarily
    const gameWindow = window as unknown as { __gameScore?: number };
    gameWindow.__gameScore = this.counter.getValue();

    void engine().navigation.showScreen(ResultScreen);
  }

  private buyMultiplier(): void {
    if (this.counter.getValue() < this.MULTIPLIER_COST) {
      return;
    }

    this.counter.setValue(this.counter.getValue() - this.MULTIPLIER_COST);
    this.multiplier += 1;
    this.updateMultiplierDisplay();
  }

  private updateMultiplierDisplay(): void {
    this.multiplierText.text = `Multiplier: x${this.multiplier}`;
    this.buyMultiplierButton.text = `Buy x${this.multiplier + 1} (${this.MULTIPLIER_COST})`;
    // Recalculate auto-clicker gain when multiplier changes
    if (this.autoClickerLevel > 0) {
      this.autoClickerGain = this.autoClickerLevel * this.multiplier;
      this.updateAutoClickerDisplay();
    }
  }

  private updateMultiplierButtonState(): void {
    const canBuy = this.counter.getValue() >= this.MULTIPLIER_COST;
    this.buyMultiplierButton.alpha = canBuy ? 1 : 0.5;
    this.buyMultiplierButton.interactive = canBuy;
  }

  private buyAutoClicker(): void {
    const cost = this.getAutoClickerCost();
    if (this.counter.getValue() < cost) {
      return;
    }

    this.counter.setValue(this.counter.getValue() - cost);
    this.autoClickerLevel += 1;
    this.autoClickerGain = this.autoClickerLevel * this.multiplier;
    this.updateAutoClickerDisplay();
  }

  private getAutoClickerCost(): number {
    return 100 + this.autoClickerLevel * 50;
  }

  private updateAutoClickerDisplay(): void {
    this.autoClickerText.text = `Auto-clicker: +${this.autoClickerGain.toFixed(1)}/sec`;
    this.buyAutoClickerButton.text = `Buy Auto (${this.getAutoClickerCost()})`;
  }

  private updateAutoClickerButtonState(): void {
    const canBuy = this.counter.getValue() >= this.getAutoClickerCost();
    this.buyAutoClickerButton.alpha = canBuy ? 1 : 0.5;
    this.buyAutoClickerButton.interactive = canBuy;
  }

  private updateAutoClicker(deltaMS: number): void {
    if (this.autoClickerGain <= 0) {
      return;
    }

    this.timeSinceLastAutoClick += deltaMS;

    if (this.timeSinceLastAutoClick >= this.AUTO_CLICKER_INTERVAL_MS) {
      this.counter.increment(Math.floor(this.autoClickerGain));
      this.timeSinceLastAutoClick -= this.AUTO_CLICKER_INTERVAL_MS;
    }
  }
}
