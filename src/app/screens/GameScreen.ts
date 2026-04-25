import { FancyButton } from "@pixi/ui";
import type { Ticker } from "pixi.js";
import { Container, Text } from "pixi.js";

import { engine } from "../getEngine";
import { PausePopup } from "../popups/PausePopup";
import { SettingsPopup } from "../popups/SettingsPopup";
import { Button } from "../ui/Button";
import { Counter } from "../ui/Counter";
import { BUILDING_ICONS, FloatingIcon, ICON_PRESETS } from "../ui/FloatingIcon";
import { Timer } from "../ui/Timer";
import { ResultScreen } from "./ResultScreen";

/** Definition of a building type (Cookie Clicker style) */
interface BuildingDef {
  name: string;
  baseCost: number;
  baseSps: number; // slops per second
}

/** Runtime state for an owned building */
interface BuildingState {
  def: BuildingDef;
  owned: number;
  button: Button;
  label: Text;
}

/** Cookie Clicker-style cost growth rate */
const COST_GROWTH = 1.15;

/** All available buildings, ordered by tier */
const BUILDING_DEFS: BuildingDef[] = [
  { name: "Cheap GPU", baseCost: 15, baseSps: 0.5 },
  { name: "Prompt Bot", baseCost: 100, baseSps: 2 },
  { name: "Content Farm", baseCost: 500, baseSps: 8 },
  { name: "SEO Parasite", baseCost: 3_000, baseSps: 30 },
  { name: "AI Influencer", baseCost: 15_000, baseSps: 100 },
  { name: "Datacenter", baseCost: 75_000, baseSps: 400 },
];

/** AI model names, from worst to best (and beyond) */
const MODEL_NAMES: string[] = [
  "Bard 0.1",
  "ChatGPT 3.5-Turbo-Slop",
  "LLaMA 7B-Leaks",
  "Copilot Wish.com",
  "Mistral Small-ish",
  "Claude Instant Noodles",
  "Gemini Nano-Micro",
  "GPT-4o-Slop",
  "DeepSeek R2-D2",
  "Grok LOL Edition",
  "LLaMA 405B-Overfit",
  "Claude Opus 5-Turbo",
  "Gemini Ultra-Mega",
  "GPT-6-Hallucinator",
  "Mistral Le Grand",
  "SkyNet Alpha 0.1",
  "Canard PC Slop 9000",
  "Singularity.exe",
];

/** Screen where the game is being played */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private settingsButton: FancyButton;
  private pauseButton: FancyButton;
  private addButton: Button;
  private buyModelButton: Button;
  private counter: Counter;
  private timer: Timer;

  // "Bigger Model" upgrade = click multiplier
  private modelLevel = 1;
  private modelText: Text;
  private readonly MODEL_BASE_COST = 75;

  // Buildings (passive income)
  private buildings: BuildingState[] = [];
  private buildingsContainer: Container;
  private totalSps = 0;
  private spsText: Text;
  private slopAccumulator = 0;

  // Floating icons
  private iconsContainer: Container;
  private activeIcons: FloatingIcon[] = [];
  private nextMilestone = 0;
  private readonly MILESTONES = [
    50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000,
  ];
  private screenWidth = 0;
  private screenHeight = 0;

  constructor() {
    super();

    // Floating icons layer (behind everything)
    this.iconsContainer = new Container();
    this.addChild(this.iconsContainer);

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

    // Main click button
    this.addButton = new Button({
      text: "Generate Slop",
      width: 300,
      height: 110,
    });
    this.addButton.onPress.connect(() => {
      this.counter.increment(this.modelLevel);
      this.spawnIcon("click");
      this.checkMilestones();
    });
    this.addChild(this.addButton);

    // "Bigger Model" upgrade button (click multiplier)
    this.buyModelButton = new Button({
      text: this.getModelButtonText(),
      width: 220,
      height: 70,
      fontSize: 18,
    });
    this.buyModelButton.onPress.connect(() => this.buyModel());
    this.addChild(this.buyModelButton);

    this.modelText = new Text({
      text: this.getModelDisplayText(),
      style: {
        fontSize: 28,
        fill: 0xffcc00,
        fontFamily: "Arial",
      },
      anchor: 0.5,
    });
    this.addChild(this.modelText);

    // Slops per second display
    this.spsText = new Text({
      text: "0 slops/sec",
      style: {
        fontSize: 24,
        fill: 0x00ff99,
        fontFamily: "Arial",
      },
      anchor: 0.5,
    });
    this.addChild(this.spsText);

    // Buildings panel (scrollable-ish column on the right)
    this.buildingsContainer = new Container();
    this.addChild(this.buildingsContainer);

    for (const def of BUILDING_DEFS) {
      const btn = new Button({
        text: this.getBuildingButtonText(def, 0),
        width: 220,
        height: 60,
        fontSize: 16,
      });
      const label = new Text({
        text: "",
        style: {
          fontSize: 18,
          fill: 0xcccccc,
          fontFamily: "Arial",
        },
        anchor: { x: 0, y: 0.5 },
      });
      const state: BuildingState = { def, owned: 0, button: btn, label };
      btn.onPress.connect(() => this.buyBuilding(state));
      this.buildingsContainer.addChild(btn);
      this.buildingsContainer.addChild(label);
      this.buildings.push(state);
    }
  }

  public update(time: Ticker) {
    this.timer.update(time);
    this.counter.updateAnimation();

    this.updateModelButtonState();
    this.updateBuildingButtonStates();
    this.updatePassiveIncome(time.deltaMS);
    this.updateIcons(time.deltaMS);
    this.checkMilestones();

    if (this.timer.isFinished()) {
      this.finishGame();
    }
  }

  public resize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;

    this.timer.x = width - 30;
    this.timer.y = 24;

    // Counter at top center
    this.counter.x = width * 0.35;
    this.counter.y = height * 0.12;

    // SPS below counter
    this.spsText.x = width * 0.35;
    this.spsText.y = height * 0.12 + 50;

    // Model info
    this.modelText.x = width * 0.35;
    this.modelText.y = height * 0.32;

    // Main click button center-left
    this.addButton.x = width * 0.35;
    this.addButton.y = height * 0.55;

    // Bigger Model button below click
    this.buyModelButton.x = width * 0.35;
    this.buyModelButton.y = height * 0.75;

    // Buildings panel on the right side
    const panelX = width * 0.72;
    const startY = height * 0.1;
    const rowHeight = 70;
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      b.button.x = panelX;
      b.button.y = startY + i * rowHeight;
      b.label.x = panelX + 120;
      b.label.y = startY + i * rowHeight;
    }
  }

  public async show(): Promise<void> {
    this.timer.start();
  }

  public async hide() {}

  public blur() {
    // No auto-pause popup during game, optional optimization
  }

  // ---------- Finish ----------

  private finishGame(): void {
    if (engine().navigation.currentPopup) {
      void engine().navigation.dismissPopup();
    }

    const gameWindow = window as unknown as { __gameScore?: number };
    gameWindow.__gameScore = this.counter.getValue();

    void engine().navigation.showScreen(ResultScreen);
  }

  // ---------- Bigger Model (click multiplier) ----------

  private buyModel(): void {
    const cost = this.getModelCost();
    if (this.counter.getValue() < cost) return;

    this.counter.setValue(this.counter.getValue() - cost);
    this.modelLevel += 1;
    this.recalcTotalSps();
    this.updateModelDisplay();
    this.spawnIcon("model");
  }

  private getModelCost(): number {
    const level = this.modelLevel - 1;
    return Math.ceil(this.MODEL_BASE_COST * Math.pow(COST_GROWTH, level));
  }

  private getModelButtonText(): string {
    const nextName = this.getModelName(this.modelLevel + 1);
    return `${nextName} (${this.formatNumber(this.getModelCost())})`;
  }

  private getModelDisplayText(): string {
    const name = this.getModelName(this.modelLevel);
    return `${name} (x${this.modelLevel}/click)`;
  }

  private getModelName(level: number): string {
    if (level <= MODEL_NAMES.length) {
      return MODEL_NAMES[level - 1];
    }
    return `Canard PC Slop v${level}`;
  }

  private updateModelDisplay(): void {
    this.modelText.text = this.getModelDisplayText();
    this.buyModelButton.text = this.getModelButtonText();
  }

  private updateModelButtonState(): void {
    const canBuy = this.counter.getValue() >= this.getModelCost();
    this.buyModelButton.alpha = canBuy ? 1 : 0.5;
    this.buyModelButton.interactive = canBuy;
  }

  // ---------- Buildings ----------

  private buyBuilding(b: BuildingState): void {
    const cost = this.getBuildingCost(b);
    if (this.counter.getValue() < cost) return;

    this.counter.setValue(this.counter.getValue() - cost);
    b.owned += 1;
    this.recalcTotalSps();
    this.updateBuildingDisplay(b);
    const preset = BUILDING_ICONS[b.def.name] ?? "click";
    this.spawnIcon(preset);
  }

  private getBuildingCost(b: BuildingState): number {
    return Math.ceil(b.def.baseCost * Math.pow(COST_GROWTH, b.owned));
  }

  private getBuildingButtonText(def: BuildingDef, owned: number): string {
    const cost = Math.ceil(def.baseCost * Math.pow(COST_GROWTH, owned));
    return `${def.name} (${this.formatNumber(cost)})`;
  }

  private updateBuildingDisplay(b: BuildingState): void {
    b.button.text = this.getBuildingButtonText(b.def, b.owned);
    const sps = b.owned * b.def.baseSps * this.modelLevel;
    b.label.text =
      b.owned > 0 ? `x${b.owned} (+${this.formatNumber(sps)}/s)` : "";
  }

  private updateBuildingButtonStates(): void {
    for (const b of this.buildings) {
      const canBuy = this.counter.getValue() >= this.getBuildingCost(b);
      b.button.alpha = canBuy ? 1 : 0.5;
      b.button.interactive = canBuy;
    }
  }

  // ---------- Passive income ----------

  private recalcTotalSps(): void {
    let sps = 0;
    for (const b of this.buildings) {
      sps += b.owned * b.def.baseSps;
    }
    // Model level multiplies ALL passive income too
    this.totalSps = sps * this.modelLevel;
    this.spsText.text = `${this.formatNumber(this.totalSps)} slops/sec`;
    // Refresh all building labels (model level affects displayed sps)
    for (const b of this.buildings) {
      this.updateBuildingDisplay(b);
    }
  }

  private updatePassiveIncome(deltaMS: number): void {
    if (this.totalSps <= 0) return;

    this.slopAccumulator += this.totalSps * (deltaMS / 1000);
    const whole = Math.floor(this.slopAccumulator);
    if (whole > 0) {
      this.counter.increment(whole);
      this.slopAccumulator -= whole;
    }
  }

  // ---------- Helpers ----------

  private formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  }

  // ---------- Floating Icons ----------

  private spawnIcon(preset: keyof typeof ICON_PRESETS): void {
    const cfg = ICON_PRESETS[preset];
    // Random position anywhere on screen
    const margin = 40;
    const x = margin + Math.random() * (this.screenWidth - margin * 2);
    const y = margin + Math.random() * (this.screenHeight - margin * 2);
    const icon = new FloatingIcon({ ...cfg, x, y, driftY: 0, spreadX: 0 });
    this.iconsContainer.addChild(icon);
    this.activeIcons.push(icon);
  }

  private updateIcons(deltaMS: number): void {
    for (let i = this.activeIcons.length - 1; i >= 0; i--) {
      if (this.activeIcons[i].update(deltaMS)) {
        this.activeIcons.splice(i, 1);
      }
    }
  }

  private checkMilestones(): void {
    const score = this.counter.getValue();
    while (
      this.nextMilestone < this.MILESTONES.length &&
      score >= this.MILESTONES[this.nextMilestone]
    ) {
      this.nextMilestone++;
      // Spawn a burst of milestone icons
      for (let i = 0; i < 5; i++) {
        this.spawnIcon("milestone");
      }
    }
  }
}
