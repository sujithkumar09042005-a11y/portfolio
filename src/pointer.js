// One shared record of where the pointer is and when it last clicked, read by the name and the background each frame.
// Written by a single set of listeners, so nothing else has to listen to the pointer.
export const pointer = { x: -9999, y: -9999, on: false, clickAt: 0, downX: 0, downY: 0, touch: false };

let started = false;
export function startPointer() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; pointer.touch = e.pointerType === "touch"; }, { passive: true });
  window.addEventListener("pointerdown", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.downX = e.clientX; pointer.downY = e.clientY; pointer.clickAt = performance.now(); pointer.on = e.pointerType !== "touch"; }, { passive: true });
  window.addEventListener("pointerup", (e) => { if (e.pointerType === "touch") pointer.on = false; }, { passive: true });
  document.addEventListener("pointerleave", () => { pointer.on = false; });
  window.addEventListener("blur", () => { pointer.on = false; });
}
