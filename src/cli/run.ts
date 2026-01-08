import { resolve } from 'path';
import { loadCsvById, loadCsv } from '../loaders/csv.js';
import { loadWeights, loadSlotWeights } from '../loaders/config.js';
import { buildAxisFromInputRow } from '../domain/axis.js';
import { calcAllVisionScores, type RelationTables } from '../rules/visionScore.js';
import { selectTop3BySlots } from '../rules/visionSlots.js';
import {
  writeDebugAxis,
  writeDebugScores,
  writeReportJson,
  writeReportMarkdown,
  buildQ5Result
} from '../render/writeFiles.js';
import { collectInputInteractively } from './interactiveMode.js';
import type {
  InputRow,
  DictVision,
  RelVisionJob,
  RelVisionIndustry,
  RelVisionTargetJob,
  RelVisionTargetIndustry,
  RelVisionRole,
  RelVisionStrengthType,
  RelVisionQ1,
  RelVisionQ2,
  RelVisionQ3,
  RelVisionQ4,
  MasterData,
  MasterJob,
  MasterIndustry,
  MasterTargetJob,
  MasterTargetIndustry,
  MasterStrengthType,
  MasterAdditionalQuestion,
  MasterVision
} from '../types/index.js';

// =========================
// 引数解析
// =========================

interface CliArgs {
  userId: string;
  mode: 'csv' | 'interactive';
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let userId = 'u1';
  let mode: 'csv' | 'interactive' = 'csv';

  for (const arg of args) {
    if (arg.startsWith('--user_id=')) {
      userId = arg.split('=')[1];
    } else if (arg === '--mode=interactive' || arg === '-i') {
      mode = 'interactive';
    } else if (arg === '--mode=csv') {
      mode = 'csv';
    }
  }

  return { userId, mode };
}

// =========================
// メイン処理
// =========================

async function main() {
  const { userId, mode } = parseArgs();
  console.log(`\n[開始] ユーザーID: ${userId} / モード: ${mode}\n`);

  const baseDir = resolve(import.meta.dirname, '../..');
  const dataDir = `${baseDir}/data`;
  const configDir = `${baseDir}/config`;
  const outDir = `${baseDir}/out`;

  const warnings: string[] = [];

  // =========================
  // Step 1: マスタデータ読み込み（両モード共通で先に読む）
  // =========================

  console.log('[Step 1] マスタデータ読み込み...');

  const masterData: MasterData = {
    jobs: loadCsv<MasterJob>(`${dataDir}/master/m_jobs.csv`),
    industries: loadCsv<MasterIndustry>(`${dataDir}/master/m_industries.csv`),
    targetJobs: loadCsv<MasterTargetJob>(`${dataDir}/master/m_target_jobs.csv`),
    targetIndustries: loadCsv<MasterTargetIndustry>(`${dataDir}/master/m_target_industries.csv`),
    strengthTypes: loadCsv<MasterStrengthType>(`${dataDir}/master/m_strength_types.csv`),
    questions: loadCsv<MasterAdditionalQuestion>(`${dataDir}/master/m_additional_questions.csv`),
    visions: loadCsv<MasterVision>(`${dataDir}/master/m_visions.csv`)
  };

  // =========================
  // Step 2: 入力データ取得（モード別）
  // =========================

  let inputRow: InputRow;
  let finalUserId = userId;

  if (mode === 'interactive') {
    console.log('[Step 2] インタラクティブモードで入力収集...');
    const result = await collectInputInteractively(userId, masterData);
    inputRow = result.inputRow;
    finalUserId = result.userId;
  } else {
    console.log('[Step 2] CSVから入力データ読み込み...');
    const loaded = loadCsvById<InputRow>(`${dataDir}/input/input.csv`, userId);
    if (!loaded) {
      console.error(`[エラー] ユーザー ${userId} が見つかりません`);
      process.exit(1);
    }
    inputRow = loaded;
  }

  const axis = buildAxisFromInputRow(inputRow);
  if (axis.warnings.length > 0) {
    console.warn('[警告] 欠損データ:', axis.warnings);
    warnings.push(...axis.warnings);
  }

  // =========================
  // Step 3: 設定ファイル読み込み
  // =========================

  console.log('[Step 3] 設定ファイル読み込み...');

  const weights = loadWeights(`${configDir}/weights.json`);
  const slotWeights = loadSlotWeights(`${configDir}/slot_weights.json`);

  // debug.axis 出力
  writeDebugAxis(outDir, finalUserId, axis, weights, slotWeights);

  // =========================
  // Step 4: 将来像辞書＋関係テーブル読み込み
  // =========================

  console.log('[Step 4] 将来像辞書＋関係テーブル読み込み...');

  const dictVisions = loadCsv<DictVision>(`${dataDir}/dict/dict_vision.csv`);

  const relTables: RelationTables = {
    visionJob: loadCsv<RelVisionJob>(`${dataDir}/relations/rel_vision_job.csv`),
    visionIndustry: loadCsv<RelVisionIndustry>(`${dataDir}/relations/rel_vision_industry.csv`),
    visionTargetJob: loadCsv<RelVisionTargetJob>(`${dataDir}/relations/rel_vision_target_job.csv`),
    visionTargetIndustry: loadCsv<RelVisionTargetIndustry>(`${dataDir}/relations/rel_vision_target_industry.csv`),
    visionRole: loadCsv<RelVisionRole>(`${dataDir}/relations/rel_vision_role.csv`),
    visionStrengthType: loadCsv<RelVisionStrengthType>(`${dataDir}/relations/rel_vision_strength_type.csv`),
    visionQ1: loadCsv<RelVisionQ1>(`${dataDir}/relations/rel_vision_q1.csv`),
    visionQ2: loadCsv<RelVisionQ2>(`${dataDir}/relations/rel_vision_q2.csv`),
    visionQ3: loadCsv<RelVisionQ3>(`${dataDir}/relations/rel_vision_q3.csv`),
    visionQ4: loadCsv<RelVisionQ4>(`${dataDir}/relations/rel_vision_q4.csv`)
  };

  // =========================
  // Step 5: 素点計算
  // =========================

  console.log('[Step 5] 将来像スコア計算...');

  const visionScores = calcAllVisionScores(axis, dictVisions, relTables, weights, slotWeights);

  // =========================
  // Step 6: スロット別傾斜適用
  // =========================

  console.log('[Step 6] スロット別選定（重複排除）...');

  const selection = selectTop3BySlots(visionScores);

  // debug.scores 出力
  writeDebugScores(outDir, finalUserId, axis, weights, slotWeights, visionScores, selection, warnings, masterData);

  // =========================
  // Step 7: レポート出力
  // =========================

  console.log('[Step 7] レポート出力...');

  const q5Result = buildQ5Result(selection, dictVisions);
  writeReportJson(outDir, finalUserId, q5Result);
  const reportMd = writeReportMarkdown(outDir, finalUserId, q5Result);

  console.log('\n[完了]\n');
  console.log('='.repeat(60));
  console.log(reportMd);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('[エラー]', err);
  process.exit(1);
});
