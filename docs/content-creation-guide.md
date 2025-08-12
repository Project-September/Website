# コンテンツ作成ガイド

このドキュメントは、Hugo サイトでのコンテンツ作成における標準的な Front Matter の使用方法と Markdown テンプレートの使用方法を説明します。

## Front Matter 標準仕様

### 共通フィールド

すべてのコンテンツタイプで使用される共通フィールド：

```yaml
---
title: "ページタイトル" # 必須: ページのタイトル
date: 2024-01-01T00:00:00+09:00 # 必須: 作成日時（ISO 8601形式）
draft: true # 必須: 下書き状態（true/false）
---
```

### ニュース記事用 Front Matter

ニュース記事（`content/news/posts/`）で使用するフィールド：

```yaml
---
title: "記事タイトル"
date: 2024-01-01T00:00:00+09:00
draft: false
tags: ["アップデート", "機能", "お知らせ"] # 記事のタグ
featured_image: "/images/news/article1.jpg" # アイキャッチ画像
excerpt: "記事の要約文" # 記事一覧で表示される要約
author: "開発者" # 記事の著者
---
```

### ゲーム情報用 Front Matter

ゲーム情報ページ（`content/game/`）で使用するフィールド：

```yaml
---
title: "ゲームタイトル"
date: 2024-01-01T00:00:00+09:00
draft: false
type: "game"
featured_image: "/images/game/hero.jpg"
genre: "アクション"
release_date: "2024-03-01"
price: "1,980円"
download_url: "https://example.com/download"
purchase_url: "https://example.com/purchase"
system_requirements:
    minimum:
        os: "Windows 10"
        processor: "Intel Core i3-6100"
        memory: "4 GB RAM"
        graphics: "DirectX 11対応"
        storage: "2 GB"
    recommended:
        os: "Windows 11"
        processor: "Intel Core i5-8400"
        memory: "8 GB RAM"
        graphics: "GTX 1060"
        storage: "4 GB"
screenshots:
    - url: "/images/game/screenshot1.jpg"
      alt: "ゲームプレイ画面1"
      caption: "メインゲーム画面"
    - url: "/images/game/screenshot2.jpg"
      alt: "ゲームプレイ画面2"
      caption: "バトル画面"
videos:
    - url: "https://www.youtube.com/watch?v=example"
      title: "ゲームトレーラー"
      thumbnail: "/images/game/trailer-thumb.jpg"
      type: "youtube"
---
```

### 一般ページ用 Front Matter

一般的なページ（About、Contact 等）で使用するフィールド：

```yaml
---
title: "ページタイトル"
date: 2024-01-01T00:00:00+09:00
draft: false
type: "page"
featured_image: "/images/page-hero.jpg"
description: "ページの説明文（SEO用）"
---
```

## テンプレートの使用方法

### 新しいコンテンツの作成

Hugo のアーキタイプ機能を使用して、標準的なテンプレートから新しいコンテンツを作成できます：

#### ニュース記事の作成

```bash
hugo new news/posts/new-article.md
```

#### ゲーム情報ページの作成

```bash
hugo new game/game-info.md
```

#### 一般ページの作成

```bash
hugo new about/company.md
```

### テンプレートファイルの場所

-   `archetypes/default.md` - デフォルトテンプレート
-   `archetypes/news.md` - ニュース記事用テンプレート
-   `archetypes/game.md` - ゲーム情報用テンプレート
-   `archetypes/page.md` - 一般ページ用テンプレート

## Front Matter フィールド詳細

### 必須フィールド

-   `title`: ページのタイトル（文字列）
-   `date`: 作成日時（ISO 8601 形式）
-   `draft`: 下書き状態（boolean）

### オプションフィールド

-   `tags`: タグの配列（ニュース記事用）
-   `featured_image`: アイキャッチ画像のパス
-   `excerpt`: 記事の要約（ニュース記事用）
-   `author`: 著者名（ニュース記事用）
-   `type`: コンテンツタイプ
-   `description`: ページの説明（SEO 用）

### ゲーム専用フィールド

-   `genre`: ゲームジャンル
-   `release_date`: リリース日
-   `price`: 価格
-   `download_url`: ダウンロード URL
-   `purchase_url`: 購入 URL
-   `system_requirements`: システム要件（オブジェクト）
-   `screenshots`: スクリーンショット配列
-   `videos`: 動画配列

## ベストプラクティス

### 1. 日付形式

ISO 8601 形式を使用してください：

```yaml
date: 2024-01-01T15:30:00+09:00
```

### 2. 画像パス

静的ファイルは `/static/` ディレクトリに配置し、Front Matter では `/` から始まるパスを使用：

```yaml
featured_image: "/images/news/article1.jpg"
```

### 3. タグの命名規則

-   日本語を使用
-   一貫性のある命名
-   例: "アップデート", "機能", "お知らせ", "ベータテスト", "リリース"

### 4. 下書き管理

-   作業中のコンテンツは `draft: true` に設定
-   公開準備ができたら `draft: false` に変更

### 5. SEO 対策

-   `title` は検索エンジンに適した長さ（30-60 文字）
-   `description` を設定してページの概要を明確に
-   `featured_image` を設定してソーシャルメディア共有時の表示を改善

## トラブルシューティング

### よくある問題

1. **日付形式エラー**

    - 正しい ISO 8601 形式を使用しているか確認
    - タイムゾーン（+09:00）が含まれているか確認

2. **画像が表示されない**

    - 画像ファイルが `/static/` ディレクトリに存在するか確認
    - パスが `/` から始まっているか確認

3. **タグが機能しない**

    - 配列形式で記述されているか確認
    - 引用符で囲まれているか確認

4. **ページが表示されない**
    - `draft: false` に設定されているか確認
    - ファイル名に不正な文字が含まれていないか確認
