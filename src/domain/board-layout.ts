import { cards, levels, type IcebergCard, type LevelId } from './iceberg.ts';

export const CARD_W = 286;
export const CARD_H = 210;
export const CARD_SCALE = 0.84;
export const BOARD_W = 6500;
// The source artwork is one 4:3 framed corkboard, so keep the world at the same ratio.
export const BOARD_H = BOARD_W * 0.75;
const ORIGINAL_LAYOUT_H = 4320;
const BOARD_Y_SCALE = BOARD_H / ORIGINAL_LAYOUT_H;

export interface Bounds { x: number; y: number; width: number; height: number }
export interface BoardNote extends IcebergCard { x: number; y: number; rotation: number }
export interface BoardLevel { id: LevelId; bounds: Bounds; notes: readonly BoardNote[] }
export interface Camera { x: number; y: number; scale: number }
export type ViewMode = 'card' | 'level' | 'all';
export interface Viewport { width: number; height: number }
export interface ManualCamera { x: number; y: number; zoom: number }
export const REST_CAMERA: ManualCamera = { x: 0, y: 0, zoom: 1 };

// One framed 4:3 investigation board: the prologue is near the middle, chapters
// wind clockwise around it. Territories guide placement but are not drawn as cells.
const territories: readonly Bounds[] = [
  { x: 2700, y: 1650, width: 1260, height: 640 },
  { x: 180, y: 320, width: 1830, height: 1620 },
  { x: 2250, y: 160, width: 1820, height: 1440 },
  { x: 4340, y: 220, width: 1980, height: 1900 },
  { x: 4360, y: 2340, width: 1990, height: 1720 },
  { x: 2220, y: 2500, width: 1930, height: 1600 },
  { x: 220, y: 2420, width: 1780, height: 1460 },
].map((bounds) => ({
  ...bounds,
  y: Math.round(bounds.y * BOARD_Y_SCALE),
  height: Math.round(bounds.height * BOARD_Y_SCALE),
}));
const rowsByLevel = [[1], [3, 2, 3], [3, 3, 2], [4, 3, 4, 3], [4, 3, 4], [3, 4, 4], [2, 1, 2]];

function random(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const boardLevels: readonly BoardLevel[] = levels.map((level) => {
  const bounds = territories[level.id];
  const rowSizes = rowsByLevel[level.id];
  const maxColumns = Math.max(...rowSizes);
  const nextRandom = random(7301 + level.id * 419);
  const fullSpan = bounds.width - 224 - CARD_W;
  const pitchX = maxColumns > 1 ? fullSpan / (maxColumns - 1) : 0;
  const firstY = bounds.y + 220 + 80;
  const lastY = bounds.y + bounds.height - CARD_H - 80;
  const pitchY = rowSizes.length > 1 ? (lastY - firstY) / (rowSizes.length - 1) : 0;
  let index = 0;
  const notes = rowSizes.flatMap((count, row) => {
    const span = maxColumns > 1 ? pitchX * (count - 1) : 0;
    const rowOffset = (nextRandom() - 0.5) * 42;
    return Array.from({ length: count }, (_, columnIndex) => {
      const card = level.cards[index++];
      const column = row % 2 === 0 ? columnIndex : count - 1 - columnIndex;
      const jitterX = Math.max(0, Math.min(135, (pitchX - CARD_W - 84) / 2));
      const jitterY = Math.max(0, Math.min(130, (pitchY - CARD_H - 70) / 2));
      const edgeRow = row === 0 || row === rowSizes.length - 1;
      return {
        ...card,
        x: Math.round(bounds.x + bounds.width / 2 - span / 2 + column * pitchX + rowOffset + (nextRandom() * 2 - 1) * jitterX),
        y: Math.round((rowSizes.length === 1 ? (firstY + lastY) / 2 : firstY + row * pitchY) + (nextRandom() * 2 - 1) * Math.min(jitterY, edgeRow ? 75 : 130)),
        rotation: Math.round((2.2 + nextRandom() * 6.4) * (card.id % 2 ? -1 : 1) * 10) / 10,
      };
    });
  });
  // Relax the anchors into a broad, stable hand-pinned scatter. Every proposed
  // move is collision-checked, so the extra irregularity never hides text.
  for (let pass = 0; pass < 4; pass++) for (const note of notes) {
    for (let attempt = 0; attempt < 14; attempt++) {
      const candidate = { ...note, x: note.x + Math.round((nextRandom() * 2 - 1) * 190), y: note.y + Math.round((nextRandom() * 2 - 1) * 210) };
      const box = noteBounds(candidate);
      if (box.x < bounds.x + 28 || box.y < bounds.y + 245 || box.x + box.width > bounds.x + bounds.width - 28 || box.y + box.height > bounds.y + bounds.height - 32) continue;
      const clearance = { x: box.x - 27, y: box.y - 27, width: box.width + 54, height: box.height + 54 };
      if (notes.some((other) => other.id !== note.id && intersects(clearance, noteBounds(other)))) continue;
      note.x = candidate.x; note.y = candidate.y;
      break;
    }
  }
  return { id: level.id, bounds, notes };
});

export const boardNotes: readonly BoardNote[] = boardLevels.flatMap((level) => level.notes);

export function noteBounds(note: BoardNote): Bounds {
  const angle = note.rotation * Math.PI / 180;
  const points = [-CARD_W / 2, CARD_W / 2].flatMap((x) => [0, CARD_H].map((y) => ({
    x: note.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: note.y + x * Math.sin(angle) + y * Math.cos(angle),
  })));
  const x = Math.min(...points.map((point) => point.x));
  const y = Math.min(note.y - 16, ...points.map((point) => point.y));
  return { x, y, width: Math.max(...points.map((point) => point.x)) - x, height: Math.max(...points.map((point) => point.y)) - y };
}
const paperBounds = boardNotes.map(noteBounds);

export function intersects(a: Bounds, b: Bounds): boolean {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

export function visibleWorld(camera: Camera, viewport: Viewport, overscan = 100): Bounds {
  return { x: (-camera.x - overscan) / camera.scale, y: (-camera.y - overscan) / camera.scale, width: (viewport.width + overscan * 2) / camera.scale, height: (viewport.height + overscan * 2) / camera.scale };
}

export function visibleNotes(camera: Camera, viewport: Viewport): readonly BoardNote[] {
  const visible = visibleWorld(camera, viewport);
  return boardNotes.filter((note) => intersects(paperBounds[note.id - 1], visible));
}

function controlPoint(a: BoardNote, b: BoardNote) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + Math.min(150, Math.hypot(a.x - b.x, a.y - b.y) * 0.09 + 24) };
}
export function threadPath(a: BoardNote, b: BoardNote): string {
  const control = controlPoint(a, b);
  return `M ${a.x} ${a.y} Q ${control.x} ${control.y} ${b.x} ${b.y}`;
}

export const threads = boardNotes.slice(0, -1).map((note, index) => {
  const next = boardNotes[index + 1];
  const control = controlPoint(note, next);
  const x = Math.min(note.x, next.x, control.x) - 6;
  const y = Math.min(note.y, next.y, control.y) - 6;
  return {
    from: note.id, to: next.id, path: threadPath(note, next),
    bounds: { x, y, width: Math.max(note.x, next.x, control.x) - x + 6, height: Math.max(note.y, next.y, control.y) - y + 6 },
  };
});

export function viewBounds(view: ViewMode, index: number): Bounds {
  const note = boardNotes[Math.max(0, Math.min(index, cards.length - 1))];
  if (view === 'all') return { x: 0, y: 0, width: BOARD_W, height: BOARD_H };
  if (view === 'level') return boardLevels[note.level].bounds;
  return { x: note.x - CARD_W / 2 - 40, y: note.y - 38, width: CARD_W + 80, height: CARD_H + 76 };
}

export function fitCamera(bounds: Bounds, viewport: Viewport, maxScale = 1.65): Camera {
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const padding = Math.min(52, width * 0.065, height * 0.08);
  const scale = Math.max(0.001, Math.min((width - padding * 2) / bounds.width, (height - padding * 2) / bounds.height, maxScale));
  return { scale, x: width / 2 - (bounds.x + bounds.width / 2) * scale, y: height / 2 - (bounds.y + bounds.height / 2) * scale };
}

export function applyManualCamera(base: Camera, manual: ManualCamera, viewport: Viewport): Camera {
  return { scale: base.scale * manual.zoom, x: viewport.width / 2 + (base.x - viewport.width / 2) * manual.zoom + manual.x, y: viewport.height / 2 + (base.y - viewport.height / 2) * manual.zoom + manual.y };
}

export function manualFromCamera(base: Camera, camera: Camera, viewport: Viewport): ManualCamera {
  const zoom = camera.scale / base.scale;
  return { zoom, x: camera.x - (viewport.width / 2 + (base.x - viewport.width / 2) * zoom), y: camera.y - (viewport.height / 2 + (base.y - viewport.height / 2) * zoom) };
}

export function zoomCamera(base: Camera, manual: ManualCamera, viewport: Viewport, factor: number, point = { x: viewport.width / 2, y: viewport.height / 2 }): ManualCamera {
  const scale = Math.max(0.025, Math.min(2.8, base.scale * manual.zoom * factor));
  const zoom = scale / base.scale;
  const ratio = zoom / manual.zoom;
  return { zoom, x: (point.x - viewport.width / 2) * (1 - ratio) + manual.x * ratio, y: (point.y - viewport.height / 2) * (1 - ratio) + manual.y * ratio };
}

export function projectNote(note: BoardNote, camera: Camera, pixelRatio = 1) {
  const snap = (value: number) => Math.round(value * pixelRatio) / pixelRatio;
  return { x: snap(camera.x + (note.x - CARD_W / 2) * camera.scale), y: snap(camera.y + note.y * camera.scale), width: snap(CARD_W * camera.scale), height: snap(CARD_H * camera.scale) };
}