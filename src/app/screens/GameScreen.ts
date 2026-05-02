import { FancyButton } from "@pixi/ui";
import type { Ticker } from "pixi.js";
import { Container, Graphics, Text } from "pixi.js";

import { engine } from "../getEngine";
import { PausePopup } from "../popups/PausePopup";
import { SettingsPopup } from "../popups/SettingsPopup";
import { Button } from "../ui/Button";
import { Counter } from "../ui/Counter";
import { BUILDING_ICONS, BouncingIcon, ICON_PRESETS } from "../ui/FloatingIcon";
import { MilestoneCard } from "../ui/MilestoneCard";
import { RamChart } from "../ui/RamChart";
import { Timer } from "../ui/Timer";
import { MILESTONE_VALUES, unlockMilestone } from "../utils/milestones";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";

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
  private stopButton: FancyButton;
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
  private bouncingIcons: BouncingIcon[] = [];
  private nextMilestone = 0;
  private screenWidth = 0;
  private screenHeight = 0;

  // RAM price chart
  private ramChart: RamChart;

  // Milestone background cards
  private cardsContainer: Container;
  private milestoneCards: MilestoneCard[] = [];

  // Minute-warning sound thresholds (in ms) → sound alias
  private minuteWarningSounds = new Map<number, string>([
    [4 * 60_000, "main/sounds/sfx-warning-4min.wav"],
    [3 * 60_000, "main/sounds/sfx-warning-3min.wav"],
    [2 * 60_000, "main/sounds/sfx-warning-2min.wav"],
    [1 * 60_000, "main/sounds/sfx-warning-1min.wav"],
    [0, "main/sounds/sfx-warning-0min.wav"],
  ]);
  private triggeredWarnings = new Set<number>();

  constructor() {
    super();

    // Milestone cards layer (very back)
    this.cardsContainer = new Container();
    this.addChild(this.cardsContainer);

    // Floating icons layer (behind everything else)
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

    this.stopButton = new FancyButton({
      defaultView: this.createStopButtonView(),
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.stopButton.onPress.connect(() => this.stopGameAndReturnHome());
    this.addChild(this.stopButton);

    // Main click button
    this.addButton = new Button({
      text: "Generate Slop",
      width: 300,
      height: 110,
    });
    this.addButton.onPress.connect(() => {
      this.counter.increment(this.modelLevel);
      for (let i = 0; i < this.modelLevel; i++) {
        this.spawnBouncingIcon("click");
      }
      this.checkMilestones();
    });
    this.addChild(this.addButton);

    // "Bigger Model" upgrade button (click multiplier)
    this.buyModelButton = new Button({
      text: this.getModelButtonText(),
      width: 280,
      height: 70,
      fontSize: 16,
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
    this.buildingsContainer = new Container({
      x: 0,
      y: 200,
    });
    this.addChild(this.buildingsContainer);

    for (const def of BUILDING_DEFS) {
      const btn = new Button({
        text: this.getBuildingButtonText(def, 0),
        width: 240,
        height: 60,
        fontSize: 14,
      });
      const label = new Text({
        text: "",
        style: {
          fontSize: 18,
          fill: 0xcccccc,
          fontFamily: "Arial",
        },
        anchor: { x: 0.5, y: 0.5 },
      });
      const state: BuildingState = { def, owned: 0, button: btn, label };
      btn.onPress.connect(() => this.buyBuilding(state));
      this.buildingsContainer.addChild(btn);
      this.buildingsContainer.addChild(label);
      this.buildings.push(state);
    }

    // RAM price chart at the bottom
    this.ramChart = new RamChart();
    this.addChild(this.ramChart);
  }

  public update(time: Ticker) {
    this.timer.update(time);
    this.counter.updateAnimation();

    this.updateModelButtonState();
    this.updateBuildingButtonStates();
    this.updatePassiveIncome(time.deltaMS);
    this.updateIcons(time.deltaMS);
    this.checkMilestones();
    this.checkMinuteWarnings();
    this.ramChart.update(time.deltaMS, this.counter.getValue());

    if (this.timer.isFinished()) {
      this.finishGame();
    }
  }

  public resize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.stopButton.x = this.pauseButton.x + 45;
    this.stopButton.y = this.pauseButton.y;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;

    this.timer.x = width - 80;
    this.timer.y = 24;

    // Counter at top center-left
    this.counter.x = width * 0.4;
    this.counter.y = height * 0.12;

    // SPS below counter
    this.spsText.x = width * 0.4;
    this.spsText.y = height * 0.12 + 50;

    // Main click button
    this.addButton.x = width * 0.4;
    this.addButton.y = height * 0.75;

    // --- Right panel ---
    const panelX = width * 0.9;

    // Model upgrade button
    this.buyModelButton.x = panelX;
    this.buyModelButton.y = height * 0.8;
    this.modelText.x = panelX;
    this.modelText.y = height * 0.8 - 50;

    // Building buttons
    const startY = 0;
    const rowHeight = 95;
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      b.button.x = panelX;
      b.button.y = startY + i * rowHeight;
      b.label.x = panelX;
      b.label.y = startY + i * rowHeight + 35;
    }

    // RAM chart fills bottom
    const chartHeight = Math.max(80, height * 0.15);
    this.ramChart.x = 0;
    this.ramChart.y = height - chartHeight;
    this.ramChart.setSize(width, chartHeight);
  }

  public async show(): Promise<void> {
    this.timer.start();
  }

  public async hide() {}

  public blur() {
    // No auto-pause popup during game, optional optimization
  }

  // ---------- Minute Warnings ----------

  private checkMinuteWarnings(): void {
    const remaining = this.timer.getRemainingMs();
    for (const [threshold, alias] of this.minuteWarningSounds) {
      if (!this.triggeredWarnings.has(threshold) && remaining <= threshold) {
        this.triggeredWarnings.add(threshold);
        engine().audio.sfx.play(alias, { volume: 0.7 });
      }
    }
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

  private stopGameAndReturnHome(): void {
    void engine().navigation.showScreen(StartScreen);
  }

  private createStopButtonView(): Container {
    const view = new Container();

    const bg = new Graphics();
    bg.circle(0, 0, 16);
    bg.fill(0xd84444);
    bg.y = 16;
    bg.x = 15;
    view.addChild(bg);

    const cross = new Text({
      text: "X",
      style: {
        fontSize: 22,
        fill: 0xffffff,
        fontFamily: "Arial",
        fontWeight: "bold",
      },
      anchor: 0.5,
    });
    cross.y = 15;
    cross.x = 15;
    view.addChild(cross);

    return view;
  }

  // ---------- Bigger Model (click multiplier) ----------

  private buyModel(): void {
    const cost = this.getModelCost();
    if (this.counter.getValue() < cost) return;

    this.counter.setValue(this.counter.getValue() - cost);
    this.modelLevel += 1;
    this.recalcTotalSps();
    this.updateModelDisplay();
    this.spawnBouncingIcon("model");
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
    return `Canard AI v${level}`;
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
    this.spawnBouncingIcon(preset);
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
      // Spawn 1 bouncing poop per slop gained — fountain effect at high SPS
      for (let i = 0; i < whole; i++) {
        this.spawnBouncingIcon("click");
      }
    }
  }

  // ---------- Helpers ----------

  private formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  }

  // ---------- Floating Icons ----------

  private spawnBouncingIcon(
    preset: keyof typeof ICON_PRESETS,
    force = false,
  ): void {
    if (!force && this.bouncingIcons.length >= 1000) return;
    const cfg = ICON_PRESETS[preset];
    // Spawn from the counter position with small random spread
    const x = this.counter.x + (Math.random() - 0.5) * 60;
    const y = this.counter.y;
    // Constrain bouncing area to the left zone (avoid right button panel)
    const safeWidth = this.screenWidth * 0.8;
    // Constrain height above RamChart
    const chartHeight = Math.max(80, this.screenHeight * 0.15);
    const safeHeight = this.screenHeight - chartHeight;
    const icon = new BouncingIcon(
      x,
      y,
      safeWidth,
      safeHeight,
      cfg.label,
      cfg.size,
    );
    this.iconsContainer.addChild(icon);
    this.bouncingIcons.push(icon);
  }

  private updateIcons(deltaMS: number): void {
    for (let i = this.bouncingIcons.length - 1; i >= 0; i--) {
      if (this.bouncingIcons[i].update(deltaMS)) {
        this.bouncingIcons.splice(i, 1);
      }
    }
  }

  private checkMilestones(): void {
    const score = this.counter.getValue();
    while (
      this.nextMilestone < MILESTONE_VALUES.length &&
      score >= MILESTONE_VALUES[this.nextMilestone]
    ) {
      unlockMilestone(this.nextMilestone);
      this.nextMilestone++;
      // Play jackpot sound
      engine().audio.sfx.play("main/sounds/sfx-jackpot.wav", { volume: 0.6 });
      // Spawn milestone background card
      this.spawnMilestoneCard(this.nextMilestone - 1);
      // Massive star explosion (bypasses icon cap)
      for (let i = 0; i < 500; i++) {
        this.spawnBouncingIcon("milestone", true);
      }
    }
  }

  private spawnMilestoneCard(index: number): void {
    // Constrain cards to the left area (avoid right button panel)
    const safeWidth = this.screenWidth * 0.8;
    // Constrain height above RamChart
    const chartHeight = Math.max(80, this.screenHeight * 0.15);
    const safeHeight = this.screenHeight - chartHeight;
    const cardW = Math.min(360, safeWidth * 0.55);
    const cardH = cardW * 1.4;
    const card = new MilestoneCard(index, cardW, cardH);

    // Distribute cards in a grid pattern with slight randomness
    const cols = 3;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellW = (safeWidth - cardW) / cols;
    const cellH =
      (safeHeight - cardH) / Math.ceil(MILESTONE_VALUES.length / cols);
    const baseX = cardW / 2 + col * cellW + cellW * 0.5;
    const baseY = cardH / 2 + row * cellH + cellH * 0.5;
    // Add slight random offset for a natural look
    card.x = baseX + (Math.random() - 0.5) * cellW * 0.3;
    card.y = Math.min(
      baseY + (Math.random() - 0.5) * cellH * 0.3,
      safeHeight - cardH / 2,
    );
    card.rotation = (Math.random() - 0.5) * 0.25; // ±~7°
    card.alpha = 0.85;

    this.cardsContainer.addChild(card);
    this.milestoneCards.push(card);
  }
}
