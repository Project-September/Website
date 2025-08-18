# GitHub Pages 設定ガイド

## 基本設定

### 1. リポジトリ設定

1. GitHub リポジトリの **Settings** タブに移動
2. 左サイドバーの **Pages** をクリック
3. **Source** で "GitHub Actions" を選択
4. **Save** をクリック

### 2. 必要な権限設定

リポジトリの **Settings > Actions > General** で以下を確認:

-   **Workflow permissions**: "Read and write permissions" を選択
-   **Allow GitHub Actions to create and approve pull requests**: チェック

### 3. 環境設定

**Settings > Environments** で `github-pages` 環境が自動作成されることを確認

## カスタムドメイン設定

### 1. DNS レコード設定

カスタムドメインを使用する場合、以下の DNS レコードを設定:

#### Apex ドメイン (example.com) の場合:

```
A    @    185.199.108.153
A    @    185.199.109.153
A    @    185.199.110.153
A    @    185.199.111.153
```

#### サブドメイン (www.example.com) の場合:

```
CNAME    www    username.github.io
```

### 2. GitHub 設定

1. リポジトリの **Settings > Pages** に移動
2. **Custom domain** にドメインを入力
3. **Enforce HTTPS** をチェック
4. **Save** をクリック

### 3. CNAME ファイル作成

カスタムドメインを使用する場合、以下のファイルを作成:

```bash
echo "your-domain.com" > static/CNAME
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. デプロイが失敗する

-   **原因**: 権限不足、設定ミス
-   **解決**: Actions 権限と Pages 設定を確認

#### 2. 404 エラーが発生

-   **原因**: baseURL 設定、ファイルパス
-   **解決**: config.yaml の baseURL 確認

#### 3. CSS が読み込まれない

-   **原因**: 相対パス、HTTPS 混在
-   **解決**: アセットパスと HTTPS 設定確認

#### 4. カスタムドメインが機能しない

-   **原因**: DNS 設定、CNAME 設定
-   **解決**: DNS 伝播待ち、CNAME 確認

### デバッグ方法

1. **Actions ログ確認**:

    - リポジトリの **Actions** タブでワークフロー実行ログを確認

2. **ローカルテスト**:

    ```bash
    hugo server -D --baseURL "http://localhost:1313"
    ```

3. **ビルドテスト**:
    ```bash
    hugo --gc --minify
    ```

## 設定例

### 本番環境用 config.yaml

```yaml
baseURL: 'https://username.github.io/repository-name'
# または
baseURL: 'https://your-custom-domain.com'
```

### 開発環境用設定

```yaml
# config/development/config.yaml
baseURL: "http://localhost:1313"
```
