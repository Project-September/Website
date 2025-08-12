#!/bin/bash

# Enhanced Image optimization script for PC Game Official Site
# 画像最適化スクリプト - レスポンシブ画像とWebP対応

set -e

# 色付きの出力用関数
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 必要なツールの確認
check_dependencies() {
    local missing_tools=()
    
    if ! command -v convert &> /dev/null; then
        missing_tools+=("imagemagick")
    fi
    
    if ! command -v cwebp &> /dev/null; then
        missing_tools+=("webp")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "以下のツールがインストールされていません:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "インストール方法:"
        echo "  Ubuntu/Debian: sudo apt-get install imagemagick webp"
        echo "  macOS: brew install imagemagick webp"
        echo "  Windows: choco install imagemagick webp"
        exit 1
    fi
}

# レスポンシブ画像の生成
optimize_image() {
    local input_file="$1"
    local output_dir="$2"
    local filename=$(basename "$input_file")
    local name="${filename%.*}"
    local ext="${filename##*.}"
    
    print_info "最適化中: $filename"
    
    # 出力ディレクトリの作成
    mkdir -p "$output_dir"
    
    # 元の画像サイズを取得
    local dimensions=$(identify -format "%wx%h" "$input_file" 2>/dev/null || echo "0x0")
    local width=$(echo $dimensions | cut -d'x' -f1)
    local height=$(echo $dimensions | cut -d'x' -f2)
    
    if [[ "$ext" =~ ^(jpg|jpeg|png)$ ]]; then
        print_info "  元のサイズ: ${width}x${height}"
        
        # レスポンシブサイズの生成 (WebP)
        cwebp -q 85 "$input_file" -resize 400 0 -o "$output_dir/${name}_400.webp" 2>/dev/null || true
        cwebp -q 85 "$input_file" -resize 800 0 -o "$output_dir/${name}_800.webp" 2>/dev/null || true
        cwebp -q 85 "$input_file" -resize 1200 0 -o "$output_dir/${name}_1200.webp" 2>/dev/null || true
        cwebp -q 85 "$input_file" -resize 1600 0 -o "$output_dir/${name}_1600.webp" 2>/dev/null || true
        
        # レスポンシブサイズの生成 (JPEG)
        convert "$input_file" -resize 400x -quality 80 -strip -interlace Plane "$output_dir/${name}_400.jpg"
        convert "$input_file" -resize 800x -quality 80 -strip -interlace Plane "$output_dir/${name}_800.jpg"
        convert "$input_file" -resize 1200x -quality 80 -strip -interlace Plane "$output_dir/${name}_1200.jpg"
        convert "$input_file" -resize 1600x -quality 80 -strip -interlace Plane "$output_dir/${name}_1600.jpg"
        
        # スクリーンショット用サムネイル (固定アスペクト比)
        convert "$input_file" -resize 400x300^ -gravity center -extent 400x300 -quality 80 -strip "$output_dir/${name}_thumb.jpg"
        cwebp -q 85 "$input_file" -resize 400 300 -crop 400 300 0 0 -o "$output_dir/${name}_thumb.webp" 2>/dev/null || true
        
        # プレースホルダー画像 (遅延読み込み用)
        convert "$input_file" -resize 20x15 -quality 20 "$output_dir/${name}_placeholder.jpg"
        
        # ブラープレースホルダー (プログレッシブ読み込み用)
        convert "$input_file" -resize 40x30 -blur 0x2 -quality 30 "$output_dir/${name}_blur.jpg"
        
        print_success "最適化完了: $filename"
        print_info "  生成されたファイル: WebP (4サイズ), JPEG (4サイズ), サムネイル, プレースホルダー"
    else
        print_warning "スキップ: $filename (対応していない形式: $ext)"
    fi
}

# ファビコンの生成
create_favicons() {
    local favicon_source="$1"
    local output_dir="$2/favicons"
    
    if [ ! -f "$favicon_source" ]; then
        print_warning "ファビコンソースが見つかりません: $favicon_source"
        return
    fi
    
    print_info "ファビコン生成中..."
    mkdir -p "$output_dir"
    
    # 各種サイズのファビコン生成
    convert "$favicon_source" -resize 16x16 "$output_dir/favicon-16x16.png"
    convert "$favicon_source" -resize 32x32 "$output_dir/favicon-32x32.png"
    convert "$favicon_source" -resize 96x96 "$output_dir/favicon-96x96.png"
    convert "$favicon_source" -resize 192x192 "$output_dir/android-chrome-192x192.png"
    convert "$favicon_source" -resize 512x512 "$output_dir/android-chrome-512x512.png"
    convert "$favicon_source" -resize 180x180 "$output_dir/apple-touch-icon.png"
    
    # ICOファイルの生成
    convert "$favicon_source" -resize 16x16 -resize 32x32 -resize 48x48 "$output_dir/favicon.ico"
    
    print_success "ファビコン生成完了"
}

# 最適化レポートの生成
generate_report() {
    local input_dir="$1"
    local output_dir="$2"
    
    print_info "最適化レポート生成中..."
    
    # 元のファイルサイズ計算
    local original_size=0
    if [ -d "$input_dir" ]; then
        original_size=$(find "$input_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) ! -path "*/optimized/*" -exec du -b {} + 2>/dev/null | awk '{sum += $1} END {print sum+0}')
    fi
    
    # 最適化後のファイルサイズ計算
    local optimized_size=0
    if [ -d "$output_dir" ]; then
        optimized_size=$(find "$output_dir" -type f -exec du -b {} + 2>/dev/null | awk '{sum += $1} END {print sum+0}')
    fi
    
    # ファイル数のカウント
    local webp_count=$(find "$output_dir" -name "*.webp" 2>/dev/null | wc -l)
    local jpg_count=$(find "$output_dir" -name "*.jpg" 2>/dev/null | wc -l)
    local png_count=$(find "$output_dir" -name "*.png" 2>/dev/null | wc -l)
    
    echo ""
    echo "📊 最適化レポート"
    echo "=================="
    
    if [ "$original_size" -gt 0 ]; then
        echo "元の画像サイズ: $(numfmt --to=iec-i --suffix=B $original_size 2>/dev/null || echo "${original_size} bytes")"
    fi
    
    if [ "$optimized_size" -gt 0 ]; then
        echo "最適化後サイズ: $(numfmt --to=iec-i --suffix=B $optimized_size 2>/dev/null || echo "${optimized_size} bytes")"
    fi
    
    if [ "$original_size" -gt 0 ] && [ "$optimized_size" -gt 0 ]; then
        local ratio=$(echo "scale=1; $optimized_size * 100 / $original_size" | bc 2>/dev/null || echo "N/A")
        echo "サイズ比率: ${ratio}% (元のサイズに対する比率)"
    fi
    
    echo "生成されたファイル:"
    echo "  - WebP: $webp_count ファイル"
    echo "  - JPEG: $jpg_count ファイル"
    echo "  - PNG: $png_count ファイル"
    echo ""
}

# メイン処理
main() {
    print_info "画像最適化スクリプトを開始します (レスポンシブ対応)"
    
    # 依存関係の確認
    check_dependencies
    
    # 引数の確認
    if [ $# -eq 0 ]; then
        print_info "使用方法:"
        echo "  $0 <入力ディレクトリ> [出力ディレクトリ]"
        echo ""
        echo "例:"
        echo "  $0 static/images static/images/optimized"
        echo "  $0 static/images/screenshots"
        echo ""
        echo "オプション:"
        echo "  --favicon <ファイル>  ファビコンも生成する"
        exit 1
    fi
    
    local input_dir="$1"
    local output_dir="${2:-$input_dir/optimized}"
    local favicon_source=""
    
    # オプション解析
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --favicon)
                favicon_source="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # 入力ディレクトリの確認
    if [ ! -d "$input_dir" ]; then
        print_error "入力ディレクトリが存在しません: $input_dir"
        exit 1
    fi
    
    print_info "入力ディレクトリ: $input_dir"
    print_info "出力ディレクトリ: $output_dir"
    
    # 画像ファイルの処理
    local processed=0
    while IFS= read -r -d '' file; do
        optimize_image "$file" "$output_dir"
        ((processed++))
    done < <(find "$input_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) ! -path "*/optimized/*" -print0 2>/dev/null)
    
    # ファビコン生成
    if [ -n "$favicon_source" ]; then
        create_favicons "$favicon_source" "$output_dir"
    fi
    
    if [ $processed -eq 0 ]; then
        print_warning "処理対象の画像ファイルが見つかりませんでした"
    else
        print_success "合計 $processed 個のファイルを処理しました"
    fi
    
    # レポート生成
    generate_report "$input_dir" "$output_dir"
    
    print_success "最適化完了!"
    echo ""
    echo "💡 使用方法のヒント:"
    echo "   - Hugo テンプレートで responsive-image ショートコードを使用"
    echo "   - lazy loading JavaScript を有効化"
    echo "   - WebP 対応ブラウザでは自動的に WebP が使用されます"
}

# スクリプトの実行
main "$@"