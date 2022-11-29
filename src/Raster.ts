import { RgbaColor } from "colord";

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

  get(x: number, y: number): RgbaColor {
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

export class MutableRaster extends Raster {
  constructor(width: number, height: number, data?: Uint8ClampedArray) {
    super(width, height, data, { copyData: true });
  }

  set(x: number, y: number, color: RgbaColor): void {
    if (0 > x || x >= this.width || 0 > y || y >= this.height) {
      throw new Error(`(${x}, ${y}) out of Raster bounds!`);
    }
    const index = (y * this.width + x) * 4;
    this.data[index] = color.r;
    this.data[index + 1] = color.g;
    this.data[index + 2] = color.b;
    this.data[index + 3] = color.a;
  }
}
