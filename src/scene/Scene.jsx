// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { createWorld } from "./world.js";

export default function Scene({ onReady, onFail }) {
  const ref = useRef(null);
  useEffect(() => {
    let dispose = null;
    try {
      dispose = createWorld(ref.current, { onFirstFrame: onReady });
    } catch (err) {
      console.warn("WebGL unavailable, showing the static scene", err);
      onFail && onFail();
    }
    return () => dispose && dispose();
  }, [onReady, onFail]);
  return <canvas ref={ref} className="scene" aria-hidden="true" />;
}
