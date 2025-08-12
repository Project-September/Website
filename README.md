# PC ゲーム公式サイト

Hugo 静的サイトジェネレーターを使用した PC ゲームの公式サイトです。

## 開発環境のセットアップ

### 必要な環境

-   Hugo Extended v0.148.2 以上
-   Git
-   Node.js 18 以上（オプション機能用）

### ローカル開発サーバーの起動

```bash
hugo server -D
```

### サイトのビルド

```bash
hugo
```

## デプロイメント

このサイトは GitHub Pages に自動デプロイされます。`main`ブランチにプッシュすると、GitHub Actions が自動的にサイトをビルド・デプロイします。

## ディレクトリ構造

```
website/
├── config.yaml              # Hugo設定ファイル
├── content/                 # Markdownコンテンツ
│   ├── _index.md           # ホームページ
│   ├── game/               # ゲーム情報
│   ├── news/               # ニュース・ブログ
│   └── about/              # 開発者情報
├── layouts/                # Hugoテンプレート
├── static/                 # 静的ファイル
├── assets/                 # Hugo処理対象アセット
└── .github/workflows/      # GitHub Actionsワークフロー
```

## コンテンツの更新

新しい記事やページを追加するには、`content/`ディレクトリ内に適切な Markdown ファイルを作成してください。

### 新しいニュース記事の作成例

```bash
hugo new news/posts/new-update.md
```

## 開発ガイド

詳細な開発ガイドについては、プロジェクトの仕様書を参照してください。
