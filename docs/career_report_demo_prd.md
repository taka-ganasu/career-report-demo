# ロジックの概要

- 候補者の以下の情報をもとに、キャリアにおける将来像（ポジションと役割の言語化）を Q5 で 3 つ提案する
  - 経歴 30%
    - 一番経験が長い職種（職種 ID をキーにしてヒットする将来像を抽出）
    - 一番所属期間が長い業界（業界 ID をキーにしてヒットする将来像を抽出）
  - 資質 50%
    - パーソナルレポートの適正職種 1 位のみ（適正職種 ID をキーにしてヒットする将来像を抽出）
      - 経歴の職種とは別粒度であることに注意
    - パーソナルレポートの適正業界 1 位のみ（適正業界 ID をキーにしてヒットする将来像を抽出）
      - 経歴の業界とは別粒度であることに注意
    - パーソナルレポートの役割（役割 ID をキーにしてヒットする将来像を抽出）
      - マネジメント OR プレイヤー
    - パーソナルレポートのストレングスタイプ 1 位のみ（ストレングスタイプ ID をキーにしてヒットする将来像を抽出）
      - 16 のラベルから
  - 志向 20%
    Q 別の加点の重み付けは別途調整
    - Q1 成果実感・得意な業務の傾向
    - Q2 充実感・楽しさを感じる瞬間
    - Q3 重視したい環境の種別
    - Q4 今後のキャリアで目指したい方向性
- Q5 で提案する将来像の考え方
  - 上記の加点ルールと傾斜によって 3 つの将来像を提案し、ユーザーに選択してもらい、その後に選択した将来像に紐づくプラン、マイルストーン、必要なスキル、ポイントを提示する
  - Q5 ではあえて異なる将来像を見せることでキャリアの発見を促す
  - コンセプトごとに計算した点数に傾斜をかける
  - 重複を防ぐためにスロット 3 から順番に埋める
  - コンセプト・傾斜イメージ
    | #          | コンセプト | 傾斜イメージ　※やってみて調整     |
    | ---------- | ---------- | --------------------------------- |
    | スロット 1 | 経歴重視   | 経歴 ×2.0 + 資質 ×1.0 + 意志 ×0.5 |
    | スロット 2 | 資質重視   | 経歴 ×1.0 + 資質 ×2.0 + 意志 ×0.5 |
    | スロット 3 | 意志重視   | 経歴 ×1.0 + 資質 ×1.0 + 意志 ×2.0 |
- 最初期は超シンプルなロジックで初めて、段階的に発展させる
- 処理のおおまかな流れは変わらない
  - 軸の決定
    - 上記の経歴、資質に該当する情報を取得する
  - 将来像選定
  - プラン選定
    - マイルストーン構築
  - スキル選定
  - 入力データと結果を接続する文章生成
  - 結果出力

# 発展の方向性

- 使用するパラメータの追加・細分化
  - 職種
    - 経験がある全ての職種を経験年数ごとに重み付けして使用
  - 業界
    - 経験がある業界を経験年数ごとに重み付けして使用
  - 職務概要
    - 自由記述形式の項目を新規追加し、より具体的な実績や成果の再現性を活用
  - 役割 → キャリアタイプへの細分化
    - マネージャー/プレイヤーから 16 のタイプを活用するように変更
- ロジックの高度化（以前議論したものとほぼ変わらず）
  - Phase1 ルールベースの加点による線形モデル
  - Phase2 ルール+シンプル ML+LLM でアウトプットリライト
  - Phase3 将来像・プランのレコメンダ
    - 元々はプランのみのレコメンダを想定していたが、将来像を Q5 でユーザーに選択してもらうので、そのデータも活用して提案順をテンプレート（総合的なおすすめ、チャレンジ、堅実）からレコメンドベースに発展させる想定
  - Phase4 転職後のデータ等活用したユーザー × キャリアの時系列モデル

# デモの仕様

### 基本的な仕様

- UI/UX
  - インプットの csv セット
  - アウトプット生成処理実行
  - md と json をアウトプット
- インプット
  - 以下の項目をセットした csv
    - 一番経験が長い職種 ID
    - 一番所属期間が長い業界 ID
    - パーソナルレポートの適正職種 1 位の ID
    - パーソナルレポートの適正業界 1 位の ID
    - パーソナルレポートの役割(manager/player)
    - パーソナルレポートのストレングスタイプ ID
    - Q1 成果実感・得意な業務の傾向の回答選択肢番号
    - Q2 充実感・楽しさを感じる瞬間の回答選択肢番号
    - Q3 重視したい環境の種別の回答選択肢番号
    - Q4 今後のキャリアで目指したい方向性の回答選択肢番号
- アウトプット
  - md
    - 最終的なキャリアレポートのアウトプットを md 形式で出力
  - json
    - u1.report.md # レポート（Markdown）
    - u1.report.json # レポート（JSON）
    - u1.debug.axis.json # デバッグ：軸決定情報
    - u1.debug.scores.json # デバッグ：スコアリング内訳
- シミュレータで参照するデータ
  - マスタ
    - m_jobs（ユーザーの経歴の職種）
    - m_industries（ユーザーの経歴の業界）
    - m_target_jobs（適正職種）
    - m_target_industries（適正業界）
    - m_strength_types（ストレングスタイプ）
    - m_additional_questions（追加質問 Q1-4）
  - 関係テーブル
    基本的に n:n で表現。id と id の紐付きだけでなく、加点スコア列も保持する（結びつきの強さを調整できるようにする）
    - 将来像と職種
    - 将来像と業界
    - 将来像と適正職種
    - 将来像と適正業界
    - 将来像と役割
    - 将来像とストレングスタイプ
    - 将来像と追加質問（正規化のレベルは任せます）
  - 辞書データ
    - 将来像、プラン、マイルストン、スキル、ポイントの作成に必要なもの全て

### 追加したいギミック `重要`

- 経歴、資質、志向の加点内訳を外部から調整できるようにする（ロジックにハードコードせず、独立したファイルで定数管理）
- Q5 のコンセプト別の傾斜を外部から調整できるようにする（ロジックにハードコードせず、独立したファイルで定数管理）

# ディレクトリ構成

```
career-report-demo_v0.1/
├── .claude/
│   └── settings.local.json
│
├── data/
│   ├── dict/                              # 辞書・テンプレート
│   │   ├── dict_plan.csv                  # キャリアプラン定義
│   │   ├── dict_plan_steps.csv            # プラン→ステップ紐付け
│   │   ├── dict_skill.csv                 # スキル定義
│   │   ├── dict_skill_evidence_rules.csv  # スキル判定ルール
│   │   ├── dict_step.csv                  # ステップ定義
│   │   ├── dict_step_skill_gains.csv      # ステップで得られるスキル
│   │   ├── dict_vision.csv                # 将来像定義
│   │   ├── dict_vision_reasons.csv        # 将来像の理由テンプレート
│   │   └── dict_vision_required_skills.csv # 将来像に必要なスキル
│   │
│   ├── input/                             # ユーザー入力データ
│   │   └── input.csv                      # 一旦シンプルに始めるため
│   │
│   └── master/                            # マスタデータ
│       ├── m_job.csv                      # 職種マスタ
│       ├── m_industry.csv                 # 業界マスタ
│       └── m_company.csv                  # 企業マスタ
│
├── docs/                                  # ドキュメント
│   ├── career_report_prd.md               # 設計ドキュメント（PRD）
│   └── career_report_demo_implementation_step.md  # 実装ステップ
│
├── out/                                   # 出力ディレクトリ
│   ├── u1.report.md                       # レポート（Markdown）
│   ├── u1.report.json                     # レポート（JSON）
│   ├── u1.debug.axis.json                 # デバッグ：軸決定情報
│   └── u1.debug.scores.json               # デバッグ：スコアリング内訳
│
├── src/                                   # ソースコード
│   ├── cli/
│   │   └── run.ts                         # CLIエントリポイント
│   │
│   ├── domain/
│   │   └── axis.ts                        # 軸決定ロジック
│   │
│   ├── loaders/
│   │   └── csv.ts                         # CSV読み込みユーティリティ
│   │
│   ├── render/
│   │   └── writeFiles.ts                  # 出力ファイル生成
│   │
│   ├── rules/                             # ルールベース推論
│   │   ├── vision.ts                      # 将来像選定
│   │   ├── plan.ts                        # キャリアパス生成
│   │   ├── skills.ts                      # 必要スキル選定
│   │   └── points.ts                      # 形成ポイント生成
│   │
│   └── types/
│       └── index.ts                       # TypeScript型定義
│
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# 実装詳細（v0.1-simple-vision）

以下は v0.1 で実装されたロジックの詳細仕様です。

## 1. スコア計算ロジック

### 1.1 素点（Raw Score）計算

各将来像（Vision）に対して、3カテゴリの素点を計算します。

#### 経歴スコア（Career Score）
```
career_score = rel_vision_job[vision_id, job_id].score
             + rel_vision_industry[vision_id, industry_id].score
```

#### 資質スコア（Aptitude Score）
```
aptitude_score = rel_vision_target_job[vision_id, target_job_id].score
               + rel_vision_target_industry[vision_id, target_industry_id].score
               + rel_vision_role[vision_id, role].score
               + rel_vision_strength_type[vision_id, strength_type_id].score
```

#### 志向スコア（Will Score）
```
will_score = rel_vision_q1[vision_id, q1].score * q_weights.q1
           + rel_vision_q2[vision_id, q2].score * q_weights.q2
           + rel_vision_q3[vision_id, q3].score * q_weights.q3
           + rel_vision_q4[vision_id, q4].score * q_weights.q4
```

### 1.2 重み設定ファイル

#### 基本重み（config/weights.json）

```json
{
  "base": {
    "career": 0.3,
    "aptitude": 0.5,
    "will": 0.2
  },
  "will_q": {
    "q1": 1.0,
    "q2": 1.0,
    "q3": 1.0,
    "q4": 1.0
  }
}
```

#### スロット傾斜（config/slot_weights.json）

```json
{
  "slot1": { "career": 2.0, "aptitude": 1.0, "will": 0.5 },
  "slot2": { "career": 0.5, "aptitude": 2.0, "will": 1.0 },
  "slot3": { "career": 0.5, "aptitude": 1.0, "will": 2.0 }
}
```

### 1.3 スロット別トータルスコア計算

各スロット（slot1〜slot3）のトータルスコアは以下の式で計算されます。

```
slot_total = career_raw × base.career × slot.career
           + aptitude_raw × base.aptitude × slot.aptitude
           + will_raw × base.will × slot.will
```

**具体例（slot1: 経歴重視）**
```
slot1_total = career_raw × 0.3 × 2.0    // 経歴が強調される
            + aptitude_raw × 0.5 × 1.0
            + will_raw × 0.2 × 0.5
```

---

## 2. スロット選定アルゴリズム

### 2.1 選定方式：「全体ソート → 除外繰り上げ」

**重要**: 各スロットでは「全体ソート → 除外繰り上げ」方式を採用しています。

```
1. slot1選定:
   - 全将来像をslot1スコアで降順ソート
   - 1位を選定
   - usedVisionIds に追加

2. slot2選定:
   - 全将来像をslot2スコアで降順ソート（除外せずにソート）
   - 上位から順に走査
     - usedVisionIds に含まれていれば → excluded_vision_ids に記録してスキップ
     - 含まれていなければ → 選定して終了
   - usedVisionIds に追加

3. slot3選定:
   - 全将来像をslot3スコアで降順ソート（除外せずにソート）
   - 上位から順に走査
     - usedVisionIds に含まれていれば → excluded_vision_ids に記録してスキップ
     - 含まれていなければ → 選定して終了
```

### 2.2 top5とexcluded_vision_ids

- **top5**: 除外前の全体ランキング上位5件（除外されたものも含む）
- **excluded_vision_ids**: 実際にスキップされた将来像IDのリスト（繰り上げが発動したもののみ）

**例**: slot2でvision_id=1がslot1で使用済みの場合
```json
{
  "concept": "資質重視",
  "picked_vision_id": 2,
  "picked_score": 238.00,
  "excluded_vision_ids": [1],
  "top5": [
    { "vision_id": 1, "vision_title": "CEOとして企業のビジョンと戦略を策定", "score": 250.00 },
    { "vision_id": 2, "vision_title": "戦略コンサルタントとして経営戦略を描く", "score": 238.00 },
    { "vision_id": 3, "vision_title": "...", "score": 220.00 },
    { "vision_id": 4, "vision_title": "...", "score": 200.00 },
    { "vision_id": 5, "vision_title": "...", "score": 180.00 }
  ]
}
```

---

## 3. データ構造詳細

### 3.1 マスタデータ（data/master/）

| ファイル | カラム | 説明 |
|---------|--------|------|
| m_jobs.csv | job_id, job_category, job_name | 職種マスタ |
| m_industries.csv | industry_id, industry_category, industry_name | 業界マスタ |
| m_target_jobs.csv | target_job_id, target_job_name | 適性職種マスタ |
| m_target_industries.csv | target_industry_id, target_industry_name | 適性業界マスタ |
| m_strength_types.csv | strength_type_id, strength_type_name | 強みタイプマスタ |
| m_additional_questions.csv | q_no, choice_no, choice_tag, choice_label, choice_description | 追加質問マスタ |
| m_visions.csv | vision_id, vision_category, vision_position, vision_title, vision_description | 将来像マスタ |

### 3.2 関係テーブル（data/relations/）

すべてN:Nの関係にスコアを持つ構造です。

| ファイル | キー | 説明 |
|---------|------|------|
| rel_vision_job.csv | vision_id, job_id, score | 将来像×職種の適合スコア |
| rel_vision_industry.csv | vision_id, industry_id, score | 将来像×業界の適合スコア |
| rel_vision_target_job.csv | vision_id, target_job_id, score | 将来像×適性職種の適合スコア |
| rel_vision_target_industry.csv | vision_id, target_industry_id, score | 将来像×適性業界の適合スコア |
| rel_vision_role.csv | vision_id, role, score | 将来像×ロールの適合スコア |
| rel_vision_strength_type.csv | vision_id, strength_type_id, score | 将来像×強みタイプの適合スコア |
| rel_vision_q1.csv | vision_id, q1_choice_no, score | 将来像×Q1回答の適合スコア |
| rel_vision_q2.csv | vision_id, q2_choice_no, score | 将来像×Q2回答の適合スコア |
| rel_vision_q3.csv | vision_id, q3_choice_no, score | 将来像×Q3回答の適合スコア |
| rel_vision_q4.csv | vision_id, q4_choice_no, score | 将来像×Q4回答の適合スコア |

---

## 4. デバッグ出力構造

### 4.1 debug.scores.json の構造

```typescript
{
  user_id: string;
  version: string;
  generated_at: string;
  weights: {
    base: { career, aptitude, will };
    q_weights: { q1, q2, q3, q4 };
    slots: { slot1, slot2, slot3 };
  };
  inputs: {
    career_job_id_longest: number;
    career_job_name: string;  // マスタから取得した名称
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
      q1: { choice_no, choice_label };
      q2: { choice_no, choice_label };
      q3: { choice_no, choice_label };
      q4: { choice_no, choice_label };
    };
  };
  candidates: {
    vision_scores: VisionScoreBreakdown[];  // 全将来像のスコア詳細
  };
  selection: {
    slot1: SlotSelectionWithName;
    slot2: SlotSelectionWithName;
    slot3: SlotSelectionWithName;
  };
  warnings: string[];  // 欠損データ等の警告
}
```

---

## 5. 処理フロー

```
[Step 1] 入力データ読み込み（input.csv）
    ↓
[Step 2] 設定ファイル読み込み（weights.json, slot_weights.json）
    ↓
[Step 3] マスタデータ読み込み（m_*.csv）
    ↓
[Step 4] 将来像辞書＋関係テーブル読み込み（dict_vision.csv, rel_*.csv）
    ↓
[Step 5] 全将来像のスコア計算
    ↓
[Step 6] スロット別選定（重複排除）
    ↓
[Step 7] レポート出力
```

---

## 6. 設計上の注意点

1. **IDは数値型**: すべてのIDフィールドは数値として扱う（CSV読み込み時に自動変換）
2. **重複排除は繰り上げ方式**: slot2以降は全体ソート後に使用済みをスキップ
3. **top5は除外前ランキング**: デバッグ用に除外されたものも含む上位5件を保持
4. **欠損データは警告**: 入力データに欠損があっても処理を継続し、警告をwarningsに記録
5. **名称の付与**: デバッグ出力にはIDだけでなくマスタから取得した名称も含む

---

## 7. CLI実行モード

### 7.1 概要

CLIには2つの実行モードがあり、起動時に切り替えることができます。

| モード | オプション | 説明 |
|--------|-----------|------|
| CSVモード | `--mode=csv`（デフォルト） | input.csvから入力データを読み込んで実行 |
| インタラクティブモード | `--mode=interactive` または `-i` | マスタデータをもとに対話形式で入力を選択 |

### 7.2 実行コマンド

```bash
# CSVモード（従来通り）
npm run demo                        # デフォルト（u1, CSVモード）
npm run demo -- --user_id=u2        # 別ユーザーを指定
npm run demo -- --mode=csv          # 明示的にCSVモード指定

# インタラクティブモード
npm run demo -- --mode=interactive  # インタラクティブモード
npm run demo -- -i                  # 短縮形
npm run demo -- -i --user_id=test1  # ユーザーIDを指定してインタラクティブ実行
```

### 7.3 インタラクティブモードの入力フロー

インタラクティブモードでは、各項目についてマスタデータから選択肢を表示し、ユーザーが選択します。

```
=== キャリアレポート生成（インタラクティブモード） ===

【経歴情報】

? 一番経験が長い職種を選択してください:
  1. 営業 - 法人営業
  2. 営業 - 個人営業
  3. エンジニア - バックエンド
  4. エンジニア - フロントエンド
  ... (矢印キーで選択、数字で直接入力)
> 3

? 一番所属期間が長い業界を選択してください:
  1. IT・通信 - SIer
  2. IT・通信 - SaaS
  3. 金融 - 銀行
  ...
> 2

【パーソナルレポート情報（資質）】

? 適性職種（1位）を選択してください:
  1. 事業企画・推進
  2. 経営企画
  3. 戦略コンサルタント
  ...
> 1

? 適性業界（1位）を選択してください:
  ...

? 役割を選択してください:
  1. manager（マネジメント志向）
  2. player（スペシャリスト志向）
> 1

? ストレングスタイプ（1位）を選択してください:
  1. 戦略家
  2. 分析家
  3. 実行者
  ...
> 1

【志向情報（Q1〜Q4）】

? Q1: 成果実感・得意な業務の傾向は？
  1. 新規開拓・ゼロイチ
  2. 既存改善・グロース
  3. 組織づくり・マネジメント
  4. 専門性の深掘り
> 1

? Q2: 充実感・楽しさを感じる瞬間は？
  ...

? Q3: 重視したい環境の種別は？
  ...

? Q4: 今後のキャリアで目指したい方向性は？
  ...

入力内容を確認しています...

=== 入力確認 ===
経歴職種: エンジニア - バックエンド (job_id: 3)
経歴業界: IT・通信 - SaaS (industry_id: 2)
適性職種: 事業企画・推進 (target_job_id: 1)
適性業界: ...
役割: manager
ストレングスタイプ: 戦略家 (strength_type_id: 1)
Q1: 新規開拓・ゼロイチ (choice_no: 1)
Q2: ...
Q3: ...
Q4: ...

? この内容で実行しますか？ (Y/n) > Y

レポートを生成中...
```

### 7.4 インタラクティブモードの技術仕様

#### 使用ライブラリ

```json
{
  "dependencies": {
    "inquirer": "^9.0.0"
  },
  "devDependencies": {
    "@types/inquirer": "^9.0.0"
  }
}
```

※ Node.js標準のreadlineモジュールでも実装可能だが、inquirerを使用することで矢印キー選択やオートコンプリート等のUX向上が期待できる

#### 選択肢の動的生成

各入力項目の選択肢は、対応するマスタCSVから動的に生成します。

| 入力項目 | 参照マスタ | 表示形式 |
|---------|-----------|---------|
| 経歴職種 | m_jobs.csv | `{job_category} - {job_name}` |
| 経歴業界 | m_industries.csv | `{industry_category} - {industry_name}` |
| 適性職種 | m_target_jobs.csv | `{target_job_name}` |
| 適性業界 | m_target_industries.csv | `{target_industry_name}` |
| 役割 | ハードコード | `manager` / `player` |
| ストレングスタイプ | m_strength_types.csv | `{strength_type_name}` |
| Q1〜Q4 | m_additional_questions.csv | `{choice_label}` (q_no でフィルタ) |

#### 入力データの保存

インタラクティブモードで入力されたデータは、指定されたuser_idで以下に保存されます。

```
data/input/input.csv  # 既存ファイルに行を追加（または新規作成）
```

これにより、インタラクティブモードで入力したデータを後からCSVモードで再実行することも可能です。

### 7.5 ファイル構成の追加

```
src/
├── cli/
│   ├── run.ts                    # エントリポイント（モード振り分け）
│   ├── csvMode.ts                # CSVモード処理
│   └── interactiveMode.ts        # インタラクティブモード処理
```

### 7.6 引数パーサーの拡張

```typescript
interface CliArgs {
  user_id: string;           // デフォルト: "u1"
  mode: "csv" | "interactive"; // デフォルト: "csv"
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let user_id = "u1";
  let mode: "csv" | "interactive" = "csv";

  for (const arg of args) {
    if (arg.startsWith("--user_id=")) {
      user_id = arg.split("=")[1];
    } else if (arg === "--mode=interactive" || arg === "-i") {
      mode = "interactive";
    } else if (arg === "--mode=csv") {
      mode = "csv";
    }
  }

  return { user_id, mode };
}
```

### 7.7 インタラクティブモードの処理フロー

```
[Step 0] 引数解析（モード判定）
    ↓
[Step 1] マスタデータ読み込み（選択肢生成用）
    ↓
[Step 2] 対話形式で入力収集
    │
    ├─ 経歴情報（職種、業界）
    ├─ 資質情報（適性職種、適性業界、役割、強みタイプ）
    └─ 志向情報（Q1〜Q4）
    ↓
[Step 3] 入力確認表示
    ↓
[Step 4] 確認後、InputRow形式に変換
    ↓
[Step 5] input.csvに保存（オプション）
    ↓
[Step 6] 以降はCSVモードと同じ処理
    │
    ├─ 設定ファイル読み込み
    ├─ 将来像辞書＋関係テーブル読み込み
    ├─ スコア計算
    ├─ スロット選定
    └─ レポート出力
```

### 7.8 エラーハンドリング

| ケース | 対応 |
|--------|------|
| Ctrl+C による中断 | "処理を中断しました" と表示して終了 |
| 無効な選択 | "有効な番号を入力してください" と再表示 |
| マスタデータ読み込み失敗 | エラーメッセージを表示して終了 |

### 7.9 将来の拡張

- **検索機能**: 選択肢が多い場合にインクリメンタルサーチで絞り込み
- **デフォルト値**: 前回の入力値をデフォルトとして表示
- **入力履歴**: 過去のインタラクティブ入力履歴を保存・呼び出し
- **バリデーション強化**: 入力値の妥当性チェック（存在しないIDの検出等）
