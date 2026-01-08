// =========================
// 入力データ型
// =========================

export interface InputRow {
  user_id: string;
  // 経歴（Career）
  career_job_id_longest: number;
  career_industry_id_longest: number;
  // 資質（Aptitude）- パーソナルレポート結果
  personal_job_id_top1: number;
  personal_industry_id_top1: number;
  personal_role: 'manager' | 'player';
  personal_strength_type_id_top1: number;
  // 志向（Will）- Q1〜Q4
  q1_choice_no: number;
  q2_choice_no: number;
  q3_choice_no: number;
  q4_choice_no: number;
}

// =========================
// 軸データ（正規化済み入力）
// =========================

export interface Axis {
  user_id: string;
  // 経歴
  career: {
    job_id: number;
    industry_id: number;
  };
  // 資質
  aptitude: {
    target_job_id: number;
    target_industry_id: number;
    role: 'manager' | 'player';
    strength_type_id: number;
  };
  // 志向
  will: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  // 欠損チェック
  warnings: string[];
}

// =========================
// 設定ファイル型
// =========================

export interface Weights {
  // 経歴/資質/志向の基本重み
  base: {
    career: number;
    aptitude: number;
    will: number;
  };
  // 志向（Q1〜Q4）の加点重み
  will_q: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

export interface SlotWeights {
  // スロット1〜3の傾斜
  slot1: { career: number; aptitude: number; will: number };
  slot2: { career: number; aptitude: number; will: number };
  slot3: { career: number; aptitude: number; will: number };
}

// =========================
// マスタデータ型
// =========================

export interface MasterJob {
  job_id: number;
  job_category: string;
  job_name: string;
}

export interface MasterIndustry {
  industry_id: number;
  industry_category: string;
  industry_name: string;
}

export interface MasterTargetJob {
  target_job_id: number;
  target_job_name: string;
}

export interface MasterTargetIndustry {
  target_industry_id: number;
  target_industry_name: string;
}

export interface MasterStrengthType {
  strength_type_id: number;
  strength_type_name: string;
}

export interface MasterAdditionalQuestion {
  q_no: number;
  choice_no: number;
  choice_tag: string;
  choice_label: string;
  choice_description: string;
}

export interface MasterVision {
  vision_id: number;
  vision_category: string;
  vision_position: string;
  vision_title: string;
  vision_description: string;
}

// マスタデータをまとめた型
export interface MasterData {
  jobs: MasterJob[];
  industries: MasterIndustry[];
  targetJobs: MasterTargetJob[];
  targetIndustries: MasterTargetIndustry[];
  strengthTypes: MasterStrengthType[];
  questions: MasterAdditionalQuestion[];
  visions: MasterVision[];
}

// =========================
// 将来像辞書
// =========================

export interface DictVision {
  vision_id: number;
  title: string;
  description: string;
}

// =========================
// 関係テーブル（n:n + スコア）
// =========================

export interface RelVisionJob {
  vision_id: number;
  job_id: number;
  score: number;
}

export interface RelVisionIndustry {
  vision_id: number;
  industry_id: number;
  score: number;
}

export interface RelVisionTargetJob {
  vision_id: number;
  target_job_id: number;
  score: number;
}

export interface RelVisionTargetIndustry {
  vision_id: number;
  target_industry_id: number;
  score: number;
}

export interface RelVisionRole {
  vision_id: number;
  role: string;
  score: number;
}

export interface RelVisionStrengthType {
  vision_id: number;
  strength_type_id: number;
  score: number;
}

export interface RelVisionQ1 {
  vision_id: number;
  q1_choice_no: number;
  score: number;
}

export interface RelVisionQ2 {
  vision_id: number;
  q2_choice_no: number;
  score: number;
}

export interface RelVisionQ3 {
  vision_id: number;
  q3_choice_no: number;
  score: number;
}

export interface RelVisionQ4 {
  vision_id: number;
  q4_choice_no: number;
  score: number;
}

// =========================
// スコア計算結果
// =========================

export interface RawDetail {
  source: string;       // 例: "career_job", "target_job", "q1"
  key: string;          // 例: "job_id:35", "q1_choice_no:1"
  score: number;
  rel: string;          // 例: "rel_vision_job.csv"
}

export interface VisionScoreBreakdown {
  vision_id: number;
  raw: {
    career: number;
    aptitude: number;
    will: number;
  };
  raw_details: {
    career: RawDetail[];
    aptitude: RawDetail[];
    will: RawDetail[];
  };
  slot_totals: {
    slot1: number;
    slot2: number;
    slot3: number;
  };
}

export interface SlotSelection {
  concept: string;
  picked_vision_id: number;
  picked_score: number;
  excluded_vision_ids: number[];
  top5: Array<{ vision_id: number; score: number }>;
}

// =========================
// 出力型
// =========================

export interface Q5Result {
  slot1: VisionOutput;
  slot2: VisionOutput;
  slot3: VisionOutput;
}

export interface VisionOutput {
  vision_id: number;
  title: string;
  description: string;
  slot_total: number;
}

// =========================
// Debug出力型
// =========================

export interface DebugScoresOutput {
  user_id: string;
  version: string;
  generated_at: string;
  weights: {
    base: Weights['base'];
    q_weights: Weights['will_q'];
    slots: SlotWeights;
  };
  inputs: {
    career_job_id_longest: number;
    career_job_name: string;
    career_industry_id_longest: number;
    career_industry_name: string;
    personal_job_id_top1: number;
    personal_job_name: string;
    personal_industry_id_top1: number;
    personal_industry_name: string;
    personal_role: string;
    personal_strength_type_id_top1: number;
    personal_strength_type_name: string;
    q: {
      q1: { choice_no: number; choice_label: string };
      q2: { choice_no: number; choice_label: string };
      q3: { choice_no: number; choice_label: string };
      q4: { choice_no: number; choice_label: string };
    };
  };
  candidates: {
    vision_scores: VisionScoreBreakdown[];
  };
  selection: {
    slot1: SlotSelectionWithName;
    slot2: SlotSelectionWithName;
    slot3: SlotSelectionWithName;
  };
  warnings: string[];
}

// SlotSelectionに名称情報を追加した型
export interface SlotSelectionWithName extends SlotSelection {
  picked_vision_title: string;
  top5: Array<{ vision_id: number; vision_title: string; score: number }>;
}

export interface DebugAxisOutput {
  user_id: string;
  version: string;
  generated_at: string;
  axis: Axis;
  config: {
    weights: Weights;
    slot_weights: SlotWeights;
  };
}
