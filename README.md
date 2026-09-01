# 極管理（プロスピA Aランクトラッカー）

プロスピA の Aランク選手の収集進捗（極育成用）を管理する Web アプリ。
Firebase Firestore でデータを保存するので、**複数端末で自動同期**します。

- **Tailwind CLI + esbuild** でビルド（CDN 非依存・本番構成）
- **Firebase Hosting** で公開
- **GitHub** で管理、`main` へ push すると自動ビルド＆デプロイ

---

## 構成

```
├── src/
│   ├── app.jsx             ← アプリ本体（ここを編集する）
│   ├── firebase-config.js  ← Firebase 設定（要書き換え）
│   ├── input.css           ← Tailwind エントリポイント
│   └── index.html          ← HTML テンプレート
├── public/                 ← ビルド生成物（Git 管理外・Hosting 配信対象）
├── scripts/copy-html.mjs
├── tailwind.config.js
├── package.json
├── firebase.json
├── firestore.rules
└── .github/workflows/deploy.yml
```

> `public/` は `npm run build` で生成されるため Git にコミットしません。
> **編集するのは `src/` 配下だけ**です。

---

## 1. 前提

- Node.js 20 以上
- Git / GitHub アカウント
- Google アカウント（Firebase 用）

---

## 2. Firebase セットアップ

### 2-1. プロジェクトを作成

1. [Firebase コンソール](https://console.firebase.google.com/) →「**プロジェクトを追加**」
2. プロジェクト名を入力（例: `prospia-tracker`）
3. Google アナリティクスは有効／無効どちらでも可

### 2-2. Authentication を有効化

1. 左メニュー「**構築 → Authentication**」→「**始める**」
2. 「Sign-in method」タブ →「**Google**」→ 有効化 → サポートメールを設定して保存

### 2-3. Firestore Database を有効化

1. 左メニュー「**構築 → Firestore Database**」→「**データベースの作成**」
2. **本番環境モード**を選択（ルールは後で `firestore.rules` から反映されます）
3. ロケーションは `asia-northeast1`（東京）を推奨

### 2-4. Web アプリを登録して設定値を取得

1. プロジェクト概要ページ上部の「**</> (Web)**」アイコンをクリック
2. ニックネームを入力（例: `prospia-tracker-web`）
3. 「Firebase Hosting も設定する」はスキップで可（後で CLI から行います）
4. 表示された `firebaseConfig` の値をコピー

### 2-5. `src/firebase-config.js` に貼り付け

```js
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "prospia-tracker.firebaseapp.com",
  projectId: "prospia-tracker",
  storageBucket: "prospia-tracker.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc..."
};
```

> **注**: Firebase Web API キーはソースに含めて公開して問題ありません。
> データ保護は `firestore.rules`（本人以外読み書き不可）で行っています。

### 2-6. `.firebaserc` にプロジェクト ID を設定

```json
{
  "projects": {
    "default": "prospia-tracker"
  }
}
```

`.github/workflows/deploy.yml` の `projectId:` も同じ値に書き換えてください。

---

## 3. ローカルでビルド・確認

```bash
npm install       # 初回のみ
npm run build     # public/ に app.css, app.js, index.html を生成
```

開発中は watch モードが便利です（別々のターミナルで実行）:

```bash
npm run dev:css   # Tailwind watch
npm run dev:js    # esbuild watch
```

ローカルサーバーで確認するには:

```bash
npx firebase emulators:start --only hosting
```

---

## 4. GitHub にリポジトリを作成 & push

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/prospia-tracker.git
git push -u origin main
```

---

## 5. 初回デプロイ（Firebase CLI）

初回だけ手動でデプロイし、Firestore ルールも反映させます。

```bash
npm install -g firebase-tools   # 初回のみ
firebase login
npm run build                   # 必ずビルドしてから
firebase deploy
```

成功すると公開 URL が表示されます:

```
✔  Deploy complete!
Hosting URL: https://your-project-id.web.app
```

---

## 6. GitHub Actions で自動デプロイ

`main` に push するたびに、自動で `npm ci && npm run build` してデプロイされます。

```bash
firebase init hosting:github
```

対話に従うと、GitHub リポジトリの選択・サービスアカウント作成・Secret 登録が自動で行われます。
その後、以下を手動で調整してください:

1. `.github/workflows/deploy.yml` の `projectId:` をあなたのプロジェクト ID に
2. 同ファイルの `secrets.FIREBASE_SERVICE_ACCOUNT` を、実際に作られた Secret 名
   （例: `FIREBASE_SERVICE_ACCOUNT_PROSPIA_TRACKER`）に合わせる

> `firebase init hosting:github` はワークフロー YAML を上書き生成することがあります。
> その場合は、生成された YAML に `npm ci` と `npm run build` のステップが
> 含まれているか必ず確認してください（ビルドしないとデプロイ内容が空になります）。

以降は `git push origin main` だけで本番へ反映されます。

---

## 7. スマホでの利用（PWA 風）

**iOS (Safari)**: URL を開く → 共有ボタン → 「ホーム画面に追加」
**Android (Chrome)**: URL を開く → メニュー → 「ホーム画面に追加」

---

## 8. データについて

- 全データは Google アカウントに紐付いて Firestore に保存されます
- Firestore 無料枠（1 日 20K read / 20K write / 1GiB）で十分収まる規模です
- **オフライン対応**: 電波がなくても閲覧・編集でき、復帰時に自動同期されます
- **バックアップ**: メニュー →「データをエクスポート」で JSON 保存
- **リストア**: メニュー →「データをインポート」で上書き

---

## 9. データ構造

```
users/{uid}
  seeded: boolean
  seededAt: number

users/{uid}/players/{playerId}
  team:          string   ("ソ" / "日" / ... の球団コード)
  name:          string
  count:         number   (Aランク所持数)
  hasMotherBody: boolean  (S母体を持っているか)
  updatedAt:     number
```

ステータスは `count` と `hasMotherBody` から自動算出:

| 条件 | ステータス |
|---|---|
| `count >= 5` かつ `hasMotherBody` | **極待機** |
| `count >= 5` | 5体以上 |
| `count === 4` | 4体 |
| その他 | 収集中 |

---

## 10. トラブルシューティング

| 症状 | 対処 |
|---|---|
| `🔧 セットアップが必要です` と表示される | `src/firebase-config.js` が未設定。書き換えて `npm run build` を再実行 |
| 変更が反映されない | `npm run build` を実行し忘れ。`src/` を編集したら必ずビルドが必要 |
| サインインで `auth/unauthorized-domain` | Firebase コンソール → Authentication → Settings → 承認済みドメインに公開ドメイン（例 `your-project.web.app`）を追加 |
| デプロイ後にページが真っ白 | `firebase.json` の `"public": "public"` を確認。`npm run build` 後にデプロイしているか確認 |
| データが読めない | Firestore が作成済みか、`firebase deploy` でルールが反映されているか確認 |
| iOS でポップアップサインインが動かない | 自動的にリダイレクト方式にフォールバックします |
| `firebase deploy` で権限エラー | `firebase login` を再実行、または `firebase use --add` |

---

## 11. 変更の反映手順

```bash
# src/ を編集
npm run build          # ローカル確認する場合
git add -A
git commit -m "説明"
git push origin main   # Actions 設定済みなら自動デプロイ
```

Actions 未設定なら、`npm run build && firebase deploy` を手動で実行します。

---

## 12. アプリ名・アイコンを変更する

### 名前

| ファイル | 箇所 |
|---|---|
| `src/index.html` | `<title>`、`apple-mobile-web-app-title`、`description` |
| `src/manifest.webmanifest` | `name`、`short_name`、`description` |
| `src/app.jsx` | サインイン画面の見出し、ヘッダーのタイトル |

### アイコン

`src/icons/` 配下の PNG を差し替えます。必要なサイズは以下の通りです。

| ファイル | サイズ | 用途 |
|---|---|---|
| `apple-touch-icon.png` | 180×180 | iOS ホーム画面 |
| `icon-192.png` | 192×192 | Android ホーム画面 |
| `icon-512.png` | 512×512 | Android 高解像度・スプラッシュ |
| `icon-maskable-512.png` | 512×512 | Android マスカブル（中央 80% 内に収める） |
| `favicon-32.png` | 32×32 | ブラウザタブ |

> **iOS のホーム画面アイコンは SVG 非対応**です。必ず PNG を用意してください。

同梱の `scripts/gen-icons.py` で文字と色を変えて再生成できます（Pillow が必要）:

```bash
pip install Pillow
python3 scripts/gen-icons.py
npm run build
```

テーマカラー（アドレスバーの色）を変える場合は、`src/index.html` の
`<meta name="theme-color">` と `src/manifest.webmanifest` の `theme_color` の両方を
同じ値に揃えてください。
