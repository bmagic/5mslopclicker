import { Container, Graphics, Text } from "pixi.js";

export interface CounterOptions {
  fontSize?: number;
  fill?: number;
  initialValue?: number;
}

/** Duration of the roll animation in ms */
const ROLL_DURATION = 200;

/**
 * A single digit column that rolls vertically like a car odometer.
 */
class DigitReel extends Container {
  private digits: Text[] = [];
  private strip: Container;
  private digitHeight: number;
  private currentDigit = 0;
  private animating = false;
  private animStart = 0;
  private animFrom = 0;
  private animTo = 0;
  public override mask: Graphics;

  constructor(
    private fontSize: number,
    private fillColor: number,
  ) {
    super();

    this.digitHeight = fontSize * 1.2;

    // Container that holds all 10 digit texts stacked vertically
    this.strip = new Container();
    this.addChild(this.strip);

    for (let i = 0; i < 10; i++) {
      const t = new Text({
        text: `${i}`,
        style: {
          fontSize: this.fontSize,
          fill: this.fillColor,
          fontFamily: "monospace",
          fontWeight: "bold",
        },
        anchor: { x: 0.5, y: 0 },
      });
      t.y = i * this.digitHeight;
      this.strip.addChild(t);
      this.digits.push(t);
    }

    // Mask to show only one digit at a time
    this.mask = new Graphics();
    this.mask.rect(-this.fontSize * 0.5, 0, this.fontSize, this.digitHeight);
    this.mask.fill(0xffffff);
    this.addChild(this.mask);
    this.strip.mask = this.mask;

    this.strip.y = 0;
  }

  public setDigit(digit: number): void {
    if (digit === this.currentDigit) return;
    this.currentDigit = digit;

    this.animFrom = this.strip.y;
    this.animTo = -digit * this.digitHeight;
    this.animStart = performance.now();
    this.animating = true;
  }

  public setDigitImmediate(digit: number): void {
    this.currentDigit = digit;
    this.strip.y = -digit * this.digitHeight;
    this.animating = false;
  }

  public update(): void {
    if (!this.animating) return;

    const elapsed = performance.now() - this.animStart;
    const t = Math.min(elapsed / ROLL_DURATION, 1);
    // Ease-out quad
    const eased = 1 - (1 - t) * (1 - t);
    this.strip.y = this.animFrom + (this.animTo - this.animFrom) * eased;

    if (t >= 1) {
      this.strip.y = this.animTo;
      this.animating = false;
    }
  }

  public getWidth(): number {
    return this.digits[0]?.width ?? this.fontSize * 0.6;
  }
}

/** Counter with odometer-style rolling digits */
export class Counter extends Container {
  private count = 0;
  private reels: DigitReel[] = [];
  private reelsContainer: Container;
  private suffixText: Text;
  private fontSize: number;
  private fillColor: number;

  constructor(options: CounterOptions = {}) {
    super();

    const { fontSize = 48, fill = 0xffffff, initialValue = 0 } = options;
    this.fontSize = fontSize;
    this.fillColor = fill;
    this.count = initialValue;

    this.reelsContainer = new Container();
    this.addChild(this.reelsContainer);

    this.suffixText = new Text({
      text: " slops",
      style: {
        fontSize,
        fill,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      anchor: { x: 0, y: 0 },
    });
    this.addChild(this.suffixText);

    this.buildReels(this.count);
  }

  public increment(amount: number = 1): void {
    this.count += amount;
    this.setDigits(this.count);
  }

  public reset(): void {
    this.count = 0;
    this.setDigits(0);
  }

  public setValue(value: number): void {
    this.count = Math.max(0, value);
    this.setDigits(this.count);
  }

  public getValue(): number {
    return this.count;
  }

  public updateAnimation(): void {
    for (const reel of this.reels) {
      reel.update();
    }
  }

  private buildReels(value: number): void {
    this.reelsContainer.removeChildren();
    this.reels = [];

    const str = String(Math.floor(Math.max(0, value)));
    const numDigits = Math.max(1, str.length);

    for (let i = 0; i < numDigits; i++) {
      const reel = new DigitReel(this.fontSize, this.fillColor);
      this.reels.push(reel);
      this.reelsContainer.addChild(reel);
    }

    this.layoutReels();

    const padded = str.padStart(numDigits, "0");
    for (let i = 0; i < numDigits; i++) {
      this.reels[i].setDigitImmediate(Number(padded[i]));
    }
  }

  private setDigits(value: number): void {
    const str = String(Math.floor(Math.max(0, value)));

    // If digit count changed, rebuild reels
    if (str.length !== this.reels.length) {
      this.buildReels(value);
      return;
    }

    for (let i = 0; i < this.reels.length; i++) {
      this.reels[i].setDigit(Number(str[i]));
    }

    this.updateSuffix();
  }

  private layoutReels(): void {
    const digitWidth = this.reels[0]?.getWidth() ?? this.fontSize * 0.6;
    const gap = digitWidth * 0.15;
    const separatorGap = digitWidth * 0.5; // extra space every 3 digits
    const n = this.reels.length;

    // Count how many separator gaps we need (every 3 digits from the right)
    const numSeparators = n > 3 ? Math.floor((n - 1) / 3) : 0;
    const totalWidth =
      n * digitWidth +
      (n - 1) * gap +
      numSeparators * separatorGap +
      this.suffixText.width;
    const startX = -totalWidth / 2;

    let xOffset = 0;
    for (let i = 0; i < n; i++) {
      // Add separator gap before this digit if it starts a new group of 3 from the right
      const posFromRight = n - 1 - i;
      if (i > 0 && posFromRight % 3 === 2) {
        xOffset += separatorGap;
      }
      this.reels[i].x =
        startX + i * (digitWidth + gap) + xOffset + digitWidth / 2;
      this.reels[i].y = 0;
    }

    this.suffixText.x =
      startX + n * (digitWidth + gap) + numSeparators * separatorGap;
    this.suffixText.y = 0;

    // Center vertically
    const digitHeight = this.fontSize * 1.2;
    this.reelsContainer.y = -digitHeight / 2;
    this.suffixText.y = -digitHeight / 2;

    this.updateSuffix();
  }

  private updateSuffix(): void {
    this.suffixText.text = ` slop${this.count <= 1 ? "" : "s"}`;
  }
}
