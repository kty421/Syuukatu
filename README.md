# 就活管理アプリ

就職活動で増えていく企業情報、選考状況、ログイン情報、質問メモをまとめて管理するアプリです。  
インターンと本選考を切り替えながら、応募先ごとの進捗や面接準備に必要な情報をすぐ確認できます。

## 概要

就活中に散らばりがちな情報を、企業単位で整理するための個人向け管理アプリです。

企業一覧では選考状況ごとに応募先を確認でき、質問一覧では企業をまたいで面接・ES対策用のメモを見返せます。  
Web とモバイルの両方で使えるようにしています。

## 主な機能

- インターン / 本選考ごとの企業管理
- 選考状況、志望度、業界、職種、タグの記録
- 企業ごとのログインID、マイページURL、メモ管理
- 質問メモと回答メモの作成
- 企業一覧 / 質問一覧の検索
- メールアドレス認証によるアカウント登録
- Web / モバイル対応

## 画面イメージ

スクリーンショットは以下の場所に置く想定です。

```text
docs/screenshots/
├─ mobile/
└─ desktop/
```

| 画面                   | モバイル                                                                                                          | PC                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 新規登録画面           | <img src="./docs/screenshots/mobile/signup.png" width="240" alt="モバイル 新規登録画面" />                        | <img src="./docs/screenshots/desktop/signup.png" width="520" alt="PC 新規登録画面" />                        |
| ログイン画面           | <img src="./docs/screenshots/mobile/login.png" width="240" alt="モバイル ログイン画面" />                         | <img src="./docs/screenshots/desktop/login.png" width="520" alt="PC ログイン画面" />                         |
| メールアドレス確認画面 | <img src="./docs/screenshots/mobile/email-confirm.png" width="240" alt="モバイル メールアドレス確認画面" />       | <img src="./docs/screenshots/desktop/email-confirm.png" width="520" alt="PC メールアドレス確認画面" />       |
| 企業一覧画面           | <img src="./docs/screenshots/mobile/company-list.png" width="240" alt="モバイル 企業一覧画面" />                  | <img src="./docs/screenshots/desktop/company-list.png" width="520" alt="PC 企業一覧画面" />                  |
| 企業追加画面           | <img src="./docs/screenshots/mobile/company-create.png" width="240" alt="モバイル 企業追加画面" />                | <img src="./docs/screenshots/desktop/company-create.png" width="520" alt="PC 企業追加画面" />                |
| 質問一覧画面           | <img src="./docs/screenshots/mobile/question-list.png" width="240" alt="モバイル 質問一覧画面" />                 | <img src="./docs/screenshots/desktop/question-list.png" width="520" alt="PC 質問一覧画面" />                 |
| 質問追加画面１         | <img src="./docs/screenshots/mobile/question-create01.png" width="240" alt="モバイル 質問追加画面" />             | <img src="./docs/screenshots/desktop/question-create01.png" width="520" alt="PC 質問追加画面" />             |
| 質問追加画面２         | <img src="./docs/screenshots/mobile/question-create02.png" width="240" alt="モバイル 質問追加画面" />             | <img src="./docs/screenshots/desktop/question-create02.png" width="520" alt="PC 質問追加画面" />             |
| サイドメニュー画面     | <img src="./docs/screenshots/mobile/side-menu.png" width="240" alt="モバイル サイドメニュー画面" />               | <img src="./docs/screenshots/desktop/side-menu.png" width="520" alt="PC サイドメニュー画面" />               |
| 質問ラベル設定画面     | <img src="./docs/screenshots/mobile/question-label-settings.png" width="240" alt="モバイル 質問ラベル設定画面" /> | <img src="./docs/screenshots/desktop/question-label-settings.png" width="520" alt="PC 質問ラベル設定画面" /> |

## 使用技術

- React Native / Expo
- React Native Web
- Supabase
- Vercel
