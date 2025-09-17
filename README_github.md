# 社内DX課題ヒアリングシート

## 概要
ARISガイドの皆様からDX化に関する課題・要望を収集するためのWebフォームです。

## 機能
- 📝 業務課題の入力
- 💾 回答内容のダウンロード（テキストファイル）
- 📊 入力進捗の可視化（プログレスバー）
- 📱 モバイル対応

## GitHub Pages設定手順

### 1. GitHubリポジトリの作成
1. GitHubで新しいリポジトリを作成
   - リポジトリ名: `dx-hearing-app` （または任意の名前）
   - Publicに設定

### 2. ファイルのアップロード
```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/dx-hearing-app.git
cd dx-hearing-app

# ファイルを追加
git add .
git commit -m "Initial commit: DXヒアリングフォーム"
git push origin main
```

### 3. GitHub Pagesの有効化
1. リポジトリの Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / root
4. Save

### 4. アクセスURL
設定完了後、以下のURLでアクセス可能になります：
```
https://YOUR_USERNAME.github.io/dx-hearing-app/
```

## ファイル構成
```
dx-hearing-app/
├── index.html      # メインHTML
├── script.js       # JavaScript（フォーム処理）
├── style.css       # スタイルシート
└── README.md       # このファイル
```

## 技術仕様
- 純粋なHTML/CSS/JavaScript（フレームワーク不使用）
- レスポンシブデザイン
- ローカルストレージでデータ保存
- モバイルタッチイベント対応

## 注意事項
- データは送信ボタンを押すとブラウザのローカルストレージに保存されます
- 実際の送信先サーバーは設定されていません（必要に応じて実装してください）

## ライセンス
社内利用