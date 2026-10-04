import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterHeading, chapterRange, levels, searchCards } from '../iceberg.ts';
import { applyManualCamera, boardNotes, BOARD_H, BOARD_W, CARD_W, CARD_H, fitCamera, intersects, manualFromCamera, projectNote, threads, viewBounds, visibleNotes, visibleWorld } from '../board-layout.ts';
import { createFlight, sameCamera, sampleFlight } from '../camera-flight.ts';

const viewport = { width: 1192, height: 717 };
const fit = (index, view = 'card') => fitCamera(viewBounds(view, index), viewport);
const close = (a, b, tolerance = 0.00001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

const headings = [
  'Пролог — МАТЧ БЕЗ ТЕБЕ',
  '1. Будь ласка, грайте правильно',
  '2. Виходимо з гри',
  '3. Усе під контролем',
  '4. Тепер залишилося перемогти',
  '5. Будь ласка, не панікуйте',
  '6. Тепер можна без плану',
];

test('all seven chapter headings and ranges match the revised plan exactly', () => {
  assert.deepEqual(levels.map((chapter) => chapterHeading(chapter.id)), headings);
  assert.deepEqual(levels.map((chapter) => chapterRange(chapter.id)), ['01', '02–09', '10–17', '18–31', '32–42', '43–53', '54–58']);
  for (const chapter of levels) assert.deepEqual(searchCards(chapter.heading).map((card) => card.id), chapter.cards.map((card) => card.id));
  assert.equal(searchCards('рівень 5').length, 11, 'old level terminology remains searchable');
});

test('the single-board layout is spatially varied, broadly scattered and deterministic', async () => {
  assert.ok(Math.abs(BOARD_W / BOARD_H - 4 / 3) < 0.001, 'the world matches the single framed board artwork');
  assert.ok(CARD_W < 300 && CARD_H < 220, 'paper notes are smaller while remaining readable');
  assert.ok(Math.min(...boardNotes.map((note) => note.x)) < 600);
  assert.ok(Math.max(...boardNotes.map((note) => note.x)) > BOARD_W - 600);
  assert.ok(Math.min(...boardNotes.map((note) => note.y)) < 600);
  assert.ok(Math.max(...boardNotes.map((note) => note.y)) > BOARD_H - 600);
  assert.ok(new Set(boardNotes.map((note) => note.x)).size > 50);
  assert.ok(new Set(boardNotes.map((note) => note.y)).size > 50);
  assert.ok(boardNotes.some((note) => note.rotation > 5));
  assert.ok(boardNotes.some((note) => note.rotation < -5));
  const reload = await import('../board-layout.ts?determinism-test');
  assert.deepEqual(reload.boardNotes, boardNotes);
});

test('focused views cull offscreen papers without losing the selected one', () => {
  for (let index = 0; index < boardNotes.length; index++) {
    const visible = visibleNotes(fit(index), viewport);
    assert.ok(visible.some((note) => note.id === index + 1));
    assert.ok(visible.length <= 12, `Focus ${index + 1} rendered ${visible.length} papers`);
  }
  assert.equal(visibleNotes(fit(0, 'all'), viewport).length, 58);
  assert.equal(visibleNotes({ x: 100000, y: 100000, scale: 1 }, viewport).length, 0);
});

test('thread culling retains every connector with an onscreen endpoint', () => {
  for (let index = 0; index < boardNotes.length; index++) {
    const bounds = visibleWorld(fit(index), viewport);
    const visible = threads.filter((thread) => intersects(thread.bounds, bounds));
    if (index > 0) assert.ok(visible.some((thread) => thread.to === index + 1));
    if (index < 57) assert.ok(visible.some((thread) => thread.from === index + 1));
  }
});

test('paper projection produces native-size, device-pixel-aligned rectangles at every zoom', () => {
  for (const scale of [0.1, 0.36, 0.82, 1.65, 2.8]) for (const dpr of [1, 1.25, 2, 3]) {
    const note = boardNotes[43];
    const camera = { x: -420.37, y: -637.82, scale };
    const projected = projectNote(note, camera, dpr);
    for (const value of Object.values(projected)) close(value * dpr, Math.round(value * dpr));
    assert.ok(Math.abs(projected.width - CARD_W * scale) <= 0.5 / dpr + 0.00001);
    assert.ok(Math.abs(projected.height - CARD_H * scale) <= 0.5 / dpr + 0.00001);
    close(projected.x, Math.round((camera.x + (note.x - CARD_W / 2) * scale) * dpr) / dpr);
  }
});

test('flights begin and finish exactly at the requested cameras, with bounded durations', () => {
  for (const [from, to] of [[0, 1], [1, 2], [8, 9], [17, 43], [57, 0]]) {
    const flight = createFlight(fit(from), fit(to), viewport);
    assert.deepEqual(sampleFlight(flight, 0), fit(from));
    assert.deepEqual(sampleFlight(flight, 1), fit(to));
    assert.deepEqual(sampleFlight(flight, -1), fit(from));
    assert.deepEqual(sampleFlight(flight, 3), fit(to));
    assert.ok(flight.duration >= 750 && flight.duration <= 1450);
    assert.ok(sampleFlight(flight, 0.45).scale < Math.min(flight.from.scale, flight.to.scale));
  }
});

test('pull-back, travel and approach are continuous and never overshoot the destination', () => {
  const flight = createFlight(fit(0), fit(57), viewport);
  let previousPan = -1;
  const dx = flight.toCenter.x - flight.fromCenter.x;
  const dy = flight.toCenter.y - flight.fromCenter.y;
  for (let i = 0; i <= 100; i++) {
    const camera = sampleFlight(flight, i / 100);
    assert.ok(Number.isFinite(camera.x) && Number.isFinite(camera.y) && camera.scale > 0);
    const cx = (viewport.width / 2 - camera.x) / camera.scale;
    const cy = (viewport.height / 2 - camera.y) / camera.scale;
    const pan = ((cx - flight.fromCenter.x) * dx + (cy - flight.fromCenter.y) * dy) / (dx * dx + dy * dy);
    assert.ok(pan >= previousPan - 0.000001 && pan <= 1.000001);
    previousPan = pan;
  }
  const panAt = (progress) => {
    const camera = sampleFlight(flight, progress);
    const cx = (viewport.width / 2 - camera.x) / camera.scale;
    const cy = (viewport.height / 2 - camera.y) / camera.scale;
    return ((cx - flight.fromCenter.x) * dx + (cy - flight.fromCenter.y) * dy) / (dx * dx + dy * dy);
  };
  const earlyPan = panAt(0.15);
  assert.ok(earlyPan > 0.045 && earlyPan < 0.15, 'the camera starts moving during pull-back, but eases in');
  close(panAt(0.5), 0.5, 0.00001);
  assert.ok(panAt(0.85) > 0.85, 'the camera eases out before stopping');
  for (const boundary of [0.24, 0.62]) {
    const before = sampleFlight(flight, boundary - 0.000001);
    const after = sampleFlight(flight, boundary + 0.000001);
    close(before.x, after.x, 0.1); close(before.y, after.y, 0.1); close(before.scale, after.scale, 0.001);
  }
});

test('retargeting a running flight starts from its current frame, not its old destination', () => {
  const first = createFlight(fit(0), fit(57), viewport);
  const current = sampleFlight(first, 0.42);
  const second = createFlight(current, fit(19), viewport);
  assert.deepEqual(sampleFlight(second, 0), current);
  assert.deepEqual(sampleFlight(second, 1), fit(19));
  assert.equal(sameCamera(current, fit(57)), false);
  assert.equal(sameCamera(fit(19), fit(19)), true);
});

test('manual hand-off during a flight preserves the exact displayed camera', () => {
  const target = fit(43);
  const flight = createFlight(fit(0), target, viewport);
  for (const progress of [0, 0.17, 0.45, 0.87, 1]) {
    const current = sampleFlight(flight, progress);
    const handoff = applyManualCamera(target, manualFromCamera(target, current, viewport), viewport);
    close(handoff.x, current.x); close(handoff.y, current.y); close(handoff.scale, current.scale);
  }
});

test('framing a chapter or the whole board uses a direct, smooth zoom', () => {
  const flight = createFlight(fit(0), fit(0, 'all'), viewport, 'frame');
  assert.equal(flight.duration, 600);
  let previous = flight.from.scale;
  for (let i = 0; i <= 100; i++) {
    const camera = sampleFlight(flight, i / 100);
    assert.ok(camera.scale <= previous + 0.00001 && camera.scale >= flight.to.scale - 0.00001);
    previous = camera.scale;
  }
});