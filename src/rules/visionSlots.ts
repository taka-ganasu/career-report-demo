import type {
  VisionScoreBreakdown,
  SlotSelection
} from '../types/index.js';

export interface SlotSelectionResult {
  slot1: SlotSelection;
  slot2: SlotSelection;
  slot3: SlotSelection;
}

const SLOT_CONCEPTS = {
  slot1: '経歴重視',
  slot2: '資質重視',
  slot3: '意志重視'
} as const;

/**
 * スロット別傾斜を適用して上位3つを選定（重複排除あり）
 * - 全体でソートし、除外対象があれば繰り上げて選定
 * - top5は除外前の全体ランキング
 * - excluded_vision_idsは実際に除外が発動したもののみ
 */
export function selectTop3BySlots(
  breakdowns: VisionScoreBreakdown[]
): SlotSelectionResult {
  const usedVisionIds: number[] = [];

  // スロット1: 経歴重視
  const slot1Sorted = [...breakdowns].sort(
    (a, b) => b.slot_totals.slot1 - a.slot_totals.slot1
  );
  const slot1Top5 = slot1Sorted.slice(0, 5).map(b => ({
    vision_id: b.vision_id,
    score: b.slot_totals.slot1
  }));
  const slot1Picked = slot1Sorted[0];
  usedVisionIds.push(slot1Picked.vision_id);

  // スロット2: 資質重視
  // 全体でソートし、除外対象は繰り上げ
  const slot2Sorted = [...breakdowns].sort(
    (a, b) => b.slot_totals.slot2 - a.slot_totals.slot2
  );
  const slot2Top5 = slot2Sorted.slice(0, 5).map(b => ({
    vision_id: b.vision_id,
    score: b.slot_totals.slot2
  }));
  // 除外対象を飛ばして最初の未使用を選定
  const slot2Excluded: number[] = [];
  let slot2Picked: VisionScoreBreakdown | undefined;
  for (const b of slot2Sorted) {
    if (usedVisionIds.includes(b.vision_id)) {
      slot2Excluded.push(b.vision_id);
    } else {
      slot2Picked = b;
      break;
    }
  }
  if (!slot2Picked) {
    throw new Error('slot2: No available vision');
  }
  usedVisionIds.push(slot2Picked.vision_id);

  // スロット3: 意志重視
  // 全体でソートし、除外対象は繰り上げ
  const slot3Sorted = [...breakdowns].sort(
    (a, b) => b.slot_totals.slot3 - a.slot_totals.slot3
  );
  const slot3Top5 = slot3Sorted.slice(0, 5).map(b => ({
    vision_id: b.vision_id,
    score: b.slot_totals.slot3
  }));
  // 除外対象を飛ばして最初の未使用を選定
  const slot3Excluded: number[] = [];
  let slot3Picked: VisionScoreBreakdown | undefined;
  for (const b of slot3Sorted) {
    if (usedVisionIds.includes(b.vision_id)) {
      slot3Excluded.push(b.vision_id);
    } else {
      slot3Picked = b;
      break;
    }
  }
  if (!slot3Picked) {
    throw new Error('slot3: No available vision');
  }

  return {
    slot1: {
      concept: SLOT_CONCEPTS.slot1,
      picked_vision_id: slot1Picked.vision_id,
      picked_score: slot1Picked.slot_totals.slot1,
      excluded_vision_ids: [],
      top5: slot1Top5
    },
    slot2: {
      concept: SLOT_CONCEPTS.slot2,
      picked_vision_id: slot2Picked.vision_id,
      picked_score: slot2Picked.slot_totals.slot2,
      excluded_vision_ids: slot2Excluded,
      top5: slot2Top5
    },
    slot3: {
      concept: SLOT_CONCEPTS.slot3,
      picked_vision_id: slot3Picked.vision_id,
      picked_score: slot3Picked.slot_totals.slot3,
      excluded_vision_ids: slot3Excluded,
      top5: slot3Top5
    }
  };
}
