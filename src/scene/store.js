// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// Shared mutable pointer state (read by the WebGL loop, no React renders per frame).
export const store = { px: 0, py: 0, sx: 0, sy: 0, moved: false, t: 0 };
