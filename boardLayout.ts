import { CARDS_DATA, CHAPTERS, type CardItem, type ChapterInfo } from './cardsData';

export const CARD_WIDTH = 390;
export const CARD_HEIGHT = 230;
export const GAP_X = 22;
export const GAP_Y = 22;
export const CHAPTER_HEADER_HEIGHT = 120;
export const CHAPTER_PADDING_X = 36;
export const CHAPTER_PADDING_Y = 28;
export const CHAPTER_GAP_Y = 80;

export const BOARD_WIDTH = 2400;
export const BOARD_CENTER_X = BOARD_WIDTH / 2;

export interface ComputedCard extends CardItem {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  col: number;
  row: number;
  pinX: number;
  pinY: number;
}

export interface ComputedChapter extends ChapterInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  cards: ComputedCard[];
}

export interface TimelineSegment {
  fromId: number;
  toId: number;
  d: string;
  isChapterJump: boolean;
}

export function computeBoardLayout() {
  const computedChapters: ComputedChapter[] = [];
  const computedCards: ComputedCard[] = [];
  let currentY = 120;

  // Chapter column layout rules
  const chapterColsMap: Record<number, number> = {
    0: 1, // Prologue (1 card)
    1: 4, // Ch 1 (8 cards -> 4x2)
    2: 4, // Ch 2 (8 cards -> 4x2)
    3: 5, // Ch 3 (14 cards -> 5x3)
    4: 4, // Ch 4 (11 cards -> 4x3)
    5: 4, // Ch 5 (11 cards -> 4x3)
    6: 5, // Ch 6 (5 cards -> 5x1)
  };

  for (const chapter of CHAPTERS) {
    const chapterCardsRaw = CARDS_DATA.filter((c) => c.chapterId === chapter.id);
    const cols = chapterColsMap[chapter.id] || 4;
    const rows = Math.ceil(chapterCardsRaw.length / cols);

    const cardsAreaWidth = cols * CARD_WIDTH + (cols - 1) * GAP_X;
    const chapterWidth = Math.max(cardsAreaWidth + CHAPTER_PADDING_X * 2, 540);
    const chapterHeight =
      CHAPTER_HEADER_HEIGHT +
      CHAPTER_PADDING_Y +
      rows * CARD_HEIGHT +
      Math.max(0, rows - 1) * GAP_Y +
      CHAPTER_PADDING_Y;

    const chapterX = BOARD_CENTER_X - chapterWidth / 2;
    const chapterY = currentY;

    const cardsStartY = chapterY + CHAPTER_HEADER_HEIGHT + CHAPTER_PADDING_Y;

    const currentChapterCards: ComputedCard[] = [];

    chapterCardsRaw.forEach((card, indexInChapter) => {
      const col = indexInChapter % cols;
      const row = Math.floor(indexInChapter / cols);

      // Center cards if the last row is incomplete or for prologue
      let offsetX = CHAPTER_PADDING_X;
      if (chapter.id === 0) {
        offsetX = (chapterWidth - CARD_WIDTH) / 2;
      }

      const cardX = chapterX + offsetX + col * (CARD_WIDTH + GAP_X);
      const cardY = cardsStartY + row * (CARD_HEIGHT + GAP_Y);

      const computedCard: ComputedCard = {
        ...card,
        x: cardX,
        y: cardY,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        centerX: cardX + CARD_WIDTH / 2,
        centerY: cardY + CARD_HEIGHT / 2,
        col,
        row,
        pinX: cardX + CARD_WIDTH / 2,
        pinY: cardY + 12, // top pin position
      };

      currentChapterCards.push(computedCard);
      computedCards.push(computedCard);
    });

    computedChapters.push({
      ...chapter,
      x: chapterX,
      y: chapterY,
      width: chapterWidth,
      height: chapterHeight,
      centerX: chapterX + chapterWidth / 2,
      centerY: chapterY + chapterHeight / 2,
      cards: currentChapterCards,
    });

    currentY += chapterHeight + CHAPTER_GAP_Y;
  }

  const BOARD_HEIGHT = currentY + 120;

  // Build smooth timeline path connecting cards 01 -> 58
  const segments: TimelineSegment[] = [];
  for (let i = 0; i < computedCards.length - 1; i++) {
    const a = computedCards[i];
    const b = computedCards[i + 1];
    const isChapterJump = a.chapterId !== b.chapterId;

    let d = '';
    if (isChapterJump) {
      // Smooth vertical connection between chapters
      const startX = a.centerX;
      const startY = a.y + a.height;
      const endX = b.centerX;
      const endY = b.y;
      const midY = (startY + endY) / 2;
      d = `M ${startX} ${startY} C ${startX} ${midY + 20}, ${endX} ${midY - 20}, ${endX} ${endY}`;
    } else if (a.row === b.row) {
      // Connect right side of card A to left side of card B
      const startX = a.x + a.width;
      const startY = a.centerY;
      const endX = b.x;
      const endY = b.centerY;
      const midX = (startX + endX) / 2;
      d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    } else {
      // Wrap around from end of row to start of next row
      const startX = a.centerX;
      const startY = a.y + a.height;
      const endX = b.centerX;
      const endY = b.y;
      const midY = (startY + endY) / 2;
      d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    }

    segments.push({
      fromId: a.id,
      toId: b.id,
      d,
      isChapterJump,
    });
  }

  return {
    BOARD_WIDTH,
    BOARD_HEIGHT,
    computedChapters,
    computedCards,
    segments,
  };
}
