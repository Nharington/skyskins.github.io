import { useEffect, useMemo, useRef, useState } from 'react';

type Vec3 = { x: number; y: number; z: number };
type Vec2 = { x: number; y: number };

interface SkinHeadThumbProps {
  frames: string[];
  ticks?: number;
  play?: boolean;
  background?: boolean;
  yawDeg?: number;
  pitchDeg?: number;
  className?: string;
}

const imageCache = new Map<string, HTMLImageElement>();
function loadImage(url: string) {
  const cached = imageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);

  const img = cached ?? new Image();
  img.decoding = 'async';
  img.crossOrigin = 'anonymous';
  img.src = url;
  imageCache.set(url, img);

  if (img.complete && img.naturalWidth > 0) return Promise.resolve(img);

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const onLoad = () => resolve(img);
    const onError = () => reject(new Error(`Failed to load image: ${url}`));
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
  });
}

function setPixelated(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
}

function rotX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}
function rotY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}
function project(v: Vec3): Vec2 {
  // Canvas Y grows downward; invert so +Y renders upward.
  return { x: v.x, y: -v.y };
}

type FaceKey = 'front' | 'right' | 'top';

function getHeadRegion(face: FaceKey, texW: number, texH: number, outer: boolean) {
  const scaleX = texW / 64;
  const scaleY = texH / 64;
  const ox = outer ? 32 : 0;
  const oy = 0;
  if (face === 'front') return { x: (ox + 8) * scaleX, y: (oy + 8) * scaleY, w: 8 * scaleX, h: 8 * scaleY };
  if (face === 'right') return { x: (ox + 16) * scaleX, y: (oy + 8) * scaleY, w: 8 * scaleX, h: 8 * scaleY };
  return { x: (ox + 8) * scaleX, y: (oy + 0) * scaleY, w: 8 * scaleX, h: 8 * scaleY };
}

function drawFaceMapped(
  ctx: CanvasRenderingContext2D,
  patch: HTMLCanvasElement,
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  shade: number,
) {
  const s = patch.width;
  const a = (p1.x - p0.x) / s;
  const b = (p1.y - p0.y) / s;
  const c = (p2.x - p0.x) / s;
  const d = (p2.y - p0.y) / s;
  ctx.save();
  // Important: compose with the existing devicePixelRatio transform
  // (set in the render loop) so thumbnails scale/center correctly.
  ctx.translate(p0.x, p0.y);
  ctx.transform(a, b, c, d, 0, 0);
  ctx.drawImage(patch, 0, 0);
  if (shade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${shade})`;
    ctx.fillRect(0, 0, s, s);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, s, s);
  ctx.restore();
}

function buildFaceGeometry(half: number) {
  const h = half;
  return {
    front: {
      tl: { x: -h, y: h, z: h },
      tr: { x: h, y: h, z: h },
      bl: { x: -h, y: -h, z: h },
    },
    right: {
      tl: { x: h, y: h, z: h },
      tr: { x: h, y: h, z: -h },
      bl: { x: h, y: -h, z: h },
    },
    top: {
      tl: { x: -h, y: h, z: -h },
      tr: { x: h, y: h, z: -h },
      bl: { x: -h, y: h, z: h },
    },
  } as const;
}

function drawSkullLikeThumb(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  size: number,
  background: boolean,
  yawDeg: number,
  pitchDeg: number,
) {
  const w = size;
  const h = size;

  ctx.clearRect(0, 0, w, h);

  if (background) {
    // Optional background vignette (disabled for grid cards).
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.5, w * 0.72);
    grad.addColorStop(0, 'rgba(255,255,255,0.06)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Match viewer readout semantics:
  // - pitch: positive = camera above horizon (look down a bit)
  // - yaw: viewer's positive azimuth rotates camera around Y; to match viewpoint we rotate model by -yaw.
  const rx = (pitchDeg * Math.PI) / 180;
  const ry = (-yawDeg * Math.PI) / 180;

  const patchSize = 64;
  const patch = document.createElement('canvas');
  patch.width = patchSize;
  patch.height = patchSize;
  const pctx = patch.getContext('2d');
  if (!pctx) return;
  setPixelated(pctx);

  const drawPatch = (face: FaceKey, outer: boolean, targetCanvas: HTMLCanvasElement) => {
    const tW = img.naturalWidth || 64;
    const tH = img.naturalHeight || 64;
    const r = getHeadRegion(face, tW, tH, outer);
    const c2 = targetCanvas.getContext('2d');
    if (!c2) return;
    setPixelated(c2);
    c2.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    c2.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, targetCanvas.width, targetCanvas.height);
  };

  const outerScale = 1.06;
  const patchOuter = document.createElement('canvas');
  patchOuter.width = Math.round(patchSize * outerScale);
  patchOuter.height = Math.round(patchSize * outerScale);

  // Compute projected cube bounds so we can center/scale it in the square.
  const verts: Vec3[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) verts.push({ x: 0.5 * sx, y: 0.5 * sy, z: 0.5 * sz });
  const proj = verts.map((v) => project(rotY(rotX(v, rx), ry)));
  const minX = Math.min(...proj.map((p) => p.x));
  const maxX = Math.max(...proj.map((p) => p.x));
  const minY = Math.min(...proj.map((p) => p.y));
  const maxY = Math.max(...proj.map((p) => p.y));
  const bbW = maxX - minX;
  const bbH = maxY - minY;
  const pad = Math.max(10, Math.round(size * 0.12));
  const scale = Math.min((w - pad * 2) / bbW, (h - pad * 2) / bbH);
  const tx = w / 2 - ((minX + maxX) / 2) * scale;
  const ty = h / 2 - ((minY + maxY) / 2) * scale;

  const toPx = (v: Vec3): Vec2 => {
    const p = project(rotY(rotX(v, rx), ry));
    return { x: p.x * scale + tx, y: p.y * scale + ty };
  };

  const geomInner = buildFaceGeometry(0.5);
  const geomOuter = buildFaceGeometry(0.5 * outerScale);

  // Draw inner faces (top -> right -> front).
  drawPatch('top', false, patch);
  drawFaceMapped(ctx, patch, toPx(geomInner.top.tl), toPx(geomInner.top.tr), toPx(geomInner.top.bl), 0.10);
  drawPatch('right', false, patch);
  drawFaceMapped(ctx, patch, toPx(geomInner.right.tl), toPx(geomInner.right.tr), toPx(geomInner.right.bl), 0.22);
  drawPatch('front', false, patch);
  drawFaceMapped(ctx, patch, toPx(geomInner.front.tl), toPx(geomInner.front.tr), toPx(geomInner.front.bl), 0.06);

  // Draw outer hat layer.
  drawPatch('top', true, patchOuter);
  drawFaceMapped(ctx, patchOuter, toPx(geomOuter.top.tl), toPx(geomOuter.top.tr), toPx(geomOuter.top.bl), 0.08);
  drawPatch('right', true, patchOuter);
  drawFaceMapped(ctx, patchOuter, toPx(geomOuter.right.tl), toPx(geomOuter.right.tr), toPx(geomOuter.right.bl), 0.18);
  drawPatch('front', true, patchOuter);
  drawFaceMapped(ctx, patchOuter, toPx(geomOuter.front.tl), toPx(geomOuter.front.tr), toPx(geomOuter.front.bl), 0.05);
}

export function SkinHeadThumb({
  frames,
  ticks = 2,
  play = false,
  background = false,
  yawDeg = 45,
  pitchDeg = 30,
  className,
}: SkinHeadThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const frameDuration = useMemo(() => (ticks * 50) / 1000, [ticks]);
  const urls = useMemo(() => (frames && frames.length > 0 ? frames : []), [frames]);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = Math.max(0, Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height)));
      setSize(next);
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !size || urls.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setPixelated(ctx);

    let frameIdx = 0;
    timeRef.current = 0;

    const renderFrame = async (idx: number) => {
      try {
        const img = await loadImage(urls[idx] ?? urls[0]);
        if (cancelled) return;
        drawSkullLikeThumb(ctx, img, size, background, yawDeg, pitchDeg);
      } catch {
        if (cancelled) return;
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, 0, size, size);
      }
    };

    let lastT: number | null = null;
    const stop = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastT = null;
    };

    const loop = (t: number) => {
      const dt = lastT != null ? (t - lastT) / 1000 : 0;
      lastT = t;
      timeRef.current += dt;
      if (timeRef.current >= frameDuration) {
        timeRef.current = 0;
        frameIdx = (frameIdx + 1) % urls.length;
        void renderFrame(frameIdx);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    void renderFrame(0);
    stop();
    if (play && urls.length > 1) {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [background, dpr, frameDuration, pitchDeg, play, size, urls, yawDeg]);

  return (
    <div ref={hostRef} className={className}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />
    </div>
  );
}

