# デプロイメント トラブルシューティングガイド

## 概要

このガイドでは、GitHub Pages へのデプロイメントで発生する可能性のある問題と、その解決方法について説明します。

## よくある問題と解決方法

### 1. ビルドエラー

#### Hugo ビルドが失敗する

**症状**: ワークフローの「Hugo でサイトをビルド」ステップが失敗する

**よくある原因と解決方法**:

1. **Markdown 構文エラー**

    ```bash
    # ローカルで確認
    hugo --gc --minify

    # 特定のファイルをチェック
    hugo --gc --minify --verbose
    ```

2. **Front Matter 構文エラー**

    ```yaml
    # 正しい例
    ---
    title: "記事タイトル"
    date: 2024-01-01
    draft: false
    ---

    # 間違った例（クォートの不一致）
    ---
    title: "記事タイトル
    date: 2024-01-01
    ---
    ```

3. **存在しない画像への参照**

    ```bash
    # 画像リンクをチェック
    find content -name "*.md" -exec grep -l "!\[.*\](" {} \;

    # 存在しない画像を検出
    ./scripts/validate-content.sh
    ```

#### Node.js/npm エラー

**症状**: 依存関係のインストールが失敗する

**解決方法**:

```bash
# package-lock.json を再生成
rm package-lock.json
npm install

# キャッシュをクリア
npm cache clean --force
```

### 2. デプロイエラー

#### GitHub Pages 設定エラー

**症状**: ビルドは成功するがデプロイが失敗する

**確認項目**:

1. リポジトリ設定 → Pages → Source が "GitHub Actions" になっているか
2. ワークフロー権限が適切に設定されているか
3. Pages 環境が正しく設定されているか

**解決手順**:

```bash
# 1. リポジトリ設定確認
# GitHub リポジトリ → Settings → Pages
# Source: "GitHub Actions" を選択

# 2. ワークフロー権限確認
# Settings → Actions → General
# Workflow permissions: "Read and write permissions" を選択
# "Allow GitHub Actions to create and approve pull requests" をチェック
```

#### 権限エラー

**症状**: `Error: Resource not accessible by integration`

**解決方法**:

```yaml
# .github/workflows/hugo.yml で権限を確認
permissions:
    contents: read
    pages: write
    id-token: write
```

### 3. 設定エラー

#### baseURL 設定エラー

**症状**: サイトは表示されるが CSS/JS が読み込まれない

**解決方法**:

```yaml
# config.yaml で正しい baseURL を設定
baseURL: 'https://username.github.io/repository-name'

# カスタムドメインの場合
baseURL: 'https://your-domain.com'
```

#### 相対パスエラー

**症状**: 画像やリンクが正しく表示されない

**解決方法**:

```markdown
# 絶対パスを使用（推奨）

![画像](/images/screenshot.jpg)

# 相対パスは避ける

![画像](../images/screenshot.jpg)
```

### 4. カスタムドメインエラー

#### DNS 設定エラー

**症状**: カスタムドメインでアクセスできない

**確認項目**:

1. DNS レコードが正しく設定されているか
2. DNS の伝播が完了しているか（最大 48 時間）
3. CNAME ファイルが正しく配置されているか

**DNS 設定例**:

```bash
# Apex ドメイン (example.com)
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153

# サブドメイン (www.example.com)
CNAME    www    username.github.io
```

**CNAME ファイル**:

```bash
# static/CNAME ファイルを作成
echo "your-domain.com" > static/CNAME
```

## 緊急対応手順

### 1. 即座のロールバック

**GitHub Actions 経由**:

```bash
# ロールバックワークフローを手動実行
# 1. GitHub リポジトリ → Actions
# 2. "Rollback GitHub Pages" を選択
# 3. "Run workflow" をクリック
# 4. コミットSHA と理由を入力
```

**ローカルスクリプト経由**:

```bash
# ロールバックスクリプトを実行
./scripts/rollback.sh -c <commit-sha> -r "緊急バグ修正"

# インタラクティブモード
./scripts/rollback.sh
```

### 2. 手動デプロイ

**ローカルからの緊急デプロイ**:

```bash
# 1. 正常なコミットにチェックアウト
git checkout <working-commit-sha>

# 2. ローカルでビルド
hugo --gc --minify

# 3. 手動でファイルをアップロード（最終手段）
# GitHub Web UI を使用してファイルを直接アップロード
```

## 監視とアラート

### 1. 自動監視

デプロイメント監視ワークフローが以下を自動実行:

-   デプロイ失敗時の Issue 自動作成
-   エラー詳細の収集と分析
-   Slack 通知（設定済みの場合）

### 2. 手動確認

**デプロイ状況確認**:

```bash
# GitHub CLI でワークフロー状況確認
gh run list --workflow="Deploy Hugo site to Pages"

# 特定の実行詳細確認
gh run view <run-id>

# ログ確認
gh run view <run-id> --log
```

**サイト動作確認**:

```bash
# サイトアクセス確認
curl -I https://username.github.io/repository-name

# SSL証明書確認
curl -vI https://your-domain.com 2>&1 | grep -i ssl
```

## 予防策

### 1. ローカルテスト

**デプロイ前の必須チェック**:

```bash
# 1. ローカルビルドテスト
hugo --gc --minify

# 2. ローカルサーバーで確認
hugo server -D

# 3. コンテンツ検証
./scripts/validate-content.sh

# 4. リンクチェック
npm run validate
```

### 2. 段階的デプロイ

**プルリクエスト活用**:

1. 機能ブランチで開発
2. プルリクエスト作成
3. プレビュー確認
4. レビュー後にマージ

### 3. 定期メンテナンス

**月次チェック項目**:

-   [ ] Hugo バージョン更新
-   [ ] 依存関係更新
-   [ ] 壊れたリンクチェック
-   [ ] パフォーマンス確認
-   [ ] セキュリティ更新

## サポートリソース

### 公式ドキュメント

-   [Hugo Documentation](https://gohugo.io/documentation/)
-   [GitHub Pages Documentation](https://docs.github.com/pages)
-   [GitHub Actions Documentation](https://docs.github.com/actions)

### コミュニティ

-   [Hugo Community Forum](https://discourse.gohugo.io/)
-   [GitHub Community](https://github.community/)

### 緊急連絡先

-   開発者: developer@example.com
-   GitHub Issues: [リポジトリ URL]/issues

## ログ分析

### よくあるエラーメッセージ

1. **`Error: failed to render pages`**

    - 原因: テンプレートエラー、データ参照エラー
    - 解決: テンプレートファイルとデータファイルを確認

2. **`Error: failed to process images`**

    - 原因: 画像ファイルの破損、サポートされていない形式
    - 解決: 画像ファイルを確認・再生成

3. **`Error: config file not found`**

    - 原因: config.yaml の場所または構文エラー
    - 解決: ファイルパスと YAML 構文を確認

4. **`Permission denied`**
    - 原因: GitHub Actions の権限不足
    - 解決: リポジトリ設定で権限を確認

このガイドを参考に、問題の早期発見と迅速な解決を行ってください。
