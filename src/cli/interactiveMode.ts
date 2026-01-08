import { select, confirm, input } from '@inquirer/prompts';
import type {
  InputRow,
  MasterJob,
  MasterIndustry,
  MasterTargetJob,
  MasterTargetIndustry,
  MasterStrengthType,
  MasterAdditionalQuestion,
  MasterData
} from '../types/index.js';

// =========================
// 選択肢生成ヘルパー
// =========================

function buildJobChoices(jobs: MasterJob[]) {
  return jobs.map(j => ({
    name: `${j.job_category} - ${j.job_name}`,
    value: j.job_id
  }));
}

function buildIndustryChoices(industries: MasterIndustry[]) {
  return industries.map(i => ({
    name: `${i.industry_category} - ${i.industry_name}`,
    value: i.industry_id
  }));
}

function buildTargetJobChoices(targetJobs: MasterTargetJob[]) {
  return targetJobs.map(tj => ({
    name: tj.target_job_name,
    value: tj.target_job_id
  }));
}

function buildTargetIndustryChoices(targetIndustries: MasterTargetIndustry[]) {
  return targetIndustries.map(ti => ({
    name: ti.target_industry_name,
    value: ti.target_industry_id
  }));
}

function buildStrengthTypeChoices(strengthTypes: MasterStrengthType[]) {
  return strengthTypes.map(st => ({
    name: st.strength_type_name,
    value: st.strength_type_id
  }));
}

function buildQuestionChoices(questions: MasterAdditionalQuestion[], qNo: number) {
  return questions
    .filter(q => q.q_no === qNo)
    .map(q => ({
      name: `${q.choice_label}`,
      value: q.choice_no
    }));
}

// =========================
// 入力確認表示
// =========================

function displayConfirmation(
  inputData: InputRow,
  masterData: MasterData
): void {
  const job = masterData.jobs.find(j => j.job_id === inputData.career_job_id_longest);
  const industry = masterData.industries.find(i => i.industry_id === inputData.career_industry_id_longest);
  const targetJob = masterData.targetJobs.find(tj => tj.target_job_id === inputData.personal_job_id_top1);
  const targetIndustry = masterData.targetIndustries.find(ti => ti.target_industry_id === inputData.personal_industry_id_top1);
  const strengthType = masterData.strengthTypes.find(st => st.strength_type_id === inputData.personal_strength_type_id_top1);

  const getQLabel = (qNo: number, choiceNo: number) => {
    const q = masterData.questions.find(q => q.q_no === qNo && q.choice_no === choiceNo);
    return q?.choice_label || '不明';
  };

  console.log('\n=== 入力確認 ===');
  console.log(`ユーザーID: ${inputData.user_id}`);
  console.log(`経歴職種: ${job ? `${job.job_category} - ${job.job_name}` : '不明'} (job_id: ${inputData.career_job_id_longest})`);
  console.log(`経歴業界: ${industry ? `${industry.industry_category} - ${industry.industry_name}` : '不明'} (industry_id: ${inputData.career_industry_id_longest})`);
  console.log(`適性職種: ${targetJob?.target_job_name || '不明'} (target_job_id: ${inputData.personal_job_id_top1})`);
  console.log(`適性業界: ${targetIndustry?.target_industry_name || '不明'} (target_industry_id: ${inputData.personal_industry_id_top1})`);
  console.log(`役割: ${inputData.personal_role}`);
  console.log(`ストレングスタイプ: ${strengthType?.strength_type_name || '不明'} (strength_type_id: ${inputData.personal_strength_type_id_top1})`);
  console.log(`Q1: ${getQLabel(1, inputData.q1_choice_no)} (choice_no: ${inputData.q1_choice_no})`);
  console.log(`Q2: ${getQLabel(2, inputData.q2_choice_no)} (choice_no: ${inputData.q2_choice_no})`);
  console.log(`Q3: ${getQLabel(3, inputData.q3_choice_no)} (choice_no: ${inputData.q3_choice_no})`);
  console.log(`Q4: ${getQLabel(4, inputData.q4_choice_no)} (choice_no: ${inputData.q4_choice_no})`);
  console.log('');
}

// =========================
// インタラクティブ入力収集
// =========================

export interface InteractiveResult {
  userId: string;
  inputRow: InputRow;
}

export async function collectInputInteractively(
  defaultUserId: string,
  masterData: MasterData
): Promise<InteractiveResult> {
  console.log('\n=== キャリアレポート生成（インタラクティブモード） ===\n');

  // ユーザーID入力
  const userId = await input({
    message: 'ユーザーID（出力ファイル名に使用）を入力してください:',
    default: defaultUserId,
    validate: (value) => {
      if (!value.trim()) {
        return 'ユーザーIDを入力してください';
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return '英数字、ハイフン、アンダースコアのみ使用できます';
      }
      return true;
    }
  });

  // 経歴情報
  console.log('\n【経歴情報】\n');

  const careerJobId = await select({
    message: '一番経験が長い職種を選択してください:',
    choices: buildJobChoices(masterData.jobs)
  });

  const careerIndustryId = await select({
    message: '一番所属期間が長い業界を選択してください:',
    choices: buildIndustryChoices(masterData.industries)
  });

  // 資質情報
  console.log('\n【パーソナルレポート情報（資質）】\n');

  const personalJobId = await select({
    message: '適性職種（1位）を選択してください:',
    choices: buildTargetJobChoices(masterData.targetJobs)
  });

  const personalIndustryId = await select({
    message: '適性業界（1位）を選択してください:',
    choices: buildTargetIndustryChoices(masterData.targetIndustries)
  });

  const personalRole = await select({
    message: '役割を選択してください:',
    choices: [
      { name: 'manager（マネジメント志向）', value: 'manager' as const },
      { name: 'player（スペシャリスト志向）', value: 'player' as const }
    ]
  });

  const personalStrengthTypeId = await select({
    message: 'ストレングスタイプ（1位）を選択してください:',
    choices: buildStrengthTypeChoices(masterData.strengthTypes)
  });

  // 志向情報
  console.log('\n【志向情報（Q1〜Q4）】\n');

  const q1ChoiceNo = await select({
    message: 'Q1: 成果実感・得意な業務の傾向は？',
    choices: buildQuestionChoices(masterData.questions, 1)
  });

  const q2ChoiceNo = await select({
    message: 'Q2: 充実感・楽しさを感じる瞬間は？',
    choices: buildQuestionChoices(masterData.questions, 2)
  });

  const q3ChoiceNo = await select({
    message: 'Q3: 重視したい環境の種別は？',
    choices: buildQuestionChoices(masterData.questions, 3)
  });

  const q4ChoiceNo = await select({
    message: 'Q4: 今後のキャリアで目指したい方向性は？',
    choices: buildQuestionChoices(masterData.questions, 4)
  });

  const inputRow: InputRow = {
    user_id: userId,
    career_job_id_longest: careerJobId,
    career_industry_id_longest: careerIndustryId,
    personal_job_id_top1: personalJobId,
    personal_industry_id_top1: personalIndustryId,
    personal_role: personalRole,
    personal_strength_type_id_top1: personalStrengthTypeId,
    q1_choice_no: q1ChoiceNo,
    q2_choice_no: q2ChoiceNo,
    q3_choice_no: q3ChoiceNo,
    q4_choice_no: q4ChoiceNo
  };

  // 入力確認
  displayConfirmation(inputRow, masterData);

  const confirmed = await confirm({
    message: 'この内容で実行しますか？',
    default: true
  });

  if (!confirmed) {
    console.log('\n処理を中断しました。\n');
    process.exit(0);
  }

  console.log('\nレポートを生成中...\n');

  return { userId, inputRow };
}
