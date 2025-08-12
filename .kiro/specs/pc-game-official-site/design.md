# 設計文書

## 概要

小規模 PC ゲーム公式サイトは、Hugo 静的サイトジェネレーターを使用して構築される軽量で高性能な Web サイトです。一人開発者の効率性を最大化し、コンテンツ管理の簡素化とデプロイメントの自動化を実現します。

## アーキテクチャ

### 全体アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   開発環境      │    │   GitHub         │    │  GitHub Pages   │
│                 │    │                  │    │                 │
│ Hugo + Content  │───▶│  Git Repository  │───▶│   静的サイト    │
│ Markdown Files  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  GitHub Actions  │
                       │  (自動デプロイ)   │
                       └──────────────────┘

オプション:
┌─────────────────┐    ┌─────────────────┐
│   Golang API    │◄───│   JavaScript    │
│   (必要時のみ)   │    │   (フロント)     │
└─────────────────┘    └─────────────────┘
```

### 技術スタック

-   **静的サイトジェネレーター**: Hugo (Go 言語ベース)
-   **テンプレートエンジン**: Hugo Templates (Go template)
-   **スタイリング**: CSS + 最小限の JavaScript
-   **コンテンツ管理**: Markdown files
-   **バージョン管理**: Git
-   **ホスティング**: GitHub Pages
-   **CI/CD**: GitHub Actions
-   **オプションバックエンド**: Golang REST API

## コンポーネントと インターフェース

### 1. サイト構造

```
site/
├── config.yaml              # Hugo設定ファイル
├── content/                 # Markdownコンテンツ
│   ├── _index.md           # ホームページ
│   ├── game/               # ゲーム情報
│   │   ├── _index.md       # ゲーム詳細
│   │   ├── screenshots/    # スクリーンショット
│   │   └── videos/         # 動画
│   ├── news/               # ニュース・ブログ
│   │   └── posts/          # 個別記事
│   └── about/              # 開発者情報
├── layouts/                # Hugoテンプレート
│   ├── _default/           # デフォルトレイアウト
│   ├── partials/           # 部分テンプレート
│   └── shortcodes/         # ショートコード
├── static/                 # 静的ファイル
│   ├── css/                # スタイルシート
│   ├── js/                 # JavaScript
│   ├── images/             # 画像
│   └── downloads/          # ダウンロードファイル
├── assets/                 # Hugo処理対象アセット
└── public/                 # 生成された静的サイト
```

### 2. 主要コンポーネント

#### 2.1 ホームページコンポーネント

-   **ヒーローセクション**: ゲームタイトル、キャッチフレーズ、メイン画像
-   **機能紹介**: ゲームの主要機能をカード形式で表示
-   **メディアセクション**: スクリーンショットと動画のプレビュー
-   **CTA ボタン**: ダウンロード・購入リンク

#### 2.2 ゲーム詳細コンポーネント

-   **ゲーム説明**: 詳細な説明とシステム要件
-   **メディアギャラリー**: レスポンシブ画像グリッド
-   **ライトボックス**: 画像拡大表示機能

#### 2.3 ニュースコンポーネント

-   **記事一覧**: 時系列順の記事表示
-   **記事詳細**: 個別記事ページ
-   **RSS フィード**: 自動生成

#### 2.4 ナビゲーションコンポーネント

-   **ヘッダーナビ**: メインメニュー
-   **フッター**: 追加リンクと情報
-   **パンくずリスト**: 現在位置表示

### 3. インターフェース設計

#### 3.1 Hugo 設定インターフェース (config.yaml)

```yaml
baseURL: "https://username.github.io/game-site"
languageCode: "ja"
title: "ゲームタイトル"
theme: "custom-game-theme"

params:
    game:
        title: "ゲームタイトル"
        tagline: "キャッチフレーズ"
        downloadUrl: "#"
        purchaseUrl: "#"

    social:
        twitter: "@gamedev"
        youtube: "channel-id"

menu:
    main:
        - name: "ホーム"
          url: "/"
          weight: 1
        - name: "ゲーム"
          url: "/game/"
          weight: 2
        - name: "ニュース"
          url: "/news/"
          weight: 3
```

#### 3.2 コンテンツインターフェース

```yaml
# Front Matter例
---
title: "記事タイトル"
date: 2024-01-01
draft: false
tags: ["アップデート", "機能"]
featured_image: "/images/screenshot1.jpg"
---
```

#### 3.3 JavaScript API インターフェース（オプション）

```javascript
// Golang APIとの通信
const GameAPI = {
	async getStats() {
		return fetch("/api/stats").then((r) => r.json());
	},

	async submitFeedback(data) {
		return fetch("/api/feedback", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},
};
```

## データモデル

### 1. コンテンツデータモデル

#### ゲーム情報

```yaml
game:
    title: string
    tagline: string
    description: string
    genre: string
    systemRequirements:
        minimum:
            os: string
            processor: string
            memory: string
            graphics: string
            storage: string
        recommended:
            os: string
            processor: string
            memory: string
            graphics: string
            storage: string
    releaseDate: date
    price: number
    downloadUrl: string
    purchaseUrl: string
```

#### メディア

```yaml
media:
    screenshots:
        - url: string
          alt: string
          caption: string
    videos:
        - url: string
          title: string
          thumbnail: string
          type: string # "youtube", "local"
```

#### ニュース記事

```yaml
article:
    title: string
    date: date
    author: string
    tags: array[string]
    featuredImage: string
    excerpt: string
    content: markdown
```

### 2. 設定データモデル

#### サイト設定

```yaml
site:
    baseURL: string
    title: string
    description: string
    language: string

navigation:
    main: array[MenuItem]
    footer: array[MenuItem]

social:
    twitter: string
    youtube: string
    discord: string
```

## エラーハンドリング

### 1. ビルドエラー

-   **Markdown 構文エラー**: Hugo ビルド時に検出・報告
-   **画像参照エラー**: 存在しない画像への参照を警告
-   **設定エラー**: config.yaml の構文エラーを検出

### 2. デプロイメントエラー

-   **GitHub Actions 失敗**: ビルドログでエラー詳細を確認
-   **GitHub Pages 設定**: リポジトリ設定の確認手順を提供
-   **DNS 設定**: カスタムドメイン使用時の設定ガイド

### 3. ランタイムエラー（JavaScript）

```javascript
// 画像読み込みエラー
function handleImageError(img) {
	img.src = "/images/placeholder.jpg";
	img.alt = "画像を読み込めませんでした";
}

// API通信エラー（オプション機能）
async function safeApiCall(apiFunction) {
	try {
		return await apiFunction();
	} catch (error) {
		console.warn("API呼び出しに失敗しました:", error);
		return null; // 静的機能にフォールバック
	}
}
```

### 4. 404 エラー

-   カスタム 404 ページの実装
-   主要ページへのナビゲーションリンク提供

## テスト戦略

### 1. ローカルテスト

-   **Hugo 開発サーバー**: `hugo server -D` でローカル確認
-   **レスポンシブテスト**: 複数デバイスサイズでの表示確認
-   **リンクチェック**: 内部・外部リンクの動作確認

### 2. ビルドテスト

-   **GitHub Actions**: プルリクエスト時の自動ビルドテスト
-   **HTML 検証**: 生成された HTML の構文チェック
-   **パフォーマンステスト**: Lighthouse スコアの確認

### 3. デプロイテスト

-   **ステージング環境**: GitHub Pages プレビューでの確認
-   **クロスブラウザテスト**: 主要ブラウザでの動作確認
-   **モバイルテスト**: 実機での表示・操作確認

### 4. コンテンツテスト

-   **Markdown レンダリング**: 各種 Markdown 記法の表示確認
-   **画像最適化**: 画像サイズと読み込み速度の確認
-   **SEO**: メタタグと OGP の設定確認

### 5. 統合テスト（オプション機能）

-   **API 連携**: Golang API との通信テスト
-   **フォーム送信**: 問い合わせフォームの動作確認
-   **エラーハンドリング**: API 障害時の動作確認
