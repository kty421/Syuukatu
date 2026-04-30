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

### インストール

```bash
npm install
```

## 起動方法

```bash
npm start
```

## ディレクトリ構成

```text
.
├─ assets/
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
