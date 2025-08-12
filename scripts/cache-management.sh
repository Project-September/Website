#!/bin/bash

# Cache Management Script for PC Game Official Site
# キャッシュ管理とCDN最適化スクリプト

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

# キャッシュバスティング用のハッシュ生成
generate_cache_busting() {
    local build_dir="${1:-docs}"
    
    print_info "キャッシュバスティング用ハッシュを生成中..."
    
    # CSS/JSファイルにハッシュを追加
    find "$build_dir" -name "*.css" -o -name "*.js" | while read -r file; do
        if [[ ! "$file" =~ \.[a-f0-9]{8}\. ]]; then
            local dir=$(dirname "$file")
            local filename=$(basename "$file")
            local name="${filename%.*}"
            local ext="${filename##*.}"
            local hash=$(md5sum "$file" | cut -c1-8)
            local new_name="${name}.${hash}.${ext}"
            
            mv "$file" "$dir/$new_name"
            print_info "  $filename -> $new_name"
        fi
    done
    
    print_success "キャッシュバスティング完了"
}

# Gzip圧縮の実行
enable_compression() {
    local build_dir="${1:-docs}"
    
    print_info "Gzip圧縮を実行中..."
    
    # 圧縮対象のファイル拡張子
    local extensions=("html" "css" "js" "json" "xml" "svg" "txt")
    
    for ext in "${extensions[@]}"; do
        find "$build_dir" -name "*.${ext}" | while read -r file; do
            if [ ! -f "${file}.gz" ] || [ "$file" -nt "${file}.gz" ]; then
                gzip -c "$file" > "${file}.gz"
                print_info "  圧縮: $(basename "$file")"
            fi
        done
    done
    
    print_success "Gzip圧縮完了"
}

# Brotli圧縮の実行
enable_brotli() {
    local build_dir="${1:-docs}"
    
    if ! command -v brotli &> /dev/null; then
        print_warning "brotliが見つかりません。インストールしてください:"
        print_warning "  Ubuntu/Debian: sudo apt-get install brotli"
        print_warning "  macOS: brew install brotli"
        return
    fi
    
    print_info "Brotli圧縮を実行中..."
    
    # 圧縮対象のファイル拡張子
    local extensions=("html" "css" "js" "json" "xml" "svg" "txt")
    
    for ext in "${extensions[@]}"; do
        find "$build_dir" -name "*.${ext}" | while read -r file; do
            if [ ! -f "${file}.br" ] || [ "$file" -nt "${file}.br" ]; then
                brotli -c "$file" > "${file}.br"
                print_info "  圧縮: $(basename "$file")"
            fi
        done
    done
    
    print_success "Brotli圧縮完了"
}

# CDN用のファイル構成最適化
optimize_for_cdn() {
    local build_dir="${1:-docs}"
    
    print_info "CDN用ファイル構成を最適化中..."
    
    # 静的アセット用ディレクトリの作成
    mkdir -p "$build_dir/static/css"
    mkdir -p "$build_dir/static/js"
    mkdir -p "$build_dir/static/images"
    mkdir -p "$build_dir/static/fonts"
    
    # CSSファイルの移動
    find "$build_dir" -name "*.css" -not -path "*/static/*" | while read -r file; do
        local filename=$(basename "$file")
        if [ ! -f "$build_dir/static/css/$filename" ]; then
            cp "$file" "$build_dir/static/css/"
            print_info "  CSS移動: $filename"
        fi
    done
    
    # JSファイルの移動
    find "$build_dir" -name "*.js" -not -path "*/static/*" | while read -r file; do
        local filename=$(basename "$file")
        if [ ! -f "$build_dir/static/js/$filename" ]; then
            cp "$file" "$build_dir/static/js/"
            print_info "  JS移動: $filename"
        fi
    done
    
    print_success "CDN用最適化完了"
}

# キャッシュ設定の検証
validate_cache_headers() {
    local url="${1:-http://localhost:1313}"
    
    print_info "キャッシュヘッダーを検証中..."
    
    if ! command -v curl &> /dev/null; then
        print_warning "curlが見つかりません。手動でキャッシュヘッダーを確認してください。"
        return
    fi
    
    # HTMLファイルのキャッシュヘッダー確認
    local html_cache=$(curl -s -I "$url" | grep -i "cache-control" || echo "なし")
    print_info "HTML Cache-Control: $html_cache"
    
    # CSSファイルのキャッシュヘッダー確認
    local css_url="$url/css/main.css"
    local css_cache=$(curl -s -I "$css_url" | grep -i "cache-control" || echo "なし")
    print_info "CSS Cache-Control: $css_cache"
    
    # JSファイルのキャッシュヘッダー確認
    local js_url="$url/js/main.js"
    local js_cache=$(curl -s -I "$js_url" | grep -i "cache-control" || echo "なし")
    print_info "JS Cache-Control: $js_cache"
    
    print_success "キャッシュヘッダー検証完了"
}

# Service Workerの検証
validate_service_worker() {
    local build_dir="${1:-docs}"
    
    print_info "Service Workerを検証中..."
    
    if [ ! -f "$build_dir/sw.js" ]; then
        print_error "Service Workerが見つかりません: $build_dir/sw.js"
        return 1
    fi
    
    # Service Workerの構文チェック
    if command -v node &> /dev/null; then
        if node -c "$build_dir/sw.js" 2>/dev/null; then
            print_success "Service Worker構文OK"
        else
            print_error "Service Worker構文エラー"
            return 1
        fi
    fi
    
    # キャッシュ対象ファイルの存在確認
    local missing_files=()
    
    # 主要ファイルの確認
    local required_files=("index.html" "manifest.json")
    for file in "${required_files[@]}"; do
        if [ ! -f "$build_dir/$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_warning "以下のファイルが見つかりません:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
    else
        print_success "Service Worker検証完了"
    fi
}

# パフォーマンス最適化レポート
generate_performance_report() {
    local build_dir="${1:-docs}"
    
    print_info "パフォーマンスレポートを生成中..."
    
    # ファイルサイズの計算
    local total_size=0
    local compressed_size=0
    
    # HTML, CSS, JSファイルのサイズ
    while IFS= read -r -d '' file; do
        local size=$(wc -c < "$file")
        total_size=$((total_size + size))
        
        if [ -f "${file}.gz" ]; then
            local gz_size=$(wc -c < "${file}.gz")
            compressed_size=$((compressed_size + gz_size))
        fi
    done < <(find "$build_dir" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) -print0)
    
    echo ""
    echo "📊 パフォーマンスレポート"
    echo "========================"
    echo "総ファイルサイズ: $(numfmt --to=iec-i --suffix=B $total_size 2>/dev/null || echo "${total_size} bytes")"
    
    if [ $compressed_size -gt 0 ]; then
        echo "圧縮後サイズ: $(numfmt --to=iec-i --suffix=B $compressed_size 2>/dev/null || echo "${compressed_size} bytes")"
        local ratio=$(echo "scale=1; $compressed_size * 100 / $total_size" | bc 2>/dev/null || echo "N/A")
        echo "圧縮率: ${ratio}%"
    fi
    
    # ファイル数の統計
    local html_count=$(find "$build_dir" -name "*.html" | wc -l)
    local css_count=$(find "$build_dir" -name "*.css" | wc -l)
    local js_count=$(find "$build_dir" -name "*.js" | wc -l)
    local image_count=$(find "$build_dir" -name "*.jpg" -o -name "*.png" -o -name "*.webp" | wc -l)
    
    echo ""
    echo "ファイル統計:"
    echo "  HTML: $html_count ファイル"
    echo "  CSS: $css_count ファイル"
    echo "  JavaScript: $js_count ファイル"
    echo "  画像: $image_count ファイル"
    
    # キャッシュ設定の確認
    echo ""
    echo "キャッシュ設定:"
    if [ -f "$build_dir/_headers" ]; then
        echo "  ✓ Netlify/GitHub Pages用ヘッダー設定あり"
    fi
    if [ -f "$build_dir/.htaccess" ]; then
        echo "  ✓ Apache用ヘッダー設定あり"
    fi
    if [ -f "$build_dir/sw.js" ]; then
        echo "  ✓ Service Worker設定あり"
    fi
    if [ -f "$build_dir/manifest.json" ]; then
        echo "  ✓ Web App Manifest設定あり"
    fi
    
    print_success "パフォーマンスレポート生成完了"
}

# メイン処理
main() {
    local command="${1:-help}"
    local build_dir="${2:-docs}"
    
    case "$command" in
        "compress")
            enable_compression "$build_dir"
            enable_brotli "$build_dir"
            ;;
        "optimize")
            optimize_for_cdn "$build_dir"
            enable_compression "$build_dir"
            enable_brotli "$build_dir"
            ;;
        "validate")
            validate_service_worker "$build_dir"
            validate_cache_headers "${3:-http://localhost:1313}"
            ;;
        "report")
            generate_performance_report "$build_dir"
            ;;
        "all")
            print_info "完全なキャッシュ最適化を実行中..."
            optimize_for_cdn "$build_dir"
            enable_compression "$build_dir"
            enable_brotli "$build_dir"
            validate_service_worker "$build_dir"
            generate_performance_report "$build_dir"
            ;;
        "help"|*)
            echo "キャッシュ管理スクリプト"
            echo ""
            echo "使用方法:"
            echo "  $0 <コマンド> [ビルドディレクトリ] [オプション]"
            echo ""
            echo "コマンド:"
            echo "  compress  - Gzip/Brotli圧縮を実行"
            echo "  optimize  - CDN用最適化と圧縮を実行"
            echo "  validate  - Service WorkerとCache設定を検証"
            echo "  report    - パフォーマンスレポートを生成"
            echo "  all       - すべての最適化を実行"
            echo "  help      - このヘルプを表示"
            echo ""
            echo "例:"
            echo "  $0 all docs"
            echo "  $0 validate docs http://localhost:1313"
            echo "  $0 report"
            ;;
    esac
}

# スクリプトの実行
main "$@"