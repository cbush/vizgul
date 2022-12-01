import { Color } from "./Color";

export class Raster {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;

  private _view: DataView;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    options?: { copyData?: boolean }
  ) {
    this.width = width;
    this.height = height;
    this.data = data
      ? options?.copyData
        ? new Uint8ClampedArray(data)
        : data
      : new Uint8ClampedArray(width * height * 4);
    if (data && data.length !== width * height * 4) {
      throw new Error("Given array does not match expected size!");
    }
    this._view = new DataView(this.data.buffer);
  }

  get(x: number, y: number): Color {
    if (0 > x || x >= this.width || 0 > y || y >= this.height) {
      throw new Error(`(${x}, ${y}) out of Raster bounds!`);
    }
    const i = (y * this.width + x) * 4;
    const v = this._view;
    return {
      r: v.getUint8(i),
      g: v.getUint8(i + 1),
      b: v.getUint8(i + 2),
      a: v.getUint8(i + 3),
    };
  }
}

export type GetSetColorFunction = (c: Color) => Color;

export class MutableRaster extends Raster {
  constructor(width: number, height: number, data?: Uint8ClampedArray) {
    super(width, height, data, { copyData: true });
  }

  set(x: number, y: number, colorIn: Color | GetSetColorFunction): void {
    if (0 > x || x >= this.width || 0 > y || y >= this.height) {
      throw new Error(`(${x}, ${y}) out of Raster bounds!`);
    }
    const color =
      typeof colorIn === "function" ? colorIn(this.get(x, y)) : colorIn;
    const rgba = color;
    const index = (y * this.width + x) * 4;
    this.data[index] = rgba.r;
    this.data[index + 1] = rgba.g;
    this.data[index + 2] = rgba.b;
    this.data[index + 3] = rgba.a * 255;
  }
}
