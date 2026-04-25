import { Container, Text } from "pixi.js";

export interface CounterOptions {
  fontSize?: number;
  fill?: number;
  initialValue?: number;
}

/**
 * A counter component that displays and manages a click counter
 */
export class Counter extends Container {
  private counterText: Text;
  private count = 0;

  constructor(options: CounterOptions = {}) {
    super();

    const { fontSize = 48, fill = 0xffffff, initialValue = 0 } = options;
    this.count = initialValue;

    this.counterText = new Text({
      text: `${this.count} slop${this.count <= 1 ? "" : "s"}`,
      style: {
        fontSize,
        fill,
        fontFamily: "Arial",
      },
      anchor: 0.5,
    });

    this.addChild(this.counterText);
  }

  /**
   * Increment the counter by a specified amount (default 1)
   */
  public increment(amount: number = 1): void {
    this.count += amount;
    this.updateDisplay();
  }

  /**
   * Reset the counter to 0
   */
  public reset(): void {
    this.count = 0;
    this.updateDisplay();
  }

  /**
   * Set the counter to a specific value
   */
  public setValue(value: number): void {
    this.count = Math.max(0, value);
    this.updateDisplay();
  }

  /**
   * Get the current counter value
   */
  public getValue(): number {
    return this.count;
  }

  /**
   * Update the text display
   */
  private updateDisplay(): void {
    this.counterText.text = `${this.count} slop${this.count <= 1 ? "" : "s"}`;
  }
}
