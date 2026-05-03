import { Container, Sprite, Texture } from "pixi.js";

/**
 * Cache of pre-rendered emoji textures so we don't create a new canvas/Text per icon.
 * This avoids exhausting browser canvas context limits (~100 in Chrome).
 */
const emojiTextureCache = new Map<string, Texture>();

function getEmojiTexture(label: string, size: number): Texture {
  const key = `${label}_${size}`;
  if (emojiTextureCache.has(key)) {
    return emojiTextureCache.get(key)!;
  }
  // Draw emoji to a canvas and create a reusable texture from it
  const fontSize = size * 0.7;
  const canvas = document.createElement("canvas");
  const res = Math.min(window.devicePixelRatio, 2);
  canvas.width = Math.ceil(fontSize * 1.4 * res);
  canvas.height = Math.ceil(fontSize * 1.4 * res);
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontSize * res}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = Texture.from({ resource: canvas, label: key });
  emojiTextureCache.set(key, texture);
  return texture;
}

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

    // Use cached texture instead of creating a new Text per icon
    const texture = getEmojiTexture(label, size);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    this.addChild(sprite);

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
  click: {
    label: "💩",
    size: 24,
    duration: 800,
    driftY: -50,
    spreadX: 30,
  },
  gpu: {
    label: "🖥️",
    size: 28,
    duration: 1000,
    driftY: -60,
    spreadX: 20,
  },
  bot: {
    label: "🤖",
    size: 28,
    duration: 1000,
    driftY: -60,
    spreadX: 20,
  },
  farm: {
    label: "🏭",
    size: 28,
    duration: 1000,
    driftY: -60,
    spreadX: 20,
  },
  seo: {
    label: "🕷️",
    size: 28,
    duration: 1000,
    driftY: -60,
    spreadX: 20,
  },
  influencer: {
    label: "📱",
    size: 28,
    duration: 1000,
    driftY: -60,
    spreadX: 20,
  },
  datacenter: {
    label: "🏗️",
    size: 28,
    duration: 1000,
    driftY: -60,
    spreadX: 20,
  },
  model: {
    label: "🧠",
    size: 36,
    duration: 1400,
    driftY: -100,
    spreadX: 50,
    startScale: 0.1,
  },
  milestone: {
    label: "⭐",
    size: 30,
    duration: 1500,
    driftY: -120,
    spreadX: 80,
  },
} as const;

/**
 * A poop icon that pops in, bounces, and flies off screen.
 * Uses a shared pre-rendered texture to avoid creating new Text/canvas per icon.
 * Auto-removes itself once off-screen.
 */
export class BouncingIcon extends Container {
  private vx: number;
  private vy: number;
  private gravity: number;
  private spin: number;
  private bounceCount = 0;
  private maxBounces: number;
  private bounciness: number;
  private screenW: number;
  private screenH: number;
  public finished = false;

  constructor(
    x: number,
    y: number,
    screenW: number,
    screenH: number,
    label = "💩",
    size = 24,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.screenW = screenW;
    this.screenH = screenH;

    // Wildly random physics per icon
    this.vx = (Math.random() - 0.5) * 16;
    this.vy = -(4 + Math.random() * 12);
    this.gravity = 0.2 + Math.random() * 0.6;
    this.spin = (Math.random() - 0.5) * 0.3;
    this.maxBounces = 2 + Math.floor(Math.random() * 6);
    this.bounciness = 0.4 + Math.random() * 0.5;

    // Use cached texture instead of creating a new Text per icon
    const texture = getEmojiTexture(label, size);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    this.addChild(sprite);

    // Random starting scale
    this.scale.set(0.3 + Math.random() * 0.4);
    this.alpha = 1;
  }

  public update(deltaMS: number): boolean {
    if (this.finished) return true;

    const dt = deltaMS / 16;

    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.spin * dt;

    // Scale up quickly
    if (this.scale.x < 1) {
      this.scale.set(Math.min(1, this.scale.x + 0.06 * dt));
    }

    // Bounce off the bottom
    if (this.y >= this.screenH - 30 && this.vy > 0) {
      this.vy = -this.vy * this.bounciness;
      this.vx *= 0.8 + Math.random() * 0.8;
      this.spin = (Math.random() - 0.5) * 0.4;
      this.bounceCount++;
      this.y = this.screenH - 30;
    }

    // Bounce off walls
    if (this.x <= 0 && this.vx < 0) {
      this.vx = -this.vx * this.bounciness;
      this.x = 0;
    } else if (this.x >= this.screenW && this.vx > 0) {
      this.vx = -this.vx * this.bounciness;
      this.x = this.screenW;
    }

    // Remove when off-screen
    const margin = 60;
    if (
      this.x < -margin ||
      this.x > this.screenW + margin ||
      this.y < -margin ||
      this.bounceCount >= this.maxBounces
    ) {
      this.finished = true;
      this.parent?.removeChild(this);
      // Destroy container but preserve shared textures
      this.destroy({ children: true, texture: false, textureSource: false });
      return true;
    }

    return false;
  }
}

/** Map building names to icon presets */
export const BUILDING_ICONS: Record<string, keyof typeof ICON_PRESETS> = {
  "Cheap GPU": "gpu",
  "Prompt Bot": "bot",
  "Content Farm": "farm",
  "SEO Parasite": "seo",
  "AI Influencer": "influencer",
  Datacenter: "datacenter",
};
