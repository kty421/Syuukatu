# 就活管理アプリ

就活中に散らばりがちな企業情報を、ひとつの場所で整理するためのアプリです。
応募企業ごとの選考状況、志望度、ログイン情報、質問メモをまとめて管理できます。

## 概要

企業一覧を見ながら、応募先の進捗や面接準備を手早く確認できるようにした個人向けの就活管理アプリです。  
インターンと本選考を切り替えながら、必要な情報を迷わず見返せる構成にしています。

## 主な機能

- インターン / 本選考ごとに企業を切り替えて管理
- 企業名、ログインID、業界、タグで検索
- 選考状況と志望度の記録
- ログインID / パスワードの保存とコピー
- 質問メモ、回答メモ、自由メモの保存
- 企業をまたいだ質問メモ一覧と回答状況の確認
- お気に入り企業の管理

## 主な画面

### 企業一覧画面
<div style="display: flex; gap: 10px;">
  <img src="https://github.com/user-attachments/assets/bd1b7853-75ff-43cb-b260-b3597ebcc4e9" width="32%" />
  <img src="https://github.com/user-attachments/assets/f8c5dd89-011d-46b4-a146-0d7ee773cb6d" width="32%" />
  <img src="https://github.com/user-attachments/assets/0c976720-1dac-416a-a04c-b4c427203de4" width="32%" />
</div>

- 応募種別（インターン / 本選考など）ごとに企業を一覧表示  
- ステータス（選考中 / 内定 / 落選など）で整理  
- 検索機能により目的の企業へ即アクセス  
- ボトムナビから質問一覧を開き、企業を横断して質問メモを検索・絞り込み

---

### 企業追加 / 質問メモ画面
<div style="display: flex; gap: 10px;">
  <img src="https://github.com/user-attachments/assets/06972784-0f21-48b4-8028-3e6b1ba5dd5a" width="32%" />
  <img src="https://github.com/user-attachments/assets/59b8bcac-e75d-4c18-8756-535536b5756f" width="32%" />
</div>

## セットアップ方法

### 前提

- Node.js LTS 推奨
- Expo SDK 54 の最小 Node.js は `20.19.x`
- Supabase プロジェクト（Free プラン可）
- Vercel プロジェクト

### インストール

```bash
npm install
```

## 起動方法

```bash
npm start
```

## 本番 Web アプリ

このリポジトリの Web 版は確認用プレビューではなく、実ユーザーがブラウザから利用する正式な提供形態のひとつとして扱います。Expo Router 未使用の 1 画面 SPA のため、Web 出力は `single` を採用しています。`static` は Expo Router のルート単位静的 HTML 生成に向いた方式なので、現状の構成では使用しません。

将来的に公開 LP、SEO、複数ページ、サーバーサイド描画が必要になった場合は、Expo Router 導入または Web フロントの分離を検討してください。

### Web ローカル起動

```bash
npm run web
```

API を含めて確認する場合は、Vercel 側の API が動く URL を `.env` の `EXPO_PUBLIC_API_BASE_URL` に設定してください。Vercel にデプロイした Web 版では同一オリジンの `/api` を利用できます。

`npm run web` の Expo dev server 単体では Vercel Functions の `/api/*` は動きません。ローカルで API まで含める場合は `vercel dev` などで Functions を起動し、`EXPO_PUBLIC_API_BASE_URL` をその URL に向けてください。未設定のまま `/api` が Expo 側へ吸われると、アプリはAPI設定不足としてエラーを表示します。

### iOS / Android ローカル起動

iOS / Android は Web の `HttpOnly` Cookie を利用できないため、Supabase SDK から取得した `session.access_token` を `Authorization: Bearer <access_token>` として Vercel API に送ります。企業追加・編集・削除を行うには、`.env` の `EXPO_PUBLIC_API_BASE_URL` に Vercel Production URL を設定してからアプリを再起動してください。

```env
EXPO_PUBLIC_API_BASE_URL=https://your-production-domain.vercel.app
```

Preview Deploy を検証する間だけ、この値を Vercel Preview URL に差し替えてください。変数名は必ず `EXPO_PUBLIC_API_BASE_URL` です。`EXPO_PUBLIC_API_BASE_UR` のように末尾の `L` が抜けていると読み込まれません。

Vercel の Deployment Protection が有効なURLを指定すると、iOS / Android からのAPI呼び出しにはJSONではなく `Authentication Required` のHTMLが返り、企業データを保存できません。`EXPO_PUBLIC_API_BASE_URL` には保護されていない Production URL を設定するか、Vercel Project Settings で対象デプロイのProtectionを解除してください。

### Web 本番ビルド

```bash
npx expo export -p web
```

出力先は `dist` です。

### 本番ビルドのローカル確認

```bash
npx expo serve dist
```

### Supabase 設定

1. Supabase でプロジェクトを作成する
2. SQL Editor で `supabase/schema.sql` を実行する
3. Authentication の Email provider を有効にする
4. Authentication > URL Configuration を設定する

Auth URL Configuration は確認メールリンクの遷移先に直接影響します。

- Site URL: 本番 Web URL（例: `https://your-domain.vercel.app`）にする
- Redirect URLs:
  - 本番 Web の `https://syuukatu.vercel.app/auth/confirm`
  - 本番 Web の `https://syuukatu.vercel.app/auth/reset-password`
  - ネイティブアプリ用の `syuukatu://auth/callback`（既存 deep link 用）

Site URL が `http://localhost:3000` のままだと、iOS / Android の確認メールリンクから localhost に遷移してしまいます。Preview Deploy を使う場合は、Preview 用URLも Supabase の Redirect URLs に追加してください。

会社データは `public.companies` に保存されます。RLS により `user_id = auth.uid()` のデータだけを読み書きできます。企業サイト用のパスワード列は作成していません。

Supabase 側で `Could not find the table 'public.companies' in the schema cache` が出る場合は、本番 Supabase にテーブル作成SQLが未適用、または PostgREST の schema cache が更新されていません。Supabase Dashboard の SQL Editor で [supabase/migrations/202605040001_create_companies.sql](supabase/migrations/202605040001_create_companies.sql) を実行してください。このSQLは `public.companies` の作成、RLS policy、authenticated role への権限付与、schema cache reload をまとめて行います。

### 環境変数

`.env.example` を参考に `.env` または Vercel Project Settings に設定してください。

- `EXPO_PUBLIC_API_BASE_URL`: iOS / Android から呼び出す API のベース URL。Production では保護されていない Vercel Production URL、Preview検証時のみ保護を解除した Preview URLを設定します。Web本番は同一オリジンの `/api` を使えるため空でも動きます。
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase Project URL。現在のプロジェクトは `https://vzvoajnhbksbvbwbgjji.supabase.co` です。クライアントに公開されます。
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key。クライアントに公開されます。
- `EXPO_PUBLIC_WEB_BASE_URL`: Web の本番 URL。既定値は `https://syuukatu.vercel.app`。
- `EXPO_PUBLIC_CONFIRM_EMAIL_REDIRECT_URL`: 新規登録確認メールの遷移先。既定値は `https://syuukatu.vercel.app/auth/confirm`。
- `EXPO_PUBLIC_RESET_PASSWORD_REDIRECT_URL`: パスワード再設定メールの遷移先。既定値は `https://syuukatu.vercel.app/auth/reset-password`。
- `EXPO_PUBLIC_NATIVE_AUTH_CALLBACK_URL`: iOS / Android の確認メール callback URL。既定値は `syuukatu://auth/callback`。
- `SUPABASE_URL`: Vercel Functions 用の Supabase Project URL。現在のプロジェクトは `https://vzvoajnhbksbvbwbgjji.supabase.co` です。
- `SUPABASE_ANON_KEY`: Vercel Functions 用の Supabase anon public key。
- `WEB_BASE_URL`: Vercel Functions が認証リダイレクト URL を組み立てる Web URL。既定値は `https://syuukatu.vercel.app`。
- `CONFIRM_EMAIL_REDIRECT_URL`: Vercel Functions が `signUp` / 確認メール再送で Supabase に渡す URL。
- `RESET_PASSWORD_REDIRECT_URL`: Vercel Functions が `resetPasswordForEmail` で Supabase に渡す URL。

`EXPO_PUBLIC_` はビルド済み JavaScript に埋め込まれます。Service role key、管理者トークン、シークレットは絶対に入れないでください。

Vercel には Production と Preview の両方へ `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`EXPO_PUBLIC_SUPABASE_URL`、`EXPO_PUBLIC_SUPABASE_ANON_KEY`、`EXPO_PUBLIC_NATIVE_AUTH_CALLBACK_URL` を設定してください。Production では `WEB_BASE_URL`、`CONFIRM_EMAIL_REDIRECT_URL`、`RESET_PASSWORD_REDIRECT_URL` と対応する `EXPO_PUBLIC_*` を本番 URL にします。Preview の確認メールや再設定メールも使う場合は、その Preview URL 用の `/auth/confirm` と `/auth/reset-password` を Supabase Redirect URLs に追加してください。

### 認証とログイン情報保存

- アプリへのログインは Supabase Auth のメール + パスワードです。
- Web は Vercel API 経由で認証し、session を `HttpOnly` Cookie に保存します。
- iOS / Android は Supabase session を `expo-secure-store` に保存します。
- 新規登録では確認メールを送信し、登録直後はホームへ遷移せず確認メール案内を表示します。確認後は `/auth/confirm` で完了表示を出し、ログイン画面へ誘導します。
- パスワード再設定メールは `/auth/reset-password` に戻り、Web 専用 Supabase client が recovery session を検出して新しいパスワードを更新します。
- 会社ごとのログイン ID は Supabase に保存します。
- Web では会社ごとのパスワードを localStorage / AsyncStorage 相当 / 独自ストレージへ保存しません。
- Web で企業サイトのパスワードを扱う場合は、ブラウザのパスワードマネージャーを利用してください。
- iOS / Android では既存挙動を保ち、会社パスワードは端末内 SecureStore のみに保存します。Supabase には同期しません。

共有端末ではログイン ID 保存を使わないでください。ログアウト時は Web Cookie またはネイティブ session を削除します。

Supabase Free プランや既定メール送信では、短時間に新規登録や確認メール送信を繰り返すと `email rate limit exceeded` になることがあります。この場合、アプリでは「メールの送信回数が上限に達しました。時間をおいて再度お試しください。」と表示します。解除はアプリコードではできないため、時間をおくか、Supabase の Auth SMTP 設定で本番用メール送信基盤を設定してください。すでに登録済みのアカウントは通常どおりログインできます。

Confirm signup と Reset password のメールテンプレートでは `{{ .ConfirmationURL }}` を使います。テンプレート内で独自 URL を組み立てないでください。実際の遷移先は、アプリコードの `signUp` の `emailRedirectTo` と `resetPasswordForEmail` の `redirectTo` で指定します。Supabase 公式では `{{ .ConfirmationURL }}` は verify 用 URL を含み、その URL の `redirect_to` に指定 URL が入る形式です。

### Web と iOS / Android の差分

- Web: 会社パスワードの入力、表示、コピーは表示しません。
- iOS / Android: 会社パスワードの入力、表示、コピーを利用できます。
- 初回ログイン後、端末内に旧ローカルデータがある場合はアカウントへの移行導線を表示します。Web の旧パスワード保存データは移行せず削除対象です。

### API と CORS

Web 本番は同一オリジンの `/api` を使うため、通常 CORS は不要です。iOS / Android は `EXPO_PUBLIC_API_BASE_URL` の Vercel API に Bearer token 付きでアクセスします。Vercel API 側は Cookie 認証と Bearer token 認証の両方を受け付け、API 内で認証済みユーザーを確定します。会社データの `user_id` はクライアントから渡された値を信用せず、API側の認証済みユーザーIDで設定します。

API 通信はタイムアウトと例外処理を入れています。通信失敗時はユーザー向けのエラーを表示します。

### Vercel デプロイ

Vercel では以下を設定してください。

- Framework Preset: Other
- Install Command: `npm install`
- Build Command: `npx expo export -p web`
- Output Directory: `dist`
- Environment Variables: 上記の `SUPABASE_*` と必要な `EXPO_PUBLIC_*`
- Production Branch: `deploy_nautilus` を本番として使う場合は `deploy_nautilus` に変更します。`main` を本番にする場合は、`deploy_nautilus` を `main` に merge / push してから `main` を Production Branch にしてください。
- Deployment Protection: Production は iOS / Android から API を叩くため解除してください。Preview URL をアプリから検証する場合も、その Preview の Protection を解除したURLだけを使ってください。

`vercel.json` では `single` 出力の SPA fallback を設定しています。`/api/*` は Vercel Functions に残し、それ以外の直接 URL アクセスやリロードは `/index.html` に rewrite します。

Preview Deploy は Pull Request / ブランチごとの確認用、Production Deploy は本番公開用です。iOS / Android からPreview APIを検証する場合も、Preview URLがDeployment Protectionで保護されているとAPI通信できないため、保護解除済みのPreview URLだけを `EXPO_PUBLIC_API_BASE_URL` に設定してください。

Vercel URL の切り分けは以下を目安にします。

- `/api` が 200: API の入口はデプロイされています。
- `/api/health` が 200: Vercel Functions はデプロイされています。レスポンス内の `branch` と `hasSupabaseAnonKey` を確認してください。
- `/` が 404: Production Branch が正しいブランチを見ていない、Production Deploy が未作成、または build output が `dist` になっていません。
- `/api/auth/sign-up` が 404: Vercel Functions がデプロイされていない、または別プロジェクト/別ブランチの Production URL を見ています。
- `Authentication Required` のHTML: Deployment Protection が有効です。iOS / Android からは利用できません。
- `Invalid API key`: Vercel の `SUPABASE_ANON_KEY` または `EXPO_PUBLIC_SUPABASE_ANON_KEY` が未設定・誤設定です。修正後に必ず再デプロイしてください。

### セキュリティ方針

- HTTPS 前提で運用します。
- Web では会社パスワードをアプリ側で保存しません。
- 秘密情報をクライアントバンドルへ含めません。
- 本番 API はユーザー session を検証し、Supabase RLS でユーザーごとのデータを分離します。
- エラーログにパスワード、token、個人情報を出さない方針です。
- `dangerouslySetInnerHTML` 相当の処理は使用していません。
- Vercel で `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy` を設定しています。

CSP は Expo Web のランタイムやフォント読み込みで壊れやすいため、まずは Report-Only で検証してから段階的に導入してください。

### 確認コマンド

```bash
npm install
npm run typecheck
npx expo start --web
npx expo export -p web
npx expo serve dist
```

現状、このプロジェクトには lint / test script はありません。

## ディレクトリ構成

```text
.
├─ api/                 # Vercel Functions
├─ assets/
├─ supabase/            # Supabase schema
├─ src/
│  ├─ constants/         # テーマ・レイアウト定数
│  ├─ data/              # 初期表示用モックデータ
│  ├─ features/
│  │  └─ home/
│  │     ├─ components/  # 画面固有コンポーネント
│  │     ├─ hooks/       # 状態管理
│  │     ├─ utils/       # 並び替え・整形処理
│  │     ├─ HomeScreen.tsx
│  │     └─ types.ts
│  ├─ services/          # ストレージアクセス
│  └─ ui/                # 共通 UI コンポーネント
├─ App.tsx
├─ app.json
└─ package.json
```
