import { Container, Graphics, Text } from "pixi.js";

/** Total game duration in seconds */
const GAME_DURATION_S = 5 * 60;
/** How often we sample a data point */
const SAMPLE_INTERVAL_MS = 200;
/** Base RAM price */
const BASE_PRICE = 2.5;

/**
 * A real-time stock-chart style line graph showing "RAM Price"
 * that increases with slop production.
 */
export class RamChart extends Container {
  private bg: Graphics;
  private line: Graphics;
  private fill: Graphics;
  private titleText: Text;

  private chartWidth = 400;
  private chartHeight = 100;
  private readonly paddingLeft = 50;
  private readonly paddingRight = 10;
  private readonly paddingTop = 24;
  private readonly paddingBottom = 4;

  /** Recorded price data points */
  private dataPoints: number[] = [];
  private elapsedMs = 0;
  private timeSinceLastSample = 0;

  /** Current RAM price (driven externally by slop count) */
  private currentPrice = BASE_PRICE;

  constructor() {
    super();

    // Dark background
    this.bg = new Graphics();
    this.addChild(this.bg);

    // Filled area under the line
    this.fill = new Graphics();
    this.addChild(this.fill);

    // Price line
    this.line = new Graphics();
    this.addChild(this.line);

    // Title with price
    this.titleText = new Text({
      text: `📈 RAM Price ($${BASE_PRICE.toFixed(2)}/GB)`,
      style: {
        fontSize: 14,
        fill: 0x999999,
        fontFamily: "monospace",
      },
      anchor: { x: 0, y: 1 },
    });
    this.addChild(this.titleText);

    // Initial data point
    this.dataPoints.push(BASE_PRICE);
  }

  /** Call every frame. slopCount drives the price. */
  public update(deltaMS: number, slopCount: number): void {
    this.elapsedMs += deltaMS;
    this.timeSinceLastSample += deltaMS;

    // Update price based on slop count
    // Price = base + log2(1 + slops)^2 * scaling + noise
    const noise = (Math.random() - 0.4) * 0.5;
    const logSlops = Math.log2(1 + slopCount);
    this.currentPrice = BASE_PRICE + logSlops * logSlops * 1.2 + noise;
    this.currentPrice = Math.max(BASE_PRICE, this.currentPrice);

    // Sample at intervals
    if (this.timeSinceLastSample >= SAMPLE_INTERVAL_MS) {
      this.dataPoints.push(this.currentPrice);
      this.timeSinceLastSample -= SAMPLE_INTERVAL_MS;
    }

    // Update price display in title
    const priceColor =
      this.currentPrice > BASE_PRICE + 10 ? 0xff4444 : 0x00ff88;
    this.titleText.style.fill = priceColor;
    this.titleText.text = `📈 RAM Price ($${this.currentPrice.toFixed(2)}/GB)`;

    this.drawChart();
  }

  public setSize(width: number, height: number): void {
    this.chartWidth = width;
    this.chartHeight = height;
    this.drawBackground();
    this.drawChart();

    this.titleText.x = this.paddingLeft;
    this.titleText.y = this.paddingTop - 4;
  }

  private drawBackground(): void {
    this.bg.clear();

    // Dark semi-transparent background
    this.bg.roundRect(0, 0, this.chartWidth, this.chartHeight, 8);
    this.bg.fill({ color: 0x111111, alpha: 0.75 });

    // Grid lines
    const innerW = this.chartWidth - this.paddingLeft - this.paddingRight;
    const innerH = this.chartHeight - this.paddingTop - this.paddingBottom;

    this.bg.setStrokeStyle({ width: 1, color: 0x333333, alpha: 0.5 });
    for (let i = 0; i <= 4; i++) {
      const y = this.paddingTop + (innerH * i) / 4;
      this.bg.moveTo(this.paddingLeft, y);
      this.bg.lineTo(this.paddingLeft + innerW, y);
    }
    this.bg.stroke();

    // Time markers
    this.bg.setStrokeStyle({ width: 1, color: 0x333333, alpha: 0.3 });
    for (let i = 1; i <= 4; i++) {
      const x = this.paddingLeft + (innerW * i) / 5;
      this.bg.moveTo(x, this.paddingTop);
      this.bg.lineTo(x, this.paddingTop + innerH);
    }
    this.bg.stroke();
  }

  private drawChart(): void {
    if (this.dataPoints.length < 2) return;

    const innerW = this.chartWidth - this.paddingLeft - this.paddingRight;
    const innerH = this.chartHeight - this.paddingTop - this.paddingBottom;

    // Total expected samples over 5 minutes
    const totalSamples = (GAME_DURATION_S * 1000) / SAMPLE_INTERVAL_MS;

    // Find min/max for Y scale
    const minPrice = BASE_PRICE * 0.9;
    const maxPrice = Math.max(
      BASE_PRICE * 2,
      ...this.dataPoints,
      this.currentPrice * 1.1,
    );

    // Map a price to Y coordinate
    const priceToY = (p: number): number => {
      const ratio = (p - minPrice) / (maxPrice - minPrice);
      return this.paddingTop + innerH * (1 - ratio);
    };

    // Map a sample index to X coordinate (fills full width over 5 min)
    const indexToX = (i: number): number => {
      return this.paddingLeft + (innerW * i) / totalSamples;
    };

    // Draw filled area
    this.fill.clear();
    this.fill.moveTo(indexToX(0), priceToY(this.dataPoints[0]));
    for (let i = 1; i < this.dataPoints.length; i++) {
      this.fill.lineTo(indexToX(i), priceToY(this.dataPoints[i]));
    }
    // Close the fill path along the bottom
    this.fill.lineTo(
      indexToX(this.dataPoints.length - 1),
      this.paddingTop + innerH,
    );
    this.fill.lineTo(indexToX(0), this.paddingTop + innerH);
    this.fill.closePath();
    this.fill.fill({ color: 0x00ff88, alpha: 0.1 });

    // Draw line
    this.line.clear();
    this.line.setStrokeStyle({ width: 2, color: 0x00ff88 });
    this.line.moveTo(indexToX(0), priceToY(this.dataPoints[0]));
    for (let i = 1; i < this.dataPoints.length; i++) {
      this.line.lineTo(indexToX(i), priceToY(this.dataPoints[i]));
    }
    this.line.stroke();

    // Red tint when price is high
    if (this.currentPrice > BASE_PRICE + 3) {
      this.line.setStrokeStyle({ width: 0 });
      const lastX = indexToX(this.dataPoints.length - 1);
      const lastY = priceToY(this.dataPoints[this.dataPoints.length - 1]);
      this.line.circle(lastX, lastY, 3);
      this.line.fill(0xff4444);
    }
  }
}
