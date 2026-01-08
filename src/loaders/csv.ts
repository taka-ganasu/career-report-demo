import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * CSVファイルを読み込んでオブジェクト配列を返す
 * scoreカラムは自動的に数値に変換する
 */
export function loadCsv<T>(filePath: string): T[] {
  const content = readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: (value, context) => {
      // 数値カラムは数値に変換
      const numericColumns = [
        'score',
        'vision_id',
        'job_id',
        'industry_id',
        'target_job_id',
        'target_industry_id',
        'strength_type_id',
        'q1_choice_no',
        'q2_choice_no',
        'q3_choice_no',
        'q4_choice_no',
        'career_job_id_longest',
        'career_industry_id_longest',
        'personal_job_id_top1',
        'personal_industry_id_top1',
        'personal_strength_type_id_top1',
        // マスタ用
        'q_no',
        'choice_no'
      ];
      if (numericColumns.includes(context.column as string)) {
        return Number(value);
      }
      return value;
    }
  });
  return records as T[];
}

/**
 * CSVファイルを読み込んで1行目を返す（単一ユーザー用）
 */
export function loadCsvFirst<T>(filePath: string): T | undefined {
  const records = loadCsv<T>(filePath);
  return records[0];
}

/**
 * CSVファイルを読み込んで指定IDの行を返す
 */
export function loadCsvById<T extends { user_id: string }>(
  filePath: string,
  userId: string
): T | undefined {
  const records = loadCsv<T>(filePath);
  return records.find(r => r.user_id === userId);
}
