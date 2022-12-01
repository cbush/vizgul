import assert from "assert";
import clamp from "clamp";

export type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export const mix = (a: Color, b: Color, bRatio: number): Color => {
  assert(0 <= bRatio && bRatio <= 1);
  const aRatio = 1 - bRatio;
  return {
    r: clamp(a.r * aRatio + b.r * bRatio, 0, 255),
    b: clamp(a.b * aRatio + b.b * bRatio, 0, 255),
    g: clamp(a.g * aRatio + b.g * bRatio, 0, 255),
    a: clamp(a.a * aRatio + b.a * bRatio, 0, 255),
  };
};
