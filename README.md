# Girls Bar Fairy - Customer QR Bill Display

お客様向けリアルタイム会計表示システム

## 概要

QRコードをスキャンすると、テーブルの現在の会計情報がリアルタイムで表示されます。
このページは**読み取り専用**で、注文や操作は一切できません。

## 機能

- 店舗名・テーブル番号表示
- ご着席時間・経過時間・残り時間表示
- 現在の合計金額（税サ込み、10円単位切り捨て）
- 延長プレビュー（残り5分以内に自動表示）
- 対応決済方法アイコン表示
- 8秒ごとの自動更新
- オフライン警告表示

## API仕様

### GET /customer/bill

お客様向け会計情報を取得します。

**パラメータ:**
- `read_token` (string): テーブルごとの読み取り専用トークン

**レスポンス例:**
```json
{
  "store_id": 1,
  "store_name": "Girls Bar Fairy 1号店",
  "table_id": "T3",
  "table_label": "A5",
  "start_time": "2026-02-03T21:00:00+09:00",
  "elapsed_minutes": 152,
  "remaining_minutes": 8,
  "current_total": 18500,
  "show_extension_preview": true,
  "extension_preview_total": 21500,
  "accepted_payment_methods": ["cash", "card", "qr", "contactless"],
  "footer_note": "別途 税・サ20%",
  "last_updated": "2026-02-03T23:32:05+09:00"
}
```

## QRコード生成

QRコードには以下の情報を含めたURLをエンコードします：

```
https://[ドメイン]/customer/{read_token}
```

**read_token の生成:**
1. テーブルごとに一意のトークンを生成
2. 会計開始時に有効化
3. 会計終了時に無効化
4. 例: `store_id`_`table_id`_`ランダム文字列`

**生成例:**
```javascript
const readToken = `${storeId}_${tableId}_${crypto.randomUUID()}`;
const qrUrl = `https://fairy-bar.example.com/customer/${readToken}`;
```

## 計算ルール

### 税・サービス料
- 消費税: 10%
- サービス料: 20%
- 合計乗数: 1.20

### 端数処理
- 最終表示金額は**10円単位で切り捨て**
- 計算式: `Math.floor(amount / 10) * 10`

### 延長プレビュー
- 残り時間が5分以下で自動表示
- 延長料金を加算後、税サ適用、10円切り捨て

## デモURL

- 通常表示: `/customer/demo-token-1`
- 延長プレビュー表示: `/customer/demo-token-2`

## 技術スタック

- React + TypeScript
- TailwindCSS
- Noto Sans JP フォント
- 8秒ポーリング（WebSocket/SSEに変更可能）

## テスト

```bash
npm run test
```

計算ロジックのユニットテストは `src/test/billing.test.ts` に含まれています。

---

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

Open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.
