// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// Thin matter-js layer: DOM elements become bodies, pointer drag is handled here so that
// touch input is only captured when it starts on a body (the page keeps scrolling otherwise).

const STEP = 1000 / 60;

export function createArena(root, opts = {}, Matter) {
  const { Engine, Bodies, Body, Composite, Constraint, Vector } = Matter;

  const engine = Engine.create({ positionIterations: 8, velocityIterations: 6 });
  engine.gravity.x = opts.gravityX ?? 0;
  engine.gravity.y = opts.gravityY ?? 1;
  const world = engine.world;
  const entries = new Map();
  const ticks = new Set();
  const size = { w: root.clientWidth, h: root.clientHeight };
  const T = 400; // wall thickness
  const statics = [];
  let ceiling = null;

  const wall = (x, y, w, h) => {
    const b = Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.6, restitution: 0.2 });
    statics.push(b);
    Composite.add(world, b);
    return b;
  };

  // floor and side walls; floorY lets the caller place the floor under the last row of letters
  const floorY = opts.floorY ?? size.h;
  wall(size.w / 2, floorY + T / 2, size.w + T * 2, T);
  wall(-T / 2, size.h / 2 - 500, T, size.h + 1400);
  wall(size.w + T / 2, size.h / 2 - 500, T, size.h + 1400);
  (opts.shelves || []).forEach((s) => wall(s.x + s.w / 2, s.y + 12, s.w, 24));
  if (opts.ceiling) ceiling = wall(size.w / 2, -T / 2, size.w + T * 2, T);

  const arena = {
    Matter, engine, world, entries, size, visible: true, lastTouch: performance.now(), drag: null,
    addCeiling() {
      if (!ceiling) ceiling = wall(size.w / 2, -T / 2, size.w + T * 2, T);
    },
    onTick(fn) { ticks.add(fn); return () => ticks.delete(fn); },
    local(e) {
      const r = root.getBoundingClientRect();
      // divide out any scale applied by the stacked-panel transform
      return { x: ((e.clientX - r.left) * root.clientWidth) / (r.width || 1), y: ((e.clientY - r.top) * root.clientHeight) / (r.height || 1) };
    },
    add(el, { x, y, w, h, angle = 0, radius = 0, body: bodyOpts = {}, home }) {
      const body = Bodies.rectangle(x, y, w, h, {
        chamfer: radius ? { radius: Math.min(radius, h / 2 - 0.5, w / 2 - 0.5) } : undefined,
        angle, restitution: 0.3, friction: 0.35, frictionAir: 0.012, density: 0.002, slop: 0.05,
        ...bodyOpts,
      });
      const entry = { el, body, w, h, home: home || { x, y, angle: 0 }, last: "" };
      entries.set(el, entry);
      Composite.add(world, body);
      write(entry);
      return entry;
    },
    remove(entry) {
      Composite.remove(world, entry.body);
      entries.delete(entry.el);
    },
    /** Glide every body back to its home pose (ghosting through the others), then resume normal physics. */
    returnHome(ms = 800) {
      arena.lastTouch = performance.now();
      const from = [...entries.values()].map((en) => ({
        en, x: en.body.position.x, y: en.body.position.y, a: en.body.angle, mask: en.body.collisionFilter.mask,
      }));
      from.forEach((f) => { f.en.body.collisionFilter.mask = 0; });
      let t = 0;
      homing = (dt) => {
        t = Math.min(1, t + dt / ms);
        const k = 1 - Math.pow(1 - t, 3);
        from.forEach((f) => {
          const h = f.en.home;
          const da = ((h.angle - f.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          Body.setPosition(f.en.body, { x: f.x + (h.x - f.x) * k, y: f.y + (h.y - f.y) * k });
          Body.setAngle(f.en.body, f.a + da * k);
          Body.setVelocity(f.en.body, { x: 0, y: 0 });
          Body.setAngularVelocity(f.en.body, 0);
        });
        if (t >= 1) { from.forEach((f) => { f.en.body.collisionFilter.mask = f.mask; }); homing = null; }
      };
    },
    /** Largest distance (px) any body is from its home pose; used to decide if a reset is needed. */
    isHoming() { return !!homing; },
    displacement() {
      let m = 0;
      entries.forEach((en) => {
        m = Math.max(m, Math.hypot(en.body.position.x - en.home.x, en.body.position.y - en.home.y), Math.abs(en.body.angle - en.home.angle) * 40);
      });
      return m;
    },
    destroy() {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", sync);
      io.disconnect();
      root.removeEventListener("dragstart", noDrag);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      root.removeEventListener("click", swallowClick, true);
      Composite.clear(world, false);
      Engine.clear(engine);
      entries.forEach((en) => { en.el.style.transform = ""; en.el.classList.remove("grab"); });
      entries.clear();
    },
  };

  function write(en) {
    const { x, y } = en.body.position;
    const s = `translate3d(${(x - en.w / 2).toFixed(2)}px,${(y - en.h / 2).toFixed(2)}px,0) rotate(${en.body.angle.toFixed(4)}rad)`;
    if (s !== en.last) { en.el.style.transform = s; en.last = s; }
  }

  // ---- pointer drag ----
  let homing = null;
  let moved = 0;
  let suppress = false;
  function down(e) {
    if (e.button > 0 || arena.drag) return;
    const el = e.target.closest("[data-body]");
    const en = el && entries.get(el);
    if (!en) return;
    // touch on a note only grabs from its grip, so the rest of the note scrolls the page
    if (e.pointerType === "touch" && el.hasAttribute("data-gripped") && !e.target.closest("[data-grip]")) return;
    const p = arena.local(e);
    const off = Vector.rotate(Vector.sub(p, en.body.position), -en.body.angle);
    const c = Constraint.create({
      pointA: p, bodyB: en.body, pointB: off, stiffness: opts.dragStiffness ?? 0.2, damping: 0.12, length: 0,
    });
    Composite.add(world, c);
    arena.drag = { id: e.pointerId, en, c, sx: e.clientX, sy: e.clientY };
    moved = 0;
    el.classList.add("grab");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    arena.lastTouch = performance.now();
    opts.onGrab?.(en);
  }
  let px = 0, py = 0, pt = 0;
  function push(e) {
    const hp = opts.hoverPush;
    const p = arena.local(e);
    const sp = Math.hypot(p.x - px, p.y - py);
    const dt = Math.max(8, e.timeStamp - pt);
    px = p.x; py = p.y; pt = e.timeStamp;
    if (!hp || e.pointerType !== "mouse" || sp > 200) return;
    const speed = Math.min(1, (sp / dt) / 1.6);
    entries.forEach((en) => {
      const b = en.body;
      const dx = b.position.x - p.x, dy = b.position.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > hp.radius || d < 1) return;
      const k = hp.strength * (1 - d / hp.radius) * speed;
      Body.setVelocity(b, { x: b.velocity.x + (dx / d) * k, y: b.velocity.y + (dy / d) * k });
      Body.setAngularVelocity(b, b.angularVelocity + (dx > 0 ? 1 : -1) * k * 0.01);
    });
  }
  function move(e) {
    const d = arena.drag;
    if (!d) { push(e); return; }
    if (d.id !== e.pointerId) return;
    d.c.pointA = arena.local(e);
    moved = Math.max(moved, Math.hypot(e.clientX - d.sx, e.clientY - d.sy));
    arena.lastTouch = performance.now();
  }
  function up(e) {
    const d = arena.drag;
    if (!d || d.id !== e.pointerId) return;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    Composite.remove(world, d.c);
    d.en.el.classList.remove("grab");
    const v = d.en.body.velocity;
    const sp = Math.hypot(v.x, v.y), max = 38;
    if (sp > max) Body.setVelocity(d.en.body, { x: (v.x / sp) * max, y: (v.y / sp) * max });
    if (moved > 5) suppress = true;
    arena.drag = null;
    arena.lastTouch = performance.now();
    setTimeout(() => { suppress = false; }, 0);
    opts.onRelease?.(d.en);
  }
  // a drag that ends on a link must not follow it
  function swallowClick(e) {
    if (suppress && e.target.closest("[data-body]")) { e.preventDefault(); e.stopPropagation(); }
  }
  const noDrag = (e) => e.preventDefault();
  root.addEventListener("dragstart", noDrag);
  root.addEventListener("pointerdown", down);
  root.addEventListener("pointermove", move);
  root.addEventListener("click", swallowClick, true);

  // ---- loop; paused offscreen and in hidden tabs ----
  const panel = root.closest("[data-panel]");
  let nextJig = 0, raf = 0, last = 0, acc = 0, running = false, inView = true;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (panel && panel.dataset.covered === "1") { last = t; return; }
    acc += Math.min(50, t - last);
    last = t;
    let n = 0;
    while (acc >= STEP && n < 4) {
      ticks.forEach((f) => f(STEP, t));
      if (homing) homing(STEP);
      if (opts.jiggle && t > nextJig) {
        const j = opts.jiggle;
        nextJig = t + j.min + Math.random() * (j.max - j.min);
        if (performance.now() - arena.lastTouch > 1500 && !homing) {
          const rest = [...entries.values()].filter((en) => en !== arena.drag?.en && Math.hypot(en.body.velocity.x, en.body.velocity.y) < 0.6);
          const en = rest[Math.floor(Math.random() * rest.length)];
          if (en) {
            Body.setVelocity(en.body, { x: (Math.random() - 0.5) * j.vx, y: -(j.vy * (0.6 + Math.random() * 0.6)) });
            Body.setAngularVelocity(en.body, (Math.random() - 0.5) * j.spin);
          }
        }
      }
      Engine.update(engine, STEP);
      acc -= STEP; n++;
    }
    if (n === 4) acc = 0;
    entries.forEach(write);
  }
  function sync() {
    const should = inView && !document.hidden;
    arena.visible = should;
    if (should && !running) { running = true; last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { rootMargin: "80px" });
  io.observe(root);
  document.addEventListener("visibilitychange", sync);
  arena.isRunning = () => running;
  sync();
  return arena;
}
