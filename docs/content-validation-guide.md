# コンテンツ検証ガイド

このドキュメントでは、Hugo サイトのコンテンツ検証システムの使用方法について説明します。

## 検証システム概要

コンテンツ検証システムは以下の機能を提供します：

1. **Markdown 構文チェック**: Front Matter と Markdown 構文の検証
2. **画像リンク検証**: 画像ファイルの存在確認
3. **内部リンク検証**: サイト内リンクの整合性確認
4. **Front Matter 検証**: 必須フィールドと形式の確認

## 検証ツール

### 1. Bash スクリプト版（基本検証）

```bash
# 基本的なコンテンツ検証
./scripts/validate-content.sh

# 特定のディレクトリを検証
./scripts/validate-content.sh content/news
```

### 2. Node.js 版（詳細検証）

```bash
# 詳細なコンテンツ検証
npm run validate

# 特定のディレクトリを検証
node scripts/validate-markdown.js content/game
```

## セットアップ

### 必要な依存関係

```bash
# Node.js 依存関係のインストール
npm install
```

### 実行権限の設定

```bash
chmod +x scripts/validate-content.sh
chmod +x scripts/optimize-images.sh
```

## 検証項目

### Front Matter 検証

#### 必須フィールド

-   `title`: ページタイトル（文字列）
-   `date`: 作成日時（日付形式）
-   `draft`: 下書き状態（boolean）

#### ゲーム情報専用フィールド

-   `type`: "game"
-   `genre`: ゲームジャンル
-   `system_requirements`: システム要件
-   `screenshots`: スクリーンショット配列
-   `videos`: 動画配列

### Markdown 構文検証

#### チェック項目

1. **リンク構文**: `[テキスト](URL)` の形式確認
2. **画像構文**: `![alt](URL)` の形式確認
3. **見出し構造**: 適切な見出しレベルの使用
4. **コードブロック**: 言語指定の確認

### 画像リンク検証

#### チェック対象

1. **Markdown 内の画像**: `![alt](path)` 形式
2. **Front Matter の画像**: `featured_image`, `screenshots` 等
3. **ショートコード内の画像**: Hugo ショートコード内の画像参照

### 内部リンク検証

#### チェック対象

-   サイト内ページへのリンク
-   セクションページへのリンク
-   相対パスと絶対パスの両方

## エラーと警告

### エラー（修正必須）

-   必須 Front Matter フィールドの欠如
-   YAML 構文エラー
-   存在しない画像ファイルへの参照
-   不正な Markdown 構文

### 警告（推奨修正）

-   推奨されない日付形式
-   存在しない内部リンク
-   空の見出し
-   言語指定のないコードブロック
