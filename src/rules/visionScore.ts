import type {
  Axis,
  Weights,
  SlotWeights,
  VisionScoreBreakdown,
  RawDetail,
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
  DictVision
} from '../types/index.js';

export interface RelationTables {
  visionJob: RelVisionJob[];
  visionIndustry: RelVisionIndustry[];
  visionTargetJob: RelVisionTargetJob[];
  visionTargetIndustry: RelVisionTargetIndustry[];
  visionRole: RelVisionRole[];
  visionStrengthType: RelVisionStrengthType[];
  visionQ1: RelVisionQ1[];
  visionQ2: RelVisionQ2[];
  visionQ3: RelVisionQ3[];
  visionQ4: RelVisionQ4[];
}

interface ScoreResult {
  score: number;
  details: RawDetail[];
}

/**
 * 経歴スコアを計算
 * - career_job_id_longest → rel_vision_job
 * - career_industry_id_longest → rel_vision_industry
 */
function calcCareerScore(
  axis: Axis,
  visionId: number,
  relTables: RelationTables
): ScoreResult {
  const details: RawDetail[] = [];
  let score = 0;

  // 経歴職種
  const jobMatch = relTables.visionJob.find(
    r => r.vision_id === visionId && r.job_id === axis.career.job_id
  );
  if (jobMatch) {
    score += jobMatch.score;
    details.push({
      source: 'career_job',
      key: `job_id:${axis.career.job_id}`,
      score: jobMatch.score,
      rel: 'rel_vision_job.csv'
    });
  }

  // 経歴業界
  const industryMatch = relTables.visionIndustry.find(
    r => r.vision_id === visionId && r.industry_id === axis.career.industry_id
  );
  if (industryMatch) {
    score += industryMatch.score;
    details.push({
      source: 'career_industry',
      key: `industry_id:${axis.career.industry_id}`,
      score: industryMatch.score,
      rel: 'rel_vision_industry.csv'
    });
  }

  return { score, details };
}

/**
 * 資質スコアを計算
 * - personal_job_id_top1 → rel_vision_target_job
 * - personal_industry_id_top1 → rel_vision_target_industry
 * - personal_role → rel_vision_role
 * - personal_strength_type_id_top1 → rel_vision_strength_type
 */
function calcAptitudeScore(
  axis: Axis,
  visionId: number,
  relTables: RelationTables
): ScoreResult {
  const details: RawDetail[] = [];
  let score = 0;

  // 適性職種
  const jobMatch = relTables.visionTargetJob.find(
    r => r.vision_id === visionId && r.target_job_id === axis.aptitude.target_job_id
  );
  if (jobMatch) {
    score += jobMatch.score;
    details.push({
      source: 'target_job',
      key: `target_job_id:${axis.aptitude.target_job_id}`,
      score: jobMatch.score,
      rel: 'rel_vision_target_job.csv'
    });
  }

  // 適性業界
  const industryMatch = relTables.visionTargetIndustry.find(
    r => r.vision_id === visionId && r.target_industry_id === axis.aptitude.target_industry_id
  );
  if (industryMatch) {
    score += industryMatch.score;
    details.push({
      source: 'target_industry',
      key: `target_industry_id:${axis.aptitude.target_industry_id}`,
      score: industryMatch.score,
      rel: 'rel_vision_target_industry.csv'
    });
  }

  // ロール
  const roleMatch = relTables.visionRole.find(
    r => r.vision_id === visionId && r.role === axis.aptitude.role
  );
  if (roleMatch) {
    score += roleMatch.score;
    details.push({
      source: 'role',
      key: `role:${axis.aptitude.role}`,
      score: roleMatch.score,
      rel: 'rel_vision_role.csv'
    });
  }

  // 強みタイプ
  const strengthMatch = relTables.visionStrengthType.find(
    r => r.vision_id === visionId && r.strength_type_id === axis.aptitude.strength_type_id
  );
  if (strengthMatch) {
    score += strengthMatch.score;
    details.push({
      source: 'strength',
      key: `strength_type_id:${axis.aptitude.strength_type_id}`,
      score: strengthMatch.score,
      rel: 'rel_vision_strength_type.csv'
    });
  }

  return { score, details };
}

/**
 * 志向スコアを計算
 * - q1〜q4 → rel_vision_q1〜q4
 */
function calcWillScore(
  axis: Axis,
  visionId: number,
  relTables: RelationTables,
  qWeights: Weights['will_q']
): ScoreResult {
  const details: RawDetail[] = [];
  let score = 0;

  // Q1
  const q1Match = relTables.visionQ1.find(
    r => r.vision_id === visionId && r.q1_choice_no === axis.will.q1
  );
  if (q1Match) {
    const weighted = q1Match.score * qWeights.q1;
    score += weighted;
    details.push({
      source: 'q1',
      key: `q1_choice_no:${axis.will.q1}`,
      score: weighted,
      rel: 'rel_vision_q1.csv'
    });
  }

  // Q2
  const q2Match = relTables.visionQ2.find(
    r => r.vision_id === visionId && r.q2_choice_no === axis.will.q2
  );
  if (q2Match) {
    const weighted = q2Match.score * qWeights.q2;
    score += weighted;
    details.push({
      source: 'q2',
      key: `q2_choice_no:${axis.will.q2}`,
      score: weighted,
      rel: 'rel_vision_q2.csv'
    });
  }

  // Q3
  const q3Match = relTables.visionQ3.find(
    r => r.vision_id === visionId && r.q3_choice_no === axis.will.q3
  );
  if (q3Match) {
    const weighted = q3Match.score * qWeights.q3;
    score += weighted;
    details.push({
      source: 'q3',
      key: `q3_choice_no:${axis.will.q3}`,
      score: weighted,
      rel: 'rel_vision_q3.csv'
    });
  }

  // Q4
  const q4Match = relTables.visionQ4.find(
    r => r.vision_id === visionId && r.q4_choice_no === axis.will.q4
  );
  if (q4Match) {
    const weighted = q4Match.score * qWeights.q4;
    score += weighted;
    details.push({
      source: 'q4',
      key: `q4_choice_no:${axis.will.q4}`,
      score: weighted,
      rel: 'rel_vision_q4.csv'
    });
  }

  return { score, details };
}

/**
 * スロット別トータルスコアを計算
 */
function calcSlotTotals(
  careerRaw: number,
  aptitudeRaw: number,
  willRaw: number,
  baseWeights: Weights['base'],
  slotWeights: SlotWeights
): { slot1: number; slot2: number; slot3: number } {
  return {
    slot1:
      careerRaw * baseWeights.career * slotWeights.slot1.career +
      aptitudeRaw * baseWeights.aptitude * slotWeights.slot1.aptitude +
      willRaw * baseWeights.will * slotWeights.slot1.will,
    slot2:
      careerRaw * baseWeights.career * slotWeights.slot2.career +
      aptitudeRaw * baseWeights.aptitude * slotWeights.slot2.aptitude +
      willRaw * baseWeights.will * slotWeights.slot2.will,
    slot3:
      careerRaw * baseWeights.career * slotWeights.slot3.career +
      aptitudeRaw * baseWeights.aptitude * slotWeights.slot3.aptitude +
      willRaw * baseWeights.will * slotWeights.slot3.will
  };
}

/**
 * 全将来像の素点を計算
 */
export function calcAllVisionScores(
  axis: Axis,
  dictVisions: DictVision[],
  relTables: RelationTables,
  weights: Weights,
  slotWeights: SlotWeights
): VisionScoreBreakdown[] {
  return dictVisions.map(vision => {
    const career = calcCareerScore(axis, vision.vision_id, relTables);
    const aptitude = calcAptitudeScore(axis, vision.vision_id, relTables);
    const will = calcWillScore(axis, vision.vision_id, relTables, weights.will_q);

    const slotTotals = calcSlotTotals(
      career.score,
      aptitude.score,
      will.score,
      weights.base,
      slotWeights
    );

    return {
      vision_id: vision.vision_id,
      raw: {
        career: career.score,
        aptitude: aptitude.score,
        will: will.score
      },
      raw_details: {
        career: career.details,
        aptitude: aptitude.details,
        will: will.details
      },
      slot_totals: slotTotals
    };
  });
}

/**
 * フラットスコア結果の型
 */
export interface FlatScoreResult {
  vision_id: number;
  total_score: number;
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
}

/**
 * フラットスコア計算（slot_weightsなし、素点を単純加算）
 */
export function calcFlatVisionScores(
  axis: Axis,
  dictVisions: DictVision[],
  relTables: RelationTables
): FlatScoreResult[] {
  // Q1〜Q4の重みは全て1.0（フラット）
  const flatQWeights = { q1: 1, q2: 1, q3: 1, q4: 1 };

  return dictVisions.map(vision => {
    const career = calcCareerScore(axis, vision.vision_id, relTables);
    const aptitude = calcAptitudeScore(axis, vision.vision_id, relTables);
    const will = calcWillScore(axis, vision.vision_id, relTables, flatQWeights);

    // 素点を単純加算
    const totalScore = career.score + aptitude.score + will.score;

    return {
      vision_id: vision.vision_id,
      total_score: totalScore,
      raw: {
        career: career.score,
        aptitude: aptitude.score,
        will: will.score
      },
      raw_details: {
        career: career.details,
        aptitude: aptitude.details,
        will: will.details
      }
    };
  });
}
