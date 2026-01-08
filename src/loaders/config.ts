import { readFileSync } from 'fs';
import type { Weights, SlotWeights } from '../types/index.js';

/**
 * 重み設定を読み込む
 */
export function loadWeights(configPath: string): Weights {
  const content = readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as Weights;
}

/**
 * スロット別傾斜設定を読み込む
 */
export function loadSlotWeights(configPath: string): SlotWeights {
  const content = readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as SlotWeights;
}
