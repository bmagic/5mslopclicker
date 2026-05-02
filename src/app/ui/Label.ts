import type { TextOptions, TextStyleOptions } from "pixi.js";
import { Text } from "pixi.js";

const defaultLabelStyle: Partial<TextStyleOptions> = {
  fontFamily: "Arial, Helvetica, sans-serif",
  align: "center",
};

export type LabelOptions = typeof defaultLabelStyle;

/** Label with default style */
export class Label extends Text {
  constructor(opts?: TextOptions) {
    const style = { ...defaultLabelStyle, ...opts?.style };
    super({ ...opts, style });
    this.anchor.set(0.5);
  }
}
