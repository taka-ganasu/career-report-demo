import type { InputRow, Axis } from '../types/index.js';

/**
 * 入力行から軸データを構築する
 */
export function buildAxisFromInputRow(row: InputRow): Axis {
  const warnings: string[] = [];

  // 欠損チェック（数値型なので0も有効な値として扱う）
  if (row.career_job_id_longest === undefined || row.career_job_id_longest === null || isNaN(row.career_job_id_longest)) {
    warnings.push('career_job_id_longest is missing');
  }
  if (row.career_industry_id_longest === undefined || row.career_industry_id_longest === null || isNaN(row.career_industry_id_longest)) {
    warnings.push('career_industry_id_longest is missing');
  }
  if (row.personal_job_id_top1 === undefined || row.personal_job_id_top1 === null || isNaN(row.personal_job_id_top1)) {
    warnings.push('personal_job_id_top1 is missing');
  }
  if (row.personal_industry_id_top1 === undefined || row.personal_industry_id_top1 === null || isNaN(row.personal_industry_id_top1)) {
    warnings.push('personal_industry_id_top1 is missing');
  }
  if (!row.personal_role) {
    warnings.push('personal_role is missing');
  }
  if (row.personal_strength_type_id_top1 === undefined || row.personal_strength_type_id_top1 === null || isNaN(row.personal_strength_type_id_top1)) {
    warnings.push('personal_strength_type_id_top1 is missing');
  }
  if (row.q1_choice_no === undefined || row.q1_choice_no === null || isNaN(row.q1_choice_no)) {
    warnings.push('q1_choice_no is missing');
  }
  if (row.q2_choice_no === undefined || row.q2_choice_no === null || isNaN(row.q2_choice_no)) {
    warnings.push('q2_choice_no is missing');
  }
  if (row.q3_choice_no === undefined || row.q3_choice_no === null || isNaN(row.q3_choice_no)) {
    warnings.push('q3_choice_no is missing');
  }
  if (row.q4_choice_no === undefined || row.q4_choice_no === null || isNaN(row.q4_choice_no)) {
    warnings.push('q4_choice_no is missing');
  }

  return {
    user_id: row.user_id,
    career: {
      job_id: row.career_job_id_longest ?? 0,
      industry_id: row.career_industry_id_longest ?? 0
    },
    aptitude: {
      target_job_id: row.personal_job_id_top1 ?? 0,
      target_industry_id: row.personal_industry_id_top1 ?? 0,
      role: row.personal_role || 'player',
      strength_type_id: row.personal_strength_type_id_top1 ?? 0
    },
    will: {
      q1: row.q1_choice_no ?? 0,
      q2: row.q2_choice_no ?? 0,
      q3: row.q3_choice_no ?? 0,
      q4: row.q4_choice_no ?? 0
    },
    warnings
  };
}
