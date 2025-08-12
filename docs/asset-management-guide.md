# アセット管理ガイド

このドキュメントでは、Hugo サイトでの画像最適化とアセット管理の方法について説明します。

## 画像最適化システム

### 自動最適化機能

Hugo の組み込み画像処理機能により、以下の最適化が自動的に行われます：

1. **WebP 変換**: 対応ブラウザ向けに WebP 形式で配信
2. **レスポンシブ画像**: 複数サイズの画像を自動生成
3. **遅延読み込み**: `loading="lazy"` 属性の自動付与
4. **品質最適化**: 適切な圧縮率での画像出力

### 設定

`config.yaml` での画像処理設定：

```yaml
imaging:
    resampleFilter: "lanczos" # 高品質なリサンプリング
    quality: 85 # JPEG品質（1-100）
    anchor: "smart" # スマートクロッピング
    bgColor: "#ffffff" # 背景色
    hint: "photo" # 画像タイプヒント
```

## 画像の使用方法

### 1. ショートコードを使用した画像挿入

#### 基本的な画像挿入

```markdown
{{< img src="images/screenshot1.jpg" alt="ゲームプレイ画面" >}}
```

#### キャプション付き画像

```markdown
{{< img src="images/hero.jpg" alt="ヒーロー画像" caption="美しいゲーム世界" class="hero-image" >}}
```

#### レスポンシブ画像

```markdown
{{< responsive-img src="images/banner.jpg" alt="バナー" sizes="(max-width: 768px) 100vw, 50vw" >}}
```

### 2. ギャラリー表示

```markdown
{{< gallery folder="screenshots" class="game-gallery" >}}
```

### 3. テンプレート内での画像使用

```html
{{ partial "image-optimizer.html" (dict "src" "images/hero.jpg" "alt" "ヒーロー画像" "class" "hero") }}
```

## ディレクトリ構造

```
static/
├── images/
│   ├── game/              # ゲーム関連画像
│   │   ├── screenshots/   # スクリーンショット
│   │   ├── artwork/       # アートワーク
│   │   └── ui/           # UI画像
│   ├── news/             # ニュース記事用画像
│   ├── icons/            # アイコン類
│   └── placeholder.jpg   # プレースホルダー画像
├── css/                  # スタイルシート
├── js/                   # JavaScript
└── downloads/            # ダウンロードファイル
```

## 画像最適化のベストプラクティス

### 1. ファイル形式の選択

-   **JPEG**: 写真、スクリーンショット
-   **PNG**: ロゴ、アイコン、透明背景が必要な画像
-   **WebP**: 自動変換されるため、元ファイルは JPEG/PNG で OK

### 2. ファイルサイズ

-   **ヒーロー画像**: 最大 1920x1080px
-   **スクリーンショット**: 最大 1200x800px
-   **サムネイル**: 最大 400x300px
-   **アイコン**: 64x64px, 128x128px

### 3. ファイル命名規則

```
game-screenshot-01.jpg
news-article-hero-2024-01.jpg
icon-feature-multiplayer.png
ui-button-download.png
```

### 4. 品質設定

-   **高品質**: 85-95（ヒーロー画像、重要な画像）
-   **標準品質**: 75-85（一般的な画像）
-   **低品質**: 60-75（サムネイル、装飾画像）

## 手動最適化ツール

### 最適化スクリプトの使用

```bash
# 特定のディレクトリの画像を最適化
./scripts/optimize-images.sh static/images/raw static/images/optimized

# 現在のディレクトリの画像を最適化
./scripts/optimize-images.sh static/images/screenshots
```

### 必要なツール

```bash
# Ubuntu/Debian
sudo apt-get install imagemagick webp

# macOS
brew install imagemagick webp

# Windows (Chocolatey)
choco install imagemagick webp
```

## パフォーマンス最適化

### 1. 遅延読み込み

すべての画像に `loading="lazy"` が自動的に適用されます。

### 2. レスポンシブ画像

複数サイズの画像が自動生成され、デバイスに最適なサイズが配信されます。

### 3. WebP 対応

対応ブラウザには WebP 形式、非対応ブラウザには JPEG/PNG が配信されます。

### 4. CDN 最適化

GitHub Pages での配信に最適化された設定を使用しています。

## トラブルシューティング

### よくある問題

1. **画像が表示されない**

    - ファイルパスが正しいか確認
    - `static/` ディレクトリに画像が存在するか確認
    - ファイル名の大文字小文字を確認

2. **画像が最適化されない**

    - Hugo のバージョンが 0.83.0 以上か確認
    - `resources` ディレクトリの権限を確認
    - ビルドキャッシュをクリア: `hugo --gc`

3. **WebP が生成されない**

    - Hugo Extended 版を使用しているか確認
    - libwebp がインストールされているか確認

4. **画像が重い**
    - 元画像のサイズを確認
    - 品質設定を調整
    - 不要なメタデータを削除

### デバッグ方法

```bash
# Hugo の詳細ログを確認
hugo server --verbose --debug

# 生成されたリソースを確認
ls -la resources/_gen/images/

# 画像処理のテスト
hugo --gc --verbose
```

## 監視とメンテナンス

### 1. ファイルサイズの監視

定期的に以下をチェック：

-   各画像ファイルのサイズ
-   総アセットサイズ
-   ページ読み込み時間

### 2. 不要ファイルの削除

```bash
# 未使用の画像を検索
find static/images -name "*.jpg" -o -name "*.png" | while read file; do
  if ! grep -r "$(basename "$file")" content/ layouts/ >/dev/null 2>&1; then
    echo "未使用の可能性: $file"
  fi
done
```

### 3. 定期的な最適化

-   新しい画像の追加時に最適化スクリプトを実行
-   月次でアセット全体の見直し
-   パフォーマンステストの実施

## 参考リンク

-   [Hugo Image Processing](https://gohugo.io/content-management/image-processing/)
-   [WebP Image Format](https://developers.google.com/speed/webp)
-   [Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
