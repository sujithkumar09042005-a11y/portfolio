// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// OKLCH -> display sRGB (Bjorn Ottosson matrices). Writes into `out`, no allocation.
const enc = (x) => {
  x = x < 0 ? 0 : x > 1 ? 1 : x;
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
};
export function oklch(L, C, hDeg, out) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  out[0] = enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  out[1] = enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  out[2] = enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return out;
}
