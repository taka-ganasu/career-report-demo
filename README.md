# キャリアレポートデモ v0.1

将来像（Q5）の妥当性検証に特化したシンプルな実装です。

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/taka-ganasu/career-report-demo?quickstart=1)

## クイックスタート（GitHub Codespaces）

1. 上の「Open in GitHub Codespaces」ボタンをクリック
2. Codespaceが起動したら、ターミナルで以下を実行:

```bash
# インタラクティブモードで実行（おすすめ）
npm run demo -- -i

# または、CSVモードで実行
npm run demo
```

3. 質問に回答すると、キャリアレポートが生成されます

## 概要

- **スコープ**: 将来像（Q5で3つ出す）の選定のみ
- **ロジック**: 「経歴30%・資質50%・志向20%」の加点モデル
- **スロット**: コンセプト別の傾斜（経歴重視/資質重視/意志重視）で3案を提示

## ディレクトリ構成

```
career-report-demo_v0.1/
├── config/                     # 外部設定ファイル
│   ├── weights.json           # 経歴/資質/志向の基本重み、Q別重み
│   └── slot_weights.json      # スロット別傾斜
├── data/
│   ├── input/
│   │   └── input.csv          # ユーザー入力データ
│   ├── dict/
│   │   └── dict_vision.csv    # 将来像定義
│   └── relations/             # 関係テーブル（n:n + スコア）
│       ├── rel_vision_job.csv
│       ├── rel_vision_industry.csv
│       ├── rel_vision_target_job.csv
│       ├── rel_vision_target_industry.csv
│       ├── rel_vision_role.csv
│       ├── rel_vision_strength_type.csv
│       ├── rel_vision_q1.csv
│       ├── rel_vision_q2.csv
│       ├── rel_vision_q3.csv
│       └── rel_vision_q4.csv
├── out/                        # 出力ディレクトリ
├── src/
│   ├── cli/run.ts             # CLIエントリポイント
│   ├── domain/axis.ts         # 軸データ構築
│   ├── loaders/
│   │   ├── csv.ts             # CSV読み込み
│   │   └── config.ts          # 設定読み込み
│   ├── rules/
│   │   ├── visionScore.ts     # 素点計算（経歴/資質/志向）
│   │   └── visionSlots.ts     # スロット別選定
│   ├── render/writeFiles.ts   # 出力生成
│   └── types/index.ts         # 型定義
├── package.json
└── tsconfig.json
```

## セットアップ

```bash
cd ~/Documents/development/career-report-demo_v0.1
npm install
```

## 実行

### インタラクティブモード（おすすめ）

対話形式で各項目を選択できます。

```bash
npm run demo -- -i
```

### CSVモード

事前に用意したCSVデータで実行します。

```bash
# デモ実行（デフォルト: u1）
npm run demo

# ユーザー指定
npm run demo -- --user_id=u1
npm run demo -- --user_id=u2
```

### フラットモード

slot_weightsを使用せず、素点を単純加算してTop5を表示します。
スコアリングロジックの検証やデバッグに便利です。

```bash
# フラットモードで実行
npm run demo -- --flat
npm run demo -- -f

# ユーザー指定と組み合わせ
npm run demo -- --user_id=u1 --flat

# インタラクティブ + フラットモード
npm run demo -- -i --f
```

## 出力ファイル

| ファイル | 説明 |
|---------|------|
| `out/{user_id}.report.md` | レポート（Markdown） |
| `out/{user_id}.report.json` | レポート（JSON） |
| `out/{user_id}.debug.axis.json` | 軸データ + 使用した設定 |
| `out/{user_id}.debug.scores.json` | スコア内訳 + 選定ログ |
| `out/{user_id}.debug.flat.json` | フラットモード時のスコア内訳（全件ランキング付き） |

## スコア計算ロジック

### 1. 素点計算

各将来像について、以下の3カテゴリで素点を計算:

| カテゴリ | 参照する関係テーブル |
|---------|---------------------|
| 経歴（career） | rel_vision_job, rel_vision_industry |
| 資質（aptitude） | rel_vision_target_job, rel_vision_target_industry, rel_vision_role, rel_vision_strength_type |
| 志向（will） | rel_vision_q1, rel_vision_q2, rel_vision_q3, rel_vision_q4 |

### 2. スロット別傾斜

```
slot_total = career_raw × base.career × slot.career
           + aptitude_raw × base.aptitude × slot.aptitude
           + will_raw × base.will × slot.will
```

デフォルト設定:

| スロット | career | aptitude | will | コンセプト |
|---------|--------|----------|------|-----------|
| slot1 | ×2.0 | ×1.0 | ×0.5 | 経歴重視 |
| slot2 | ×0.5 | ×2.0 | ×1.0 | 資質重視 |
| slot3 | ×0.5 | ×1.0 | ×2.0 | 意志重視 |

### 3. 重複排除

- スロット1の1位を確定
- スロット2は、スロット1と同じvision_idを除外して1位
- スロット3は、スロット1/2と重複しない1位

## 調整方法

### 基本重み調整

`config/weights.json` を編集:

```json
{
  "base": {
    "career": 0.3,    // 経歴の基本重み
    "aptitude": 0.5,  // 資質の基本重み
    "will": 0.2       // 志向の基本重み
  },
  "will_q": {
    "q1": 1.0,  // Q1の重み
    "q2": 1.0,  // Q2の重み
    "q3": 1.0,  // Q3の重み
    "q4": 1.0   // Q4の重み
  }
}
```

### スロット傾斜調整

`config/slot_weights.json` を編集:

```json
{
  "slot1": { "career": 2.0, "aptitude": 1.0, "will": 0.5 },
  "slot2": { "career": 0.5, "aptitude": 2.0, "will": 1.0 },
  "slot3": { "career": 0.5, "aptitude": 1.0, "will": 2.0 }
}
```

### 将来像と入力の紐付け調整

`data/relations/rel_vision_*.csv` を編集してスコアを調整。

## 今後の拡張（v0.2以降）

- [ ] Plan（マイルストーン）の生成
- [ ] スキルギャップ分析
- [ ] キャリア形成ポイントの文章生成
