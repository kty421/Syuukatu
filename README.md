# 就活管理アプリ

企業ごとの選考状況、面接で使う質問メモ、説明会や締切の日程をひとつにまとめて管理するアプリです。
インターンと本選考を切り替えながら、Webとモバイルのどちらからでも就職活動の情報を確認できます。

## 概要

就職活動で増えていく情報を「企業」「質問」「日程」の3つの画面で整理できます。

- **企業**：応募先と選考状況、ログイン情報、関連する質問や日程を管理
- **質問**：企業をまたいで、面接やES対策の質問・回答メモを整理
- **日程**：面接、説明会、提出期限などを月間カレンダーで確認

## できること

### 企業管理

- インターンと本選考を切り替えて応募先を管理
- 企業を選考状況ごとに一覧表示し、カードから選考状況をすぐに変更
- 企業名やログインIDなどのキーワードで検索
- 新しく企業を登録するほか、登録済み企業のログイン情報などを引き継いで追加
- 企業ごとに日程、質問メモ、自由メモをまとめて確認・編集
- マイページを開く、ログインIDをコピーするなどの操作に対応
- 複数の企業を選択してまとめて削除

### 質問メモ

- 質問と回答を企業に紐づけて登録し、企業を指定しない共通メモとしても保存
- 質問文、回答、企業名、ラベルを対象に検索
- ラベルによる分類と絞り込み
- タイトル順、追加日、更新日で並び替え
- ラベルの追加、名前変更、削除、並び替え
- 質問一覧から関連企業を開いて確認・編集
- 複数の質問メモを選択してまとめて削除

### 日程管理

- 月間カレンダーで予定を確認し、選択した日の予定を一覧表示
- 企業ごとに予定を作成、編集、削除
- 終日予定、開始・終了時刻のある予定、複数日にまたがる予定に対応
- 面接、GD、説明会、ES締切、Webテスト、インターン、OB訪問、面談などを管理
- 予定を色カテゴリで分類し、カテゴリの追加、編集、削除にも対応
- 予定名、日付・時刻、補足メモをまとめて記録

### アカウントと表示

- メールアドレスとパスワードによる新規登録・ログイン
- メールアドレス確認、確認メールの再送、パスワード再設定
- ログアウトとアカウント削除
- Web、iOS、Androidの画面サイズに合わせた表示
- 端末の設定に連動したライトモード／ダークモード
- モバイルでは企業サイト用パスワードを端末内に保存し、表示・非表示やコピーを切り替え
- Webではブラウザのパスワード保存機能を利用
- 以前に端末へ保存していた企業データをアカウントへ移行

## 画面イメージ

モバイルとデスクトップの主要画面です。掲載している企業名、メールアドレス、質問、予定はすべて表示確認用の架空データです。

---

<details open>
<summary><strong>認証とアカウント</strong></summary>

<br />

<table>
  <tr>
    <th width="160">画面</th>
    <th align="center">モバイル</th>
    <th align="center">デスクトップ</th>
  </tr>
  <tr>
    <td><strong>新規登録</strong></td>
    <td align="center"><img src="./docs/screenshots/mobile/signup.png" width="240" alt="モバイルの新規登録画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/signup.png" width="520" alt="デスクトップの新規登録画面" /></td>
  </tr>
  <tr>
    <td><strong>ログイン</strong></td>
    <td align="center"><img src="./docs/screenshots/mobile/login.png" width="240" alt="モバイルのログイン画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/login.png" width="520" alt="デスクトップのログイン画面" /></td>
  </tr>
  <tr>
    <td><strong>メール確認</strong></td>
    <td align="center"><img src="./docs/screenshots/mobile/email-confirm.png" width="240" alt="モバイルのメールアドレス確認画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/email-confirm.png" width="520" alt="デスクトップのメールアドレス確認画面" /></td>
  </tr>
  <tr>
    <td><strong>パスワード再設定</strong></td>
    <td align="center"><img src="./docs/screenshots/mobile/password-reset.png" width="240" alt="モバイルのパスワード再設定画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/password-reset.png" width="520" alt="デスクトップのパスワード再設定画面" /></td>
  </tr>
</table>

</details>

---

<details open>
<summary><strong>企業管理</strong></summary>

<br />

<table>
  <tr>
    <th width="160">画面</th>
    <th align="center">モバイル</th>
    <th align="center">デスクトップ</th>
  </tr>
  <tr>
    <td>
      <strong>企業一覧</strong><br />
      <sub>選考状況ごとの確認、検索、まとめて操作</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/company-list.png" width="240" alt="モバイルの企業一覧画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/company-list.png" width="520" alt="デスクトップの企業一覧画面" /></td>
  </tr>
  <tr>
    <td>
      <strong>企業追加・編集</strong><br />
      <sub>企業情報、日程、ログイン情報、質問メモを管理</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/company-create.png" width="240" alt="モバイルの企業追加・編集画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/company-create.png" width="520" alt="デスクトップの企業追加・編集画面" /></td>
  </tr>
</table>

</details>

---

<details open>
<summary><strong>質問管理</strong></summary>

<br />

<table>
  <tr>
    <th width="160">画面</th>
    <th align="center">モバイル</th>
    <th align="center">デスクトップ</th>
  </tr>
  <tr>
    <td>
      <strong>質問一覧</strong><br />
      <sub>検索、ラベル絞り込み、並び替え、まとめて操作</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/question-list.png" width="240" alt="モバイルの質問一覧画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/question-list.png" width="520" alt="デスクトップの質問一覧画面" /></td>
  </tr>
  <tr>
    <td>
      <strong>質問メモ</strong><br />
      <sub>質問内容と回答を入力</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/question-create01.png" width="240" alt="モバイルの質問メモ入力画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/question-create01.png" width="520" alt="デスクトップの質問メモ入力画面" /></td>
  </tr>
  <tr>
    <td>
      <strong>ラベル設定</strong><br />
      <sub>質問メモへラベルを設定</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/question-create02.png" width="240" alt="モバイルの質問ラベル設定画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/question-create02.png" width="520" alt="デスクトップの質問ラベル設定画面" /></td>
  </tr>
</table>

</details>

---

<details open>
<summary><strong>日程管理</strong></summary>

<br />

<table>
  <tr>
    <th width="160">画面</th>
    <th align="center">モバイル</th>
    <th align="center">デスクトップ</th>
  </tr>
  <tr>
    <td>
      <strong>日程カレンダー</strong><br />
      <sub>月間カレンダーと選択日の予定を確認</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/schedule-calendar.png" width="240" alt="モバイルの日程カレンダー画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/schedule-calendar.png" width="520" alt="デスクトップの日程カレンダー画面" /></td>
  </tr>
  <tr>
    <td>
      <strong>予定追加・編集</strong><br />
      <sub>日付、時刻、色カテゴリ、メモを設定</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/schedule-create.png" width="240" alt="モバイルの予定追加・編集画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/schedule-create.png" width="520" alt="デスクトップの予定追加・編集画面" /></td>
  </tr>
</table>

</details>

---

<details open>
<summary><strong>メニューと設定</strong></summary>

<br />

<table>
  <tr>
    <th width="160">画面</th>
    <th align="center">モバイル</th>
    <th align="center">デスクトップ</th>
  </tr>
  <tr>
    <td>
      <strong>サイドメニュー</strong><br />
      <sub>画面移動、追加操作、表示設定、アカウント操作</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/side-menu.png" width="240" alt="モバイルのサイドメニュー画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/side-menu.png" width="520" alt="デスクトップのサイドメニュー画面" /></td>
  </tr>
  <tr>
    <td>
      <strong>質問ラベル管理</strong><br />
      <sub>ラベルの追加、編集、削除、並び替え</sub>
    </td>
    <td align="center"><img src="./docs/screenshots/mobile/question-label-settings.png" width="240" alt="モバイルの質問ラベル管理画面" /></td>
    <td align="center"><img src="./docs/screenshots/desktop/question-label-settings.png" width="520" alt="デスクトップの質問ラベル管理画面" /></td>
  </tr>
</table>

</details>
