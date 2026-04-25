import { Container, Graphics, Text } from "pixi.js";

/** Options for spawning a floating icon */
export interface FloatingIconOptions {
  /** Emoji or short text to display */
  label: string;
  /** Starting X position */
  x: number;
  /** Starting Y position */
  y: number;
  /** Size of the placeholder square behind the label */
  size?: number;
  /** Color of the placeholder square */
  color?: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** How far the icon drifts upward */
  driftY?: number;
  /** Random horizontal spread */
  spreadX?: number;
  /** Starting scale */
  startScale?: number;
}

/**
 * A small placeholder icon that pops in, floats upward, and fades out.
 * Auto-removes itself from parent when done.
 */
export class FloatingIcon extends Container {
  private elapsed = 0;
  private duration: number;
  private driftY: number;
  private offsetX: number;
  private startY: number;
  private startScale: number;
  public finished = false;

  constructor(options: FloatingIconOptions) {
    super();

    const {
      label,
      x,
      y,
      size = 32,
      color = 0xffffff,
      duration = 1200,
      driftY = -80,
      spreadX = 40,
      startScale = 0.3,
    } = options;

    this.x = x;
    this.y = y;
    this.startY = y;
    this.duration = duration;
    this.driftY = driftY;
    this.startScale = startScale;
    this.offsetX = (Math.random() - 0.5) * spreadX * 2;

    // Colored placeholder square
    const bg = new Graphics();
    bg.roundRect(-size / 2, -size / 2, size, size, 6);
    bg.fill(color);
    bg.alpha = 0.6;
    this.addChild(bg);

    // Emoji / text label on top
    const txt = new Text({
      text: label,
      style: {
        fontSize: size * 0.7,
        fill: 0xffffff,
        fontFamily: "Arial",
      },
      anchor: 0.5,
    });
    this.addChild(txt);

    this.scale.set(startScale);
    this.alpha = 0;
  }

  /** Call every frame with deltaMS. Returns true when animation is done. */
  public update(deltaMS: number): boolean {
    if (this.finished) return true;

    this.elapsed += deltaMS;
    const t = Math.min(this.elapsed / this.duration, 1);

    // Phase 1: pop in (0 → 0.3)
    // Phase 2: drift to final position (0.3 → 1.0)
    // Then stay forever

    if (t < 0.3) {
      // Pop in: scale up with overshoot, fade in
      const pt = t / 0.3;
      const overshoot = 1 + 0.3 * Math.sin(pt * Math.PI);
      this.scale.set(this.startScale + (1 - this.startScale) * pt * overshoot);
      this.alpha = pt;
    } else {
      this.scale.set(1);
      this.alpha = 1;
    }

    // Drift upward + horizontal spread
    this.y = this.startY + this.driftY * t;
    this.x += this.offsetX * (deltaMS / this.duration);

    if (t >= 1) {
      this.finished = true;
      // Icon stays in place — no removal
      return true;
    }

    return false;
  }
}

/** Preset configs for different events */
export const ICON_PRESETS = {
  click: { label: "💩", size: 24, color: 0x8b6914, duration: 800, driftY: -50, spreadX: 30 },
  gpu: { label: "🖥️", size: 28, color: 0x4a9e4a, duration: 1000, driftY: -60, spreadX: 20 },
  bot: { label: "🤖", size: 28, color: 0x3a7bd5, duration: 1000, driftY: -60, spreadX: 20 },
  farm: { label: "🏭", size: 28, color: 0x8b4513, duration: 1000, driftY: -60, spreadX: 20 },
  seo: { label: "🕷️", size: 28, color: 0x333333, duration: 1000, driftY: -60, spreadX: 20 },
  influencer: { label: "📱", size: 28, color: 0xff69b4, duration: 1000, driftY: -60, spreadX: 20 },
  datacenter: { label: "🏗️", size: 28, color: 0x708090, duration: 1000, driftY: -60, spreadX: 20 },
  model: { label: "🧠", size: 36, color: 0xffcc00, duration: 1400, driftY: -100, spreadX: 50, startScale: 0.1 },
  milestone: { label: "⭐", size: 30, color: 0xffd700, duration: 1500, driftY: -120, spreadX: 80 },
} as const;

/** Map building names to icon presets */
export const BUILDING_ICONS: Record<string, keyof typeof ICON_PRESETS> = {
  "Cheap GPU": "gpu",
  "Prompt Bot": "bot",
  "Content Farm": "farm",
  "SEO Parasite": "seo",
  "AI Influencer": "influencer",
  Datacenter: "datacenter",
};
