import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacentIndex, cards, levels, numberLabel, planCsv, searchCards } from '../iceberg.ts';
import { applyManualCamera, boardLevels, boardNotes, BOARD_H, BOARD_W, CARD_H, CARD_W, fitCamera, REST_CAMERA, threads, viewBounds, zoomCamera } from '../board-layout.ts';

const closeTo = (actual, expected, epsilon = 0.00001) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} should equal ${expected}`);

function rotatedBounds(note) {
  const angle = note.rotation * Math.PI / 180;
  const points = [-CARD_W / 2, CARD_W / 2].flatMap((x) => [0, CARD_H].map((y) => ({
    x: note.x + x * Math.cos(angle) - y * Math.sin(angle),
    y: note.y + x * Math.sin(angle) + y * Math.cos(angle),
  })));
  return {
    left: Math.min(...points.map((point) => point.x)),
    right: Math.max(...points.map((point) => point.x)),
    top: Math.min(note.y - 14, ...points.map((point) => point.y)),
    bottom: Math.max(...points.map((point) => point.y)),
  };
}

function parseCsv(text) {
  const result = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (character === '\n' && !quoted) { row.push(cell); result.push(row); row = []; cell = ''; }
    else if (character !== '\r' || quoted) cell += character;
  }
  row.push(cell);
  result.push(row);
  return result;
}

test('all 58 cards retain six non-empty fields and the exact video sequence', () => {
  assert.equal(cards.length, 58);
  assert.deepEqual(cards.map((card) => card.id), Array.from({ length: 58 }, (_, i) => i + 1));
  for (const card of cards) {
    assert.deepEqual(Object.keys(card).sort(), ['alternateTitle', 'id', 'level', 'name', 'narration', 'title']);
    for (const field of ['name', 'title', 'narration', 'alternateTitle']) {
      assert.equal(typeof card[field], 'string');
      assert.ok(card[field].trim().length > 0, `Card ${card.id}: ${field}`);
    }
  }
});

test('prologue and six levels have the supplied counts and boundaries', () => {
  assert.deepEqual(levels.map((level) => level.id), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(levels.map((level) => level.cards.length), [1, 8, 8, 14, 11, 11, 5]);
  assert.deepEqual(levels.map((level) => [level.first, level.last]), [[1, 1], [2, 9], [10, 17], [18, 31], [32, 42], [43, 53], [54, 58]]);
  assert.deepEqual(levels.flatMap((level) => level.cards), cards);
});

test('photo titles, alternate wording and pronunciation are separate, unmodified fields', () => {
  assert.deepEqual(cards[0], { id: 1, level: 0, name: 'Падіння зі спавну', title: 'МАТЧ БЕЗ ТЕБЕ', narration: 'Матч без тебе.', alternateTitle: 'ПАДІННЯ ЗАМІСТЬ ПОЯВИ' });
  assert.equal(cards[27].title, 'КРАСИВО ≠ КОРИСНО');
  assert.equal(cards[27].narration, 'Красиво — не означає корисно.');
  assert.equal(cards[40].narration, 'Севен-ілевен. Лаги в комплекті.');
  assert.equal(cards[42].name, 'Nextbots & Update 1.3.2 (324)');
  assert.equal(cards[43].title, 'КОД: 4445');
  assert.equal(cards[43].narration, 'Код. Чотири. Чотири. Чотири. П’ять.');
  assert.equal(cards[57].title, 'ТОЧКА НУЛЬ: 34');
  assert.equal(cards[57].narration, 'Точка нуль. Тридцять чотири.');
  assert.equal(cards[57].alternateTitle, 'КОРОБКА, З ЯКОЇ ПОЧИНАЛИ');
});

test('search supports photo, original and alternate names, speech, IDs and Ukrainian apostrophes', () => {
  assert.equal(searchCards('').length, 58);
  assert.equal(searchCards('', 5).length, 11);
  for (const query of ['44', '044', '#44', '№ 44', 'КОД: 4445', '4445', 'Кодові двері', 'ЧОТИРИ ЦИФРИ ДО МАГАЗИНУ', 'Код. Чотири.']) {
    assert.deepEqual(searchCards(query).map((card) => card.id), [44], query);
  }
  for (const query of ['Дем’ян', "дем'ян", 'ДЕМЯН', 'демʼян']) {
    assert.deepEqual(searchCards(query).map((card) => card.id), [11], query);
  }
  assert.deepEqual(searchCards('золота ДОБА').map((card) => card.id), [18]);
  assert.deepEqual(searchCards('44', 1), []);
  assert.deepEqual(searchCards('немає такої картки'), []);
});

test('CSV round-trips all six columns, including commas, typography and the prologue', () => {
  const rows = parseCsv(planCsv());
  assert.equal(rows.length, 59);
  assert.deepEqual(rows[0], ['Рівень айсберга', 'Звичайна назва', 'Назва для фото', '№ картки у відео', 'Текст для начитки', 'Запасна назва з попереднього плану']);
  cards.forEach((card, index) => assert.deepEqual(rows[index + 1], [
    card.level === 0 ? 'Пролог' : String(card.level), card.name, card.title, String(card.id), card.narration, card.alternateTitle,
  ]));
});

test('every rotated paper and pin fits its level and the board without overlapping another card', () => {
  assert.equal(boardNotes.length, 58);
  assert.deepEqual(boardNotes.map((note) => note.id), cards.map((card) => card.id));
  const boxes = boardNotes.map(rotatedBounds);
  boardLevels.forEach((level) => {
    assert.ok(level.bounds.x >= 0 && level.bounds.x + level.bounds.width <= BOARD_W);
    assert.ok(level.bounds.y >= 0 && level.bounds.y + level.bounds.height <= BOARD_H);
    for (const note of level.notes) {
      const box = boxes[note.id - 1];
      assert.ok(box.left >= level.bounds.x && box.right <= level.bounds.x + level.bounds.width, `Card ${note.id}: horizontal bounds`);
      assert.ok(box.top >= level.bounds.y && box.bottom <= level.bounds.y + level.bounds.height, `Card ${note.id}: vertical bounds`);
    }
  });
  boxes.forEach((box, i) => boxes.slice(i + 1).forEach((other, j) => {
    assert.ok(box.right <= other.left || box.left >= other.right || box.bottom <= other.top || box.top >= other.bottom, `Cards ${i + 1} and ${i + j + 2} overlap`);
  }));
});

test('the red thread follows video numbers 1 to 58, including level boundaries', () => {
  assert.equal(threads.length, 57);
  threads.forEach((thread, index) => {
    assert.equal(thread.from, index + 1);
    assert.equal(thread.to, index + 2);
    assert.ok(thread.path.startsWith(`M ${boardNotes[index].x} ${boardNotes[index].y} Q `));
    assert.ok(thread.path.endsWith(`${boardNotes[index + 1].x} ${boardNotes[index + 1].y}`));
  });
});

test('card, level and full-board camera fits work on desktop, phone and landscape screens', () => {
  const sizes = [{ width: 1192, height: 717 }, { width: 776, height: 537 }, { width: 390, height: 605 }, { width: 320, height: 329 }, { width: 812, height: 257 }];
  for (const viewport of sizes) for (const view of ['card', 'level', 'all']) for (let index = 0; index < 58; index++) {
    const bounds = viewBounds(view, index);
    const camera = fitCamera(bounds, viewport);
    const left = camera.x + bounds.x * camera.scale;
    const top = camera.y + bounds.y * camera.scale;
    assert.ok(camera.scale > 0 && camera.scale <= 1.65);
    assert.ok(left >= 0 && top >= 0, `${view} ${index}: top/left clipped`);
    assert.ok(left + bounds.width * camera.scale <= viewport.width + 0.001, `${view} ${index}: right clipped`);
    assert.ok(top + bounds.height * camera.scale <= viewport.height + 0.001, `${view} ${index}: bottom clipped`);
  }
});

test('zoom is anchored to the pointer and bounded; resetting restores the fit', () => {
  const viewport = { width: 1000, height: 600 };
  const base = fitCamera(viewBounds('card', 43), viewport);
  const manual = { x: 80, y: -60, zoom: 1.2 };
  const oldCamera = applyManualCamera(base, manual, viewport);
  const point = { x: 190, y: 450 };
  const worldPoint = { x: (point.x - oldCamera.x) / oldCamera.scale, y: (point.y - oldCamera.y) / oldCamera.scale };
  const zoomed = zoomCamera(base, manual, viewport, 1.25, point);
  const newCamera = applyManualCamera(base, zoomed, viewport);
  closeTo(newCamera.x + worldPoint.x * newCamera.scale, point.x);
  closeTo(newCamera.y + worldPoint.y * newCamera.scale, point.y);
  closeTo(zoomCamera(base, manual, viewport, 1000).zoom * base.scale, 2.8);
  closeTo(zoomCamera(base, manual, viewport, 0.00001).zoom * base.scale, 0.025);
  const reset = applyManualCamera(base, REST_CAMERA, viewport);
  closeTo(reset.x, base.x);
  closeTo(reset.y, base.y);
  closeTo(reset.scale, base.scale);
});

test('navigation crosses levels in order and never wraps or escapes the 58-card plan', () => {
  assert.equal(adjacentIndex(0, -1), 0);
  assert.equal(adjacentIndex(57, 1), 57);
  assert.equal(adjacentIndex(8, 1), 9);
  assert.equal(adjacentIndex(52, 1), 53);
  assert.equal(adjacentIndex(57, -1), 56);
  assert.equal(numberLabel(1), '01');
  assert.equal(numberLabel(58), '58');
});