import type { Ticker } from "pixi.js";
import { Container, Text } from "pixi.js";

export interface TimerOptions {
  durationMs?: number;
  fontSize?: number;
  fill?: number;
}

/**
 * A countdown timer component that displays time in MM:SS.
 */
export class Timer extends Container {
  private timerText: Text;
  private timeRemainingMs: number;
  private running = false;

  constructor(options: TimerOptions = {}) {
    super();

    const {
      durationMs = 1 * 10 * 1000,
      fontSize = 42,
      fill = 0xffffff,
    } = options;

    this.timeRemainingMs = durationMs;

    this.timerText = new Text({
      text: this.formatTime(this.timeRemainingMs),
      style: {
        fontSize,
        fill,
        fontFamily: "Arial",
      },
      anchor: { x: 1, y: 0 },
    });

    this.addChild(this.timerText);
  }

  public update(time: Ticker): void {
    if (!this.running) return;

    if (this.timeRemainingMs <= 0) return;

    this.timeRemainingMs = Math.max(0, this.timeRemainingMs - time.deltaMS);
    this.timerText.text = this.formatTime(this.timeRemainingMs);

    if (this.timeRemainingMs <= 0) {
      this.running = false;
    }
  }

  public reset(durationMs = 1 * 10 * 1000): void {
    this.timeRemainingMs = durationMs;
    this.running = false;
    this.timerText.text = this.formatTime(this.timeRemainingMs);
  }

  public start(): void {
    if (this.timeRemainingMs <= 0) return;

    this.running = true;
  }

  public stop(): void {
    this.running = false;
  }

  public isFinished(): boolean {
    return this.timeRemainingMs <= 0;
  }

  public getRemainingMs(): number {
    return this.timeRemainingMs;
  }

  private formatTime(timeMs: number): string {
    const totalSeconds = Math.ceil(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}
