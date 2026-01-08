import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type {
  Axis,
  Weights,
  SlotWeights,
  VisionScoreBreakdown,
  DebugScoresOutput,
  DebugAxisOutput,
  Q5Result,
  DictVision,
  VisionOutput,
  MasterData,
  SlotSelectionWithName
} from '../types/index.js';
import type { SlotSelectionResult } from '../rules/visionSlots.js';

const VERSION = 'v0.1-simple-vision';

/**
 * ファイル出力（ディレクトリがなければ作成）
 */
function writeFile(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * 現在のISO日時を取得
 */
function getIsoDateTime(): string {
  return new Date().toISOString();
}

/**
 * debug.axis.json を出力
 */
export function writeDebugAxis(
  outDir: string,
  userId: string,
  axis: Axis,
  weights: Weights,
  slotWeights: SlotWeights
): void {
  const data: DebugAxisOutput = {
    user_id: userId,
    version: VERSION,
    generated_at: getIsoDateTime(),
    axis,
    config: {
      weights,
      slot_weights: slotWeights
    }
  };
  const filePath = `${outDir}/${userId}.debug.axis.json`;
  writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`[出力] ${filePath}`);
}

/**
 * マスタから名称を解決するヘルパー関数群
 */
function getJobName(masters: MasterData, jobId: number): string {
  return masters.jobs.find(j => j.job_id === jobId)?.job_name || `(不明:${jobId})`;
}

function getIndustryName(masters: MasterData, industryId: number): string {
  return masters.industries.find(i => i.industry_id === industryId)?.industry_name || `(不明:${industryId})`;
}

function getTargetJobName(masters: MasterData, targetJobId: number): string {
  return masters.targetJobs.find(tj => tj.target_job_id === targetJobId)?.target_job_name || `(不明:${targetJobId})`;
}

function getTargetIndustryName(masters: MasterData, targetIndustryId: number): string {
  return masters.targetIndustries.find(ti => ti.target_industry_id === targetIndustryId)?.target_industry_name || `(不明:${targetIndustryId})`;
}

function getStrengthTypeName(masters: MasterData, strengthTypeId: number): string {
  return masters.strengthTypes.find(s => s.strength_type_id === strengthTypeId)?.strength_type_name || `(不明:${strengthTypeId})`;
}

function getQuestionLabel(masters: MasterData, qNo: number, choiceNo: number): string {
  return masters.questions.find(q => q.q_no === qNo && q.choice_no === choiceNo)?.choice_label || `(不明:${choiceNo})`;
}

function getVisionTitle(masters: MasterData, visionId: number): string {
  return masters.visions.find(v => v.vision_id === visionId)?.vision_title || `(不明:${visionId})`;
}

/**
 * SlotSelectionResultに名称情報を追加
 */
function enrichSlotSelection(
  slot: SlotSelectionResult['slot1'],
  masters: MasterData
): SlotSelectionWithName {
  return {
    ...slot,
    picked_vision_title: getVisionTitle(masters, slot.picked_vision_id),
    top5: slot.top5.map(item => ({
      vision_id: item.vision_id,
      vision_title: getVisionTitle(masters, item.vision_id),
      score: item.score
    }))
  };
}

/**
 * debug.scores.json を出力
 */
export function writeDebugScores(
  outDir: string,
  userId: string,
  axis: Axis,
  weights: Weights,
  slotWeights: SlotWeights,
  visionScores: VisionScoreBreakdown[],
  selection: SlotSelectionResult,
  warnings: string[],
  masters: MasterData
): void {
  const data: DebugScoresOutput = {
    user_id: userId,
    version: VERSION,
    generated_at: getIsoDateTime(),
    weights: {
      base: weights.base,
      q_weights: weights.will_q,
      slots: slotWeights
    },
    inputs: {
      career_job_id_longest: axis.career.job_id,
      career_job_name: getJobName(masters, axis.career.job_id),
      career_industry_id_longest: axis.career.industry_id,
      career_industry_name: getIndustryName(masters, axis.career.industry_id),
      personal_job_id_top1: axis.aptitude.target_job_id,
      personal_job_name: getTargetJobName(masters, axis.aptitude.target_job_id),
      personal_industry_id_top1: axis.aptitude.target_industry_id,
      personal_industry_name: getTargetIndustryName(masters, axis.aptitude.target_industry_id),
      personal_role: axis.aptitude.role,
      personal_strength_type_id_top1: axis.aptitude.strength_type_id,
      personal_strength_type_name: getStrengthTypeName(masters, axis.aptitude.strength_type_id),
      q: {
        q1: { choice_no: axis.will.q1, choice_label: getQuestionLabel(masters, 1, axis.will.q1) },
        q2: { choice_no: axis.will.q2, choice_label: getQuestionLabel(masters, 2, axis.will.q2) },
        q3: { choice_no: axis.will.q3, choice_label: getQuestionLabel(masters, 3, axis.will.q3) },
        q4: { choice_no: axis.will.q4, choice_label: getQuestionLabel(masters, 4, axis.will.q4) }
      }
    },
    candidates: {
      vision_scores: visionScores
    },
    selection: {
      slot1: enrichSlotSelection(selection.slot1, masters),
      slot2: enrichSlotSelection(selection.slot2, masters),
      slot3: enrichSlotSelection(selection.slot3, masters)
    },
    warnings
  };
  const filePath = `${outDir}/${userId}.debug.scores.json`;
  writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`[出力] ${filePath}`);
}

/**
 * SlotSelectionResultとDictVisionからQ5Resultを構築
 */
export function buildQ5Result(
  selection: SlotSelectionResult,
  dictVisions: DictVision[]
): Q5Result {
  const buildVisionOutput = (
    visionId: string,
    score: number
  ): VisionOutput => {
    const vision = dictVisions.find(v => v.vision_id === visionId);
    return {
      vision_id: visionId,
      title: vision?.title || '',
      description: vision?.description || '',
      slot_total: score
    };
  };

  return {
    slot1: buildVisionOutput(selection.slot1.picked_vision_id, selection.slot1.picked_score),
    slot2: buildVisionOutput(selection.slot2.picked_vision_id, selection.slot2.picked_score),
    slot3: buildVisionOutput(selection.slot3.picked_vision_id, selection.slot3.picked_score)
  };
}

/**
 * report.json を出力
 */
export function writeReportJson(outDir: string, userId: string, q5: Q5Result): void {
  const filePath = `${outDir}/${userId}.report.json`;
  const report = {
    user_id: userId,
    version: VERSION,
    generated_at: getIsoDateTime(),
    q5_visions: q5
  };
  writeFile(filePath, JSON.stringify(report, null, 2));
  console.log(`[出力] ${filePath}`);
}

/**
 * report.md を出力
 */
export function writeReportMarkdown(outDir: string, userId: string, q5: Q5Result): void {
  const filePath = `${outDir}/${userId}.report.md`;

  const formatVision = (label: string, concept: string, v: VisionOutput): string => {
    return `### ${label}（${concept}）

**${v.title}**

${v.description}

> スコア: ${v.slot_total.toFixed(2)}
`;
  };

  const md = `# キャリアレポート（将来像 Q5）

**ユーザーID**: ${userId}

---

## あなたにおすすめの将来像

${formatVision('1', '経歴重視', q5.slot1)}

${formatVision('2', '資質重視', q5.slot2)}

${formatVision('3', '意志重視', q5.slot3)}

---

*Generated by career-report-demo ${VERSION}*
`;

  writeFile(filePath, md);
  console.log(`[出力] ${filePath}`);
}
